-- ============================================================
-- SEVIMLI — миграция 013: назначение ролей для админки.
-- Роль в profiles защищена триггером protect_profile_columns (клиент её менять не может).
-- set_user_role(email, role) — только service_role (скрипт `npm run make-admin -- <email>`).
-- Применять после 012. Идемпотентна.
-- ============================================================

create or replace function public.set_user_role(p_email text, p_role text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
begin
  if p_role not in ('buyer', 'seller', 'admin') then
    raise exception 'unknown role %', p_role using errcode = '22023';
  end if;
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_id is null then raise exception 'user_not_found' using errcode = 'P0002'; end if;
  perform set_config('sevimli.bypass', '1', true);
  update public.profiles set role = p_role where id = v_id;
  return v_id;
end;
$$;
revoke execute on function public.set_user_role(text, text) from public, anon, authenticated;
