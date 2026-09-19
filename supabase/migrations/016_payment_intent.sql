-- ============================================================
-- SEVIMLI — миграция 016: выбранный покупательницей способ оплаты.
-- Намерение оплатить ≠ оплата: ставится только payment_provider и статус pending,
-- сам факт оплаты по-прежнему подтверждает вебхук или магазин.
-- Применять после 015. Идемпотентна.
-- ============================================================

create or replace function public.set_payment_intent(p_order uuid, p_provider text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ord record;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_provider not in ('cod', 'payme', 'click', 'link') then
    raise exception 'unknown provider' using errcode = '22023';
  end if;
  select * into v_ord from public.orders where id = p_order;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if v_ord.buyer_id is distinct from v_uid then raise exception 'buyer only' using errcode = '42501'; end if;
  if v_ord.payment_status = 'paid' then return; end if;

  perform set_config('sevimli.bypass', '1', true);
  update public.orders
     set payment_provider = p_provider,
         payment_status = case when p_provider = 'cod' then 'unpaid' else 'pending' end
   where id = p_order;
end;
$$;
grant execute on function public.set_payment_intent(uuid, text) to authenticated;
