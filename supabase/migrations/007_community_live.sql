-- ============================================================
-- SEVIMLI — миграция 007: сообщество «вживую».
-- Модерация (жалобы → автоскрытие после 3), автопометка «Реклама»
-- (аккаунт продавца или промокод в тексте), лимит 5 постов за 24 ч,
-- атомарный лайк toggle_post_like, ограничения содержимого, индексы,
-- Storage-бакет community для фото постов, демо-разметка is_demo.
-- Применять после 001–006. Идемпотентна (можно перезапускать).
--
-- ВАЖНО: переопределяет политику "posts_read" из 002 (скрытые посты видят
-- только автор и админ). Повторный прогон 002 вернёт её к using(true) —
-- после 002 сразу снова прогнать 007. Запросы приложения (lib/data.ts)
-- дополнительно фильтруют hidden = false (защита в глубину).
-- ============================================================

-- ---------- 1. Колонки модерации и демо-разметки ----------
alter table public.community_posts add column if not exists hidden        boolean not null default false;
alter table public.community_posts add column if not exists is_ad         boolean not null default false;
alter table public.community_posts add column if not exists reports_count int     not null default 0;
alter table public.community_posts add column if not exists is_demo       boolean not null default false;
alter table public.post_comments     add column if not exists is_demo boolean not null default false;
alter table public.product_questions add column if not exists is_demo boolean not null default false;
alter table public.product_answers   add column if not exists is_demo boolean not null default false;

-- ---------- 2. Ограничения содержимого ----------
-- Фото: не больше 2, только ссылки ≤600 символов (data:-URL из демо-режима в базу не попадают).
create or replace function public.post_images_ok(p_images text[])
returns boolean
language sql
immutable
as $$
  select coalesce(array_length(p_images, 1), 0) <= 2
     and not exists (
       select 1 from unnest(coalesce(p_images, '{}'::text[])) as u
       where u like 'data:%' or char_length(u) > 600
     )
$$;

alter table public.community_posts drop constraint if exists posts_text_len;
alter table public.community_posts add constraint posts_text_len
  check (char_length(btrim(text)) between 1 and 2000) not valid;
alter table public.community_posts drop constraint if exists posts_images_ok;
alter table public.community_posts add constraint posts_images_ok
  check (public.post_images_ok(images)) not valid;
alter table public.community_posts drop constraint if exists posts_tags_max;
alter table public.community_posts add constraint posts_tags_max
  check (coalesce(array_length(tags, 1), 0) <= 5) not valid;

alter table public.post_comments drop constraint if exists comments_text_len;
alter table public.post_comments add constraint comments_text_len
  check (char_length(btrim(text)) between 1 and 1000) not valid;
alter table public.product_questions drop constraint if exists questions_text_len;
alter table public.product_questions add constraint questions_text_len
  check (char_length(btrim(text)) between 1 and 1000) not valid;
alter table public.product_answers drop constraint if exists answers_text_len;
alter table public.product_answers add constraint answers_text_len
  check (char_length(btrim(text)) between 1 and 2000) not valid;

-- ---------- 3. Автопометка «Реклама» ----------
-- Маркеры промокода — продуктовое решение; список правится здесь (без изменения схемы).
create or replace function public.has_promo_code(p_text text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_text, '') ~* '(промо-?код|promo[ _-]?code|promokod|купон|kupon|по\s+промо|по\s+коду|код\s+на\s+скидк|chegirma\s+kodi|use\s+code|referral|реферал)'
$$;

-- Аккаунт-продавец: владеет магазином или роль seller (become_seller()).
create or replace function public.is_seller_account(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_uid is not null and (
    exists (select 1 from public.shops s where s.owner_id = p_uid)
    or exists (select 1 from public.profiles p where p.id = p_uid and p.role = 'seller')
  )
$$;

-- Переопределение штампа автора из 004. Триггеры trg_stamp_post_author /
-- trg_stamp_comment_author / trg_stamp_question_author остаются привязаны к функции.
-- Для community_posts дополнительно: is_ad; на UPDATE автор не может менять
-- likes, hidden, reports_count, is_demo и created_at.
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
  if public.sys_bypass() or public.is_admin() then return new; end if;
  select coalesce(nullif(name, ''), 'Пользователь'), city into v_name, v_city
    from public.profiles where id = auth.uid();
  new.author_id := auth.uid();
  new.author_name := coalesce(v_name, 'Пользователь');
  new.is_demo := false;
  if tg_table_name = 'community_posts' then
    new.author_city := v_city;
    if tg_op = 'INSERT' then
      new.likes := 0;
      new.hidden := false;
      new.reports_count := 0;
    else
      new.likes := old.likes;
      new.hidden := old.hidden;              -- автор не может «разскрыть» пост
      new.reports_count := old.reports_count;
      new.is_demo := old.is_demo;
      new.created_at := old.created_at;      -- и не может «поднять» его в ленте
    end if;
    new.is_ad := public.is_seller_account(auth.uid()) or public.has_promo_code(new.text);
  end if;
  return new;
end;
$$;

-- ---------- 4. Лимит: не больше 5 постов за 24 часа ----------
-- Считаем по auth.uid(), а не по new.author_id — не зависим от порядка триггеров
-- (PG запускает BEFORE-триггеры по алфавиту имён: trg_enforce_post_limit < trg_stamp_post_author).
-- Без auth.uid() (service_role / сид) лимит не применяется: анонима отсечёт RLS posts_insert_own.
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
  select count(*) into v_cnt
    from public.community_posts
   where author_id = auth.uid() and created_at > now() - interval '24 hours';
  if v_cnt >= 5 then
    raise exception 'post_limit_exceeded' using errcode = 'P0001', hint = 'max 5 posts per 24h';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_enforce_post_limit on public.community_posts;
create trigger trg_enforce_post_limit
  before insert on public.community_posts
  for each row execute function public.enforce_post_limit();

-- ---------- 5. Жалобы: одна на пост от пользователя, 3 жалобы → скрыт ----------
create table if not exists public.post_reports (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  reason     text check (reason is null or char_length(reason) <= 300),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.post_reports enable row level security;

drop policy if exists "post_reports_insert_own" on public.post_reports;
create policy "post_reports_insert_own" on public.post_reports for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.community_posts p where p.id = post_id and p.author_id = auth.uid())
  );
