-- ============================================================
-- SEVIMLI — миграция 005: счётчик лайков поста обновляется системной функцией
-- (триггер-штамп автора на UPDATE иначе возвращает likes к старому значению).
-- ============================================================

create or replace function public.sync_post_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('sevimli.bypass', '1', true);
  update public.community_posts p
     set likes = (select count(*) from public.post_likes l where l.post_id = coalesce(new.post_id, old.post_id))
   where p.id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$;
