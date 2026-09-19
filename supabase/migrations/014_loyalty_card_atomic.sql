-- ============================================================
-- SEVIMLI — миграция 014: выдача номера карты лояльности — атомарно.
-- Два параллельных вызова ensure_loyalty_card() (например, две вкладки) раньше могли выдать
-- разные номера: оба видели пустое поле, побеждала последняя запись, а интерфейс показывал первую.
-- Теперь: блокировка на пользователя + запись только в пустое поле + возврат того, что в базе.
-- Применять после 013. Идемпотентна.
-- ============================================================

create or replace function public.ensure_loyalty_card()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_no  text;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('loyalty_card:' || v_uid::text));
  select loyalty_card_no into v_no from public.profiles where id = v_uid;
  if v_no is not null and v_no <> '' then return v_no; end if;
  perform set_config('sevimli.bypass', '1', true);
  loop
    v_no := '5555 ' || lpad((floor(random() * 10000))::int::text, 4, '0') || ' '
                    || lpad((floor(random() * 10000))::int::text, 4, '0') || ' '
                    || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.profiles where loyalty_card_no = v_no);
  end loop;
  update public.profiles set loyalty_card_no = v_no
   where id = v_uid and (loyalty_card_no is null or loyalty_card_no = '');
  select loyalty_card_no into v_no from public.profiles where id = v_uid;
  return v_no;
end;
$$;
grant execute on function public.ensure_loyalty_card() to authenticated;
