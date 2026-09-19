-- ============================================================
-- SEVIMLI — миграция 009: закалка сообщества (по итогам ревью 007/008).
--  • штампы автора: created_at/is_demo/demo_key/author_avatar не подделать; на UPDATE автор
--    берётся из OLD (каскад «товар удалён → product_id = null» больше не переписывает автора);
--    service_role/каскады без auth.uid() не штампуются; админ штампуется как все, но может менять hidden
--  • «Реклама» только у владельцев НЕ демо-магазинов (демо-аккаунт стенда — не реклама)
--  • лимит постов: advisory-lock от гонок; владелец демо-магазина (стенд жюри) без лимита
--  • лимит 30 записей/час на комментарии, вопросы, ответы, жалобы
--  • автоскрытие по жалобам: считаются аккаунты старше суток; демо-посты не скрываются
--  • демо-лайки: seed_likes + count(post_likes) — не обнуляются первым живым лайком
--  • теги: ≤30 символов, только буквы/цифры/_/-/апостроф; текст не из одних пробелов
--  • политики: админ правит/удаляет; автор удаляет свои комментарии/вопросы/ответы;
--    комментарий только к нескрытому посту; лайки только через RPC; чужие лайки не читаются;
--    листинг бакета community — только своя папка
-- Применять после 008. Идемпотентна.
-- ============================================================

-- ---------- 1. Демо-лайки: seed_likes ----------
alter table public.community_posts add column if not exists seed_likes int not null default 0;

create or replace function public.sync_post_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('sevimli.bypass', '1', true);
  update public.community_posts p
     set likes = p.seed_likes + (select count(*) from public.post_likes l where l.post_id = coalesce(new.post_id, old.post_id))
   where p.id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$;