drop policy if exists "post_reports_read_own" on public.post_reports;
create policy "post_reports_read_own" on public.post_reports for select
  using (auth.uid() = user_id or public.is_admin());
drop policy if exists "post_reports_delete_admin" on public.post_reports;
create policy "post_reports_delete_admin" on public.post_reports for delete
  using (public.is_admin());

-- Пересчёт жалоб и автоскрытие. ОБЯЗАТЕЛЬНО с bypass: иначе stamp_post_author на UPDATE
-- перепишет author_id на жалобщика (урок 005), а RLS posts_update_own не пустит чужой UPDATE.
-- Скрытие «липкое»: снять hidden может только админ (update … set hidden = false).
create or replace function public.sync_post_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post uuid := coalesce(new.post_id, old.post_id);
  v_cnt  int;
begin
  perform set_config('sevimli.bypass', '1', true);
  select count(*) into v_cnt from public.post_reports r where r.post_id = v_post;
  update public.community_posts p
     set reports_count = v_cnt,
         hidden = (p.hidden or v_cnt >= 3)
   where p.id = v_post;
  return null;
end;
$$;
drop trigger if exists trg_sync_post_reports on public.post_reports;
create trigger trg_sync_post_reports
  after insert or delete on public.post_reports
  for each row execute function public.sync_post_reports();

-- ---------- 6. Атомарный лайк (без гонок двойного клика и 23505 на клиенте) ----------
-- likes пересчитывает trg_sync_post_likes (004/005) внутри той же транзакции.
-- insert … on conflict do nothing → «уже стоял» → снимаем: параллельные вызовы не дают 23505.
create or replace function public.toggle_post_like(p_post uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_liked boolean;
  v_likes int;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if not exists (select 1 from public.community_posts where id = p_post and not hidden) then
    raise exception 'post not found' using errcode = 'P0002';
  end if;
  insert into public.post_likes (user_id, post_id) values (v_uid, p_post)
  on conflict (user_id, post_id) do nothing;
  if found then
    v_liked := true;
  else
    delete from public.post_likes where user_id = v_uid and post_id = p_post;
    v_liked := false;
  end if;
  select likes into v_likes from public.community_posts where id = p_post;
  return jsonb_build_object('liked', v_liked, 'likes', coalesce(v_likes, 0));
end;
$$;
revoke execute on function public.toggle_post_like(uuid) from public, anon;
grant execute on function public.toggle_post_like(uuid) to authenticated;

-- ---------- 7. Чтение: скрытые посты видят только автор и админ ----------
drop policy if exists "posts_read" on public.community_posts;
create policy "posts_read" on public.community_posts for select
  using (not hidden or auth.uid() = author_id or public.is_admin());

-- ---------- 8. Индексы ----------
create index if not exists idx_posts_author_created  on public.community_posts(author_id, created_at desc);
create index if not exists idx_posts_visible_created on public.community_posts(created_at desc) where not hidden;
create index if not exists idx_posts_visible_likes   on public.community_posts(likes desc, created_at desc) where not hidden;
create index if not exists idx_posts_tags_gin        on public.community_posts using gin(tags);
create index if not exists idx_post_likes_post       on public.post_likes(post_id);
create index if not exists idx_post_reports_post     on public.post_reports(post_id);

-- ---------- 9. Storage: бакет community (фото постов) ----------
-- Отдельные политики с НОВЫМИ именами: политики storage_* из 004 не трогаем
-- (повторный прогон 004 иначе откатил бы правки). Путь обязан начинаться с <uid>/.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community', 'community', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community_public_read" on storage.objects;
create policy "community_public_read" on storage.objects for select
  using (bucket_id = 'community');
drop policy if exists "community_owner_insert" on storage.objects;
create policy "community_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "community_owner_update" on storage.objects;
create policy "community_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "community_owner_delete" on storage.objects;
create policy "community_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 10. Демо-контент сообщества: очистка вместе с clear_demo ----------
-- Демо-посты/вопросы сидятся service_role (bypass) с is_demo = true и author_id = null;
-- удаляются этой функцией. Доступ только service_role — через revoke execute (как clear_demo из 004).
create or replace function public.clear_demo_community()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('sevimli.bypass', '1', true);
  delete from public.product_answers   where is_demo;
  delete from public.product_questions where is_demo;
  delete from public.post_comments     where is_demo;
  delete from public.community_posts   where is_demo;
end;
$$;
revoke execute on function public.clear_demo_community() from public, anon, authenticated;
