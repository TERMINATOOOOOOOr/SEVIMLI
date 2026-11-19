-- ============================================================
-- SEVIMLI — миграция 019: коды подлинности сняты с площадки.
-- Страниц проверки и выпуска больше нет. Таблица authenticity_codes и её строки остаются
-- как архив, доступ только у service_role.
-- Применять после выкладки кода без /verify и /seller/codes. Идемпотентна.
-- После повторного прогона 004 или 012 выполнить ещё раз.
-- ============================================================

revoke execute on function public.verify_code(text) from public, anon, authenticated;
revoke execute on function public.issue_codes(uuid, uuid, int, text, text, text, date, date)
  from public, anon, authenticated;

drop policy if exists "auth_codes_seller_manage" on public.authenticity_codes;
revoke all on table public.authenticity_codes from anon, authenticated;

comment on table public.authenticity_codes is 'Архив: коды подлинности отключены, данные сохранены';