-- ---------- 2. «Реклама»: владелец реального (не демо) магазина ----------
create or replace function public.is_seller_account(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_uid is not null and exists (
    select 1 from public.shops s where s.owner_id = p_uid and not s.is_demo
  )
$$;
revoke execute on function public.is_seller_account(uuid) from public, anon, authenticated;

-- ---------- 3. Штамп автора ----------
-- INSERT: автор/город/время из сессии, служебные поля обнуляются.
-- UPDATE: автор, время, лайки, жалобы, демо-поля — из OLD; hidden меняет только админ.
-- Без auth.uid() (service_role, сид, RI-каскады) и при bypass — строка не трогается.
create or replace function public.stamp_post_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_city text;
begin
  if public.sys_bypass() or auth.uid() is null then return new; end if;

  if tg_op = 'INSERT' then
    select coalesce(nullif(name, ''), 'Пользователь'), city into v_name, v_city
      from public.profiles where id = auth.uid();
    new.author_id   := auth.uid();
    new.author_name := coalesce(v_name, 'Пользователь');
    new.created_at  := now();
    new.is_demo     := false;
    new.demo_key    := null;
    if tg_table_name = 'community_posts' then
      new.author_city   := v_city;
      new.author_avatar := null;   -- аватар живых авторов — только из public_profiles
      new.likes         := 0;
      new.seed_likes    := 0;
      new.hidden        := false;
      new.reports_count := 0;
      new.is_ad := public.is_seller_account(auth.uid()) or public.has_promo_code(new.text);
    end if;
    return new;
  end if;

  -- UPDATE
  new.author_id   := old.author_id;
  new.author_name := old.author_name;
  new.created_at  := old.created_at;
  new.is_demo     := old.is_demo;
  new.demo_key    := old.demo_key;
  if tg_table_name = 'community_posts' then
    new.author_city   := old.author_city;
    new.author_avatar := old.author_avatar;
    new.likes         := old.likes;
    new.seed_likes    := old.seed_likes;
    new.reports_count := old.reports_count;
    if not public.is_admin() then new.hidden := old.hidden; end if;
    new.is_ad := public.is_seller_account(old.author_id) or public.has_promo_code(new.text);
  end if;
  return new;
end;
$$;

create or replace function public.stamp_answer_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_is_seller boolean;
begin
  if public.sys_bypass() or auth.uid() is null then return new; end if;
  select coalesce(nullif(name, ''), 'Пользователь') into v_name from public.profiles where id = auth.uid();
  select exists (
    select 1 from public.product_questions q
    join public.products p on p.id = q.product_id
    join public.shops s on s.id = p.shop_id
    where q.id = new.question_id and s.owner_id = auth.uid()
  ) into v_is_seller;
  new.author_id := auth.uid();
  new.author_name := case when v_is_seller
    then (select s.name from public.product_questions q join public.products p on p.id = q.product_id
          join public.shops s on s.id = p.shop_id where q.id = new.question_id)
    else v_name end;
  new.is_seller  := v_is_seller;
  new.created_at := now();
  new.is_demo    := false;
  new.demo_key   := null;
  return new;
end;
$$;

-- ---------- 4. Лимит постов: без гонок; стенд жюри без лимита ----------
create or replace function public.enforce_post_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cnt int;
begin
  if public.sys_bypass() or public.is_admin() or auth.uid() is null then return new; end if;
  -- Владелец демо-магазина = общий демо-аккаунт стенда: лимит не применяем
  if exists (select 1 from public.shops s where s.owner_id = auth.uid() and s.is_demo) then return new; end if;
  perform pg_advisory_xact_lock(hashtext('post_limit:' || auth.uid()::text));
  select count(*) into v_cnt
    from public.community_posts
   where author_id = auth.uid() and created_at > now() - interval '24 hours';
  if v_cnt >= 5 then
    raise exception 'post_limit_exceeded' using errcode = 'P0001', hint = 'max 5 posts per 24h';
  end if;
  return new;
end;
$$;

-- ---------- 5. Лимит 30 записей/час: комментарии, вопросы, ответы, жалобы ----------
create or replace function public.enforce_write_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cnt int;
  v_col text := case when tg_table_name = 'post_reports' then 'user_id' else 'author_id' end;
begin
  if public.sys_bypass() or public.is_admin() or auth.uid() is null then return new; end if;
  perform pg_advisory_xact_lock(hashtext(tg_table_name || ':' || auth.uid()::text));
  execute format('select count(*) from public.%I where %I = $1 and created_at > now() - interval ''1 hour''', tg_table_name, v_col)
    into v_cnt using auth.uid();
  if v_cnt >= 30 then
    raise exception 'write_limit_exceeded' using errcode = 'P0001', hint = 'max 30 per hour';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_enforce_write_limit on public.post_comments;
create trigger trg_enforce_write_limit before insert on public.post_comments
  for each row execute function public.enforce_write_limit();
drop trigger if exists trg_enforce_write_limit on public.product_questions;
create trigger trg_enforce_write_limit before insert on public.product_questions
  for each row execute function public.enforce_write_limit();
drop trigger if exists trg_enforce_write_limit on public.product_answers;
create trigger trg_enforce_write_limit before insert on public.product_answers
  for each row execute function public.enforce_write_limit();
drop trigger if exists trg_enforce_write_limit on public.post_reports;
create trigger trg_enforce_write_limit before insert on public.post_reports
  for each row execute function public.enforce_write_limit();

-- ---------- 6. Жалобы: скрывают только «зрелые» аккаунты; демо-посты не скрываются ----------
create or replace function public.sync_post_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post   uuid := coalesce(new.post_id, old.post_id);
  v_total  int;
  v_mature int;
begin
  perform set_config('sevimli.bypass', '1', true);
  select count(*) into v_total from public.post_reports r where r.post_id = v_post;
  select count(*) into v_mature
    from public.post_reports r join public.profiles pr on pr.id = r.user_id
   where r.post_id = v_post and pr.created_at < now() - interval '1 day';
  update public.community_posts p
     set reports_count = v_total,
         hidden = (p.hidden or (v_mature >= 3 and not p.is_demo and p.author_id is not null))
   where p.id = v_post;
  return null;
end;
$$;

-- ---------- 7. Ограничения содержимого ----------
create or replace function public.post_tags_ok(p_tags text[])
returns boolean
language sql
immutable
as $$
  select coalesce(array_length(p_tags, 1), 0) <= 5
     and not exists (
       select 1 from unnest(coalesce(p_tags, '{}'::text[])) as t
       where t !~ '^[[:alnum:]_''ʼ-]{1,30}$'
     )
$$;
alter table public.community_posts drop constraint if exists posts_tags_max;
alter table public.community_posts drop constraint if exists posts_tags_ok;
alter table public.community_posts add constraint posts_tags_ok
  check (public.post_tags_ok(tags)) not valid;

alter table public.community_posts drop constraint if exists posts_text_len;
alter table public.community_posts add constraint posts_text_len
  check (char_length(text) <= 2000 and text ~ '\S') not valid;
alter table public.post_comments drop constraint if exists comments_text_len;
alter table public.post_comments add constraint comments_text_len
  check (char_length(text) <= 1000 and text ~ '\S') not valid;
alter table public.product_questions drop constraint if exists questions_text_len;
alter table public.product_questions add constraint questions_text_len
  check (char_length(text) <= 1000 and text ~ '\S') not valid;
alter table public.product_answers drop constraint if exists answers_text_len;
alter table public.product_answers add constraint answers_text_len
  check (char_length(text) <= 2000 and text ~ '\S') not valid;

alter table public.community_posts drop constraint if exists posts_author_avatar_ok;
alter table public.community_posts add constraint posts_author_avatar_ok
  check (author_avatar is null or (is_demo and author_avatar not like 'data:%' and char_length(author_avatar) <= 600)) not valid;

-- ---------- 8. Политики ----------
-- Админ: правка и удаление постов, удаление комментариев/вопросов/ответов
drop policy if exists "posts_admin_update" on public.community_posts;
create policy "posts_admin_update" on public.community_posts for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "posts_admin_delete" on public.community_posts;
create policy "posts_admin_delete" on public.community_posts for delete using (public.is_admin());
drop policy if exists "comments_delete_own_or_admin" on public.post_comments;
create policy "comments_delete_own_or_admin" on public.post_comments for delete
  using (auth.uid() = author_id or public.is_admin());
drop policy if exists "questions_delete_own_or_admin" on public.product_questions;
create policy "questions_delete_own_or_admin" on public.product_questions for delete
  using (auth.uid() = author_id or public.is_admin());
drop policy if exists "answers_delete_own_or_admin" on public.product_answers;
create policy "answers_delete_own_or_admin" on public.product_answers for delete
  using (auth.uid() = author_id or public.is_admin());

-- Комментарий — только к нескрытому посту
drop policy if exists "comments_insert_own" on public.post_comments;
create policy "comments_insert_own" on public.post_comments for insert to authenticated
  with check (
    auth.uid() = author_id
    and exists (select 1 from public.community_posts p where p.id = post_id and not p.hidden)
  );

-- Лайки: только через RPC toggle_post_like; чужие лайки не читаются
drop policy if exists "post_likes_insert_own" on public.post_likes;
drop policy if exists "post_likes_delete_own" on public.post_likes;
drop policy if exists "post_likes_read" on public.post_likes;
create policy "post_likes_read" on public.post_likes for select
  using (auth.uid() = user_id or public.is_admin());

-- Storage: листинг бакета community — только своя папка (публичная отдача файлов идёт без RLS)
drop policy if exists "community_public_read" on storage.objects;
drop policy if exists "community_owner_read" on storage.objects;
create policy "community_owner_read" on storage.objects for select to authenticated
  using (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 9. Сид демо-контента: seed_likes ----------
create or replace function public.seed_demo_community(
  p_posts jsonb, p_comments jsonb, p_questions jsonb, p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_post_map jsonb := '{}'::jsonb;
  v_q_map    jsonb := '{}'::jsonb;
  v_id       uuid;
  v_product  uuid;
  n_posts int := 0; n_comments int := 0; n_questions int := 0; n_answers int := 0;
begin
  perform set_config('sevimli.bypass', '1', true);
  perform public.clear_demo_community();

  for r in select * from jsonb_to_recordset(p_posts) as x(
    key text, author_name text, author_city text, author_avatar text, kind text, text text,
    images text[], tags text[], product_name text, likes int, created_at timestamptz)
  loop
    v_product := null;
    if r.product_name is not null then
      select p.id into v_product from public.products p
        join public.shops s on s.id = p.shop_id
       where s.is_demo and p.name = r.product_name
       order by p.created_at limit 1;
    end if;
    insert into public.community_posts (author_id, author_name, author_city, author_avatar, kind, text,
                                        images, tags, product_id, likes, seed_likes, created_at, is_demo, demo_key)
    values (null, r.author_name, r.author_city, r.author_avatar, coalesce(r.kind, 'review'), r.text,
            coalesce(r.images, '{}'), coalesce(r.tags, '{}'), v_product, coalesce(r.likes, 0), coalesce(r.likes, 0),
            coalesce(r.created_at, now()), true, r.key)
    returning id into v_id;
    v_post_map := v_post_map || jsonb_build_object(r.key, v_id);
    n_posts := n_posts + 1;
  end loop;

  for r in select * from jsonb_to_recordset(p_comments) as x(
    key text, post_key text, author_name text, text text, created_at timestamptz)
  loop
    if v_post_map ? r.post_key then
      insert into public.post_comments (post_id, author_id, author_name, text, created_at, is_demo, demo_key)
      values ((v_post_map ->> r.post_key)::uuid, null, r.author_name, r.text, coalesce(r.created_at, now()), true, r.key);
      n_comments := n_comments + 1;
    end if;
  end loop;

  for r in select * from jsonb_to_recordset(p_questions) as x(
    key text, product_name text, author_name text, text text, created_at timestamptz)
  loop
    select p.id into v_product from public.products p
      join public.shops s on s.id = p.shop_id
     where s.is_demo and p.name = r.product_name
     order by p.created_at limit 1;
    if v_product is not null then
      insert into public.product_questions (product_id, author_id, author_name, text, created_at, is_demo, demo_key)
      values (v_product, null, r.author_name, r.text, coalesce(r.created_at, now()), true, r.key)
      returning id into v_id;
      v_q_map := v_q_map || jsonb_build_object(r.key, v_id);
      n_questions := n_questions + 1;
    end if;
  end loop;

  for r in select * from jsonb_to_recordset(p_answers) as x(
    key text, question_key text, author_name text, is_seller boolean, text text, created_at timestamptz)
  loop
    if v_q_map ? r.question_key then
      insert into public.product_answers (question_id, author_id, author_name, is_seller, text, created_at, is_demo, demo_key)
      values ((v_q_map ->> r.question_key)::uuid, null, r.author_name, coalesce(r.is_seller, false), r.text,
              coalesce(r.created_at, now()), true, r.key);
      n_answers := n_answers + 1;
    end if;
  end loop;

  return jsonb_build_object('posts', n_posts, 'comments', n_comments, 'questions', n_questions, 'answers', n_answers);
end;
$$;
revoke execute on function public.seed_demo_community(jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;

-- Уже засеянные демо-посты: базовые лайки в seed_likes (триггер штампа при auth.uid() = null не вмешивается)
update public.community_posts set seed_likes = likes where is_demo and seed_likes = 0 and likes > 0;
