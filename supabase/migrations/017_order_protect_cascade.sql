-- ============================================================
-- SEVIMLI — миграция 017: защита заказа не должна ломать каскады.
-- В 015 защита запрещала любое изменение orders.circle_id. Но удаление круга Davra
-- делает ON DELETE SET NULL по orders.circle_id — это UPDATE от имени пользователя,
-- триггер его отклонял, и круг нельзя было распустить.
-- Теперь circle_id можно только обнулить (так работает каскад); поставить или сменить — нельзя.
-- Применять после 016. Идемпотентна.
-- ============================================================

create or replace function public.protect_order_columns()
returns trigger
language plpgsql
as $$
begin
  if public.sys_bypass() or public.is_admin() then
    return new;
  end if;
  -- Покупатель: может менять только dispute_status/dispute_note
  if auth.uid() = old.buyer_id and not exists (
       select 1 from public.shops s where s.id = old.shop_id and s.owner_id = auth.uid()) then
    if new.status is distinct from old.status
       or new.total_price is distinct from old.total_price
       or new.shop_id is distinct from old.shop_id
       or new.buyer_id is distinct from old.buyer_id
       or new.delivery_fee is distinct from old.delivery_fee
       or new.pickup_code is distinct from old.pickup_code then
      raise exception 'buyer may only open a dispute' using errcode = '42501';
    end if;
  else
    -- Продавец: не трогает цену, покупателя и код выдачи; статус done — только через complete_order()
    if new.total_price is distinct from old.total_price
       or new.buyer_id is distinct from old.buyer_id
       or new.shop_id is distinct from old.shop_id
       or new.pickup_code is distinct from old.pickup_code
       or (new.status = 'done' and old.status is distinct from 'done') then
      raise exception 'protected order columns' using errcode = '42501';
    end if;
  end if;
  -- Оплату не объявляет ни одна из сторон напрямую; круг можно только обнулить (каскад удаления круга)
  if new.payment_status is distinct from old.payment_status
     or new.paid_at is distinct from old.paid_at
     or new.payment_ref is distinct from old.payment_ref
     or new.payment_provider is distinct from old.payment_provider
     or new.discount_total is distinct from old.discount_total
     or (new.circle_id is distinct from old.circle_id and new.circle_id is not null) then
    raise exception 'protected payment columns' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
