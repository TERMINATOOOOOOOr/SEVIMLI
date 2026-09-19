-- ============================================================
-- SEVIMLI — миграция 008: демо-контент сообщества для стенда.
-- demo_key (cp1/cc1/q1/qa1…) сохраняет UZ-переводы демо-постов; author_avatar —
-- аватар героини демо (у живых постов аватар берётся из public_profiles).
-- seed_demo_community(...) — только service_role (как seed_demo из 004):
-- удаляет прежний демо-контент и сидит заново, товары находит по имени
-- среди товаров демо-магазинов (shops.is_demo).
-- Применять после 007. Идемпотентна.
-- ============================================================

alter table public.community_posts   add column if not exists demo_key text;
alter table public.community_posts   add column if not exists author_avatar text;
alter table public.post_comments     add column if not exists demo_key text;
alter table public.product_questions add column if not exists demo_key text;
alter table public.product_answers   add column if not exists demo_key text;

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
                                        images, tags, product_id, likes, created_at, is_demo, demo_key)
    values (null, r.author_name, r.author_city, r.author_avatar, coalesce(r.kind, 'review'), r.text,
            coalesce(r.images, '{}'), coalesce(r.tags, '{}'), v_product, coalesce(r.likes, 0),
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
