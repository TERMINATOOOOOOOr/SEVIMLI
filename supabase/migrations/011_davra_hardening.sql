-- ============================================================
-- SEVIMLI — миграция 011: закалка Davra (по итогам ревью 010).
--  • скидка круга честная и устойчивая:
--      – прогресс круга = позиции в общей корзине + уже оформленные заказы круга за 14 дней
--        (по ценам ДО скидки) → после первого заказа скидка у остальных не пропадает;
--      – скидка только на товары, которые покупательница сама положила в этот круг, в пределах
--        количества из круга; остальное в заказе — по полной цене;
--      – скидку даёт магазин: только shops.davra_enabled = true (у демо-магазинов включаем);
--      – округление: скидка = floor(10% / 100) * 100 сум → цена никогда не выше исходной и не 0;
--      – порог бесплатной доставки сравнивается с суммой ДО скидки;
--      – после заказа из круга уходит оформленное количество, а не вся строка
--  • код приглашения — 16 hex (64 бита) вместо 8; старые коды продолжают работать
--  • is_circle_member отвечает только про текущую сессию (не оракул членства); circle_total/
--    circle_progress закрыты от прямого вызова; участнице — circle_state(p_circle)
--  • гонки: advisory-lock в join_circle / create_circle
--  • стенд жюри (владелец демо-магазина): лимиты кругов и pending-заказов мягче
-- Применять после 010. Идемпотентна.
-- ============================================================

-- ---------- 1. Код приглашения ----------
alter table public.circles drop constraint if exists circles_invite_code_check;
alter table public.circles add constraint circles_invite_code_check
  check (invite_code ~ '^[a-z0-9]{8,32}$');

-- ---------- 2. Помощники ----------
-- Членство: только про себя (в RLS и create_order всегда передаётся auth.uid())
create or replace function public.is_circle_member(p_circle uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_uid is not null and p_uid = auth.uid() and exists (
    select 1 from public.circle_members m where m.circle_id = p_circle and m.user_id = p_uid
  )
$$;

create or replace function public.davra_price(p_price numeric, p_active boolean)
returns numeric language sql immutable as $$
  select case when p_active then p_price - floor(p_price * 0.1 / 100) * 100 else p_price end
$$;

/** Общий демо-аккаунт стенда = владелец демо-магазина (как в enforce_post_limit из 009). */
create or replace function public.is_stand_account(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_uid is not null and exists (select 1 from public.shops s where s.owner_id = p_uid and s.is_demo)
$$;
revoke execute on function public.is_stand_account(uuid) from public, anon, authenticated;

/** Уже оформлено кругом за 14 дней, по ценам до скидки (товары без доставки + скидка). */
create or replace function public.circle_ordered_total(p_circle uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(coalesce(o.total_price, 0) - coalesce(o.delivery_fee, 0) + coalesce(o.discount_total, 0)), 0)
    from public.orders o
   where o.circle_id = p_circle and o.status <> 'cancelled' and o.created_at > now() - interval '14 days'
$$;

/** Прогресс круга к порогу: общая корзина + уже оформленное. */
create or replace function public.circle_progress(p_circle uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select public.circle_total(p_circle) + public.circle_ordered_total(p_circle)
$$;

revoke execute on function public.circle_total(uuid)         from public, anon, authenticated;
revoke execute on function public.circle_ordered_total(uuid) from public, anon, authenticated;
revoke execute on function public.circle_progress(uuid)      from public, anon, authenticated;

/** Состояние круга для участницы: суммы, порог, активна ли скидка. */
create or replace function public.circle_state(p_circle uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_items numeric;
  v_ordered numeric;
begin
  if not public.is_circle_member(p_circle, auth.uid()) then
    raise exception 'not a member' using errcode = '42501';
  end if;
  v_items := public.circle_total(p_circle);
  v_ordered := public.circle_ordered_total(p_circle);
  return jsonb_build_object(
    'items_total', v_items, 'ordered_total', v_ordered,
    'threshold', public.davra_threshold(),
    'discount_on', v_items + v_ordered >= public.davra_threshold()
  );
end;
$$;
revoke execute on function public.circle_state(uuid) from public, anon;
grant execute on function public.circle_state(uuid) to authenticated;

-- ---------- 3. create_circle / join_circle: длинный код, блокировки, стенд ----------
create or replace function public.create_circle(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid;
  v_code text;
  v_name text := left(btrim(coalesce(p_name, '')), 60);
  v_max  int;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if v_name = '' then v_name := 'Davra'; end if;
  perform pg_advisory_xact_lock(hashtext('circle_create:' || v_uid::text));
  v_max := case when public.is_stand_account(v_uid) then 50 else 10 end;
  if (select count(*) from public.circles where owner_id = v_uid) >= v_max then
    raise exception 'circle_limit_exceeded' using errcode = 'P0001';
  end if;
  loop
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
    exit when not exists (select 1 from public.circles where invite_code = v_code);
  end loop;
  insert into public.circles (name, owner_id, invite_code) values (v_name, v_uid, v_code) returning id into v_id;
  insert into public.circle_members (circle_id, user_id) values (v_id, v_uid);
  return v_id;
end;
$$;
grant execute on function public.create_circle(text) to authenticated;

create or replace function public.join_circle(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_c   record;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_c from public.circles where invite_code = lower(btrim(p_code));
  if not found then raise exception 'circle_not_found' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(hashtext('circle_join:' || v_c.id::text));
  if exists (select 1 from public.circle_members where circle_id = v_c.id and user_id = v_uid) then
    return v_c.id;
  end if;
  if (select count(*) from public.circle_members where circle_id = v_c.id) >= 6 then
    raise exception 'circle_full' using errcode = 'P0001';
  end if;
  insert into public.circle_members (circle_id, user_id) values (v_c.id, v_uid);
  return v_c.id;
end;
$$;
grant execute on function public.join_circle(text) to authenticated;

-- ---------- 4. Демо-магазины участвуют в Davra ----------
update public.shops set davra_enabled = true where is_demo and not coalesce(davra_enabled, false);

-- ---------- 5. create_order: честная скидка круга ----------
create or replace function public.create_order(
  p_items jsonb,
  p_recipient_name text,
  p_recipient_phone text,
  p_address text,
  p_comment text default null,
  p_delivery_method text default 'seller',
  p_source text default null,
  p_circle uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_item jsonb;
  v_prod record;
  v_shop uuid;
  v_order uuid;
  v_total numeric;       -- к оплате за товары (после скидки)
  v_full numeric;        -- сумма товаров до скидки (для порога бесплатной доставки)
  v_discount numeric;
  v_unit numeric;
  v_fee numeric;
  v_shop_row record;
  v_result jsonb := '[]'::jsonb;
  v_qty int;
  v_dqty int;            -- сколько штук идёт со скидкой (не больше, чем лежит в круге)
  v_circle uuid := null;
  v_circle_on boolean := false;
  v_pending_max int;
begin
  if v_buyer is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty order' using errcode = '22023';
  end if;
  if coalesce(trim(p_recipient_phone), '') = '' or coalesce(trim(p_recipient_name), '') = '' then
    raise exception 'recipient name and phone are required' using errcode = '22023';
  end if;
  if p_delivery_method not in ('seller', 'pickup') then
    raise exception 'unsupported delivery method' using errcode = '22023';
  end if;
  perform set_config('sevimli.bypass', '1', true);

  -- Круг: только для участницы; скидка активна при прогрессе круга ≥ порога
  if p_circle is not null and public.is_circle_member(p_circle, v_buyer) then
    v_circle := p_circle;
    v_circle_on := public.circle_progress(p_circle) >= public.davra_threshold();
  end if;

  -- Лимит от спама: неподтверждённые заказы на покупателя в сутки (стенд жюри — мягче)
  perform pg_advisory_xact_lock(hashtext('order_create:' || v_buyer::text));
  v_pending_max := case when public.is_stand_account(v_buyer) then 30 else 3 end;
  if (select count(*) from public.orders o
      where o.buyer_id = v_buyer and o.status = 'pending' and o.created_at > now() - interval '1 day') >= v_pending_max then
    raise exception 'too many pending orders' using errcode = 'P0001';
  end if;

  for v_shop in
    select distinct p.shop_id
    from jsonb_array_elements(p_items) i
    join public.products p on p.id = (i->>'product_id')::uuid
    order by 1
  loop
    v_total := 0;
    v_full := 0;
    v_discount := 0;
    select * into v_shop_row from public.shops where id = v_shop;

    insert into public.orders (buyer_id, shop_id, status, total_price, address, comment,
                               delivery_method, delivery_fee, recipient_name, recipient_phone, source, circle_id)
    values (v_buyer, v_shop, 'pending', 0, p_address, p_comment,
            p_delivery_method, 0, trim(p_recipient_name), trim(p_recipient_phone), p_source, v_circle)
    returning id into v_order;

    for v_item in select * from jsonb_array_elements(p_items) loop
      v_qty := greatest(1, least(50, coalesce((v_item->>'quantity')::int, 1)));
      select * into v_prod from public.products
        where id = (v_item->>'product_id')::uuid and shop_id = v_shop
        for update;
      if not found then continue; end if;
      if not coalesce(v_prod.is_active, false) then
        raise exception 'product % is not available', v_prod.id using errcode = 'P0001';
      end if;
      if v_prod.stock is not null and v_prod.stock < v_qty then
        raise exception 'not enough stock for %', v_prod.name using errcode = 'P0001';
      end if;

      -- Скидка: магазин участвует в Davra, товар лежит в круге у самой покупательницы, в пределах её количества
      v_dqty := 0;
      if v_circle_on and coalesce(v_shop_row.davra_enabled, false) then
        select least(v_qty, ci.qty) into v_dqty from public.circle_items ci
         where ci.circle_id = v_circle and ci.user_id = v_buyer and ci.product_id = v_prod.id;
        v_dqty := coalesce(v_dqty, 0);
      end if;
      v_unit := public.davra_price(v_prod.price, true);

      if v_dqty > 0 then
        insert into public.order_items (order_id, product_id, quantity, price_at_order)
        values (v_order, v_prod.id, v_dqty, v_unit);
      end if;
      if v_qty - v_dqty > 0 then
        insert into public.order_items (order_id, product_id, quantity, price_at_order)
        values (v_order, v_prod.id, v_qty - v_dqty, v_prod.price);
      end if;
      update public.products set stock = stock - v_qty where id = v_prod.id and stock is not null;
      v_total := v_total + v_unit * v_dqty + v_prod.price * (v_qty - v_dqty);
      v_full := v_full + v_prod.price * v_qty;
      v_discount := v_discount + (v_prod.price - v_unit) * v_dqty;

      -- Оформленное количество уходит из общей корзины круга
      if v_circle is not null then
        update public.circle_items ci set qty = ci.qty - v_qty
         where ci.circle_id = v_circle and ci.user_id = v_buyer and ci.product_id = v_prod.id and ci.qty > v_qty;
        if not found then
          delete from public.circle_items ci
           where ci.circle_id = v_circle and ci.user_id = v_buyer and ci.product_id = v_prod.id;
        end if;
      end if;
    end loop;

    -- Доставка: тариф магазина; порог бесплатной — по сумме ДО скидки круга; самовывоз — 0
    v_fee := case
      when p_delivery_method = 'pickup' then 0
      when v_shop_row.free_delivery_from is not null and v_full >= v_shop_row.free_delivery_from then 0
      else coalesce(v_shop_row.delivery_fee, 0)
    end;

    update public.orders set total_price = v_total + v_fee, delivery_fee = v_fee, discount_total = v_discount
     where id = v_order;
    v_result := v_result || jsonb_build_object('order_id', v_order, 'shop_id', v_shop, 'total', v_total + v_fee,
                                               'discount', v_discount);
  end loop;

  if jsonb_array_length(v_result) = 0 then
    raise exception 'no valid items' using errcode = 'P0001';
  end if;
  return v_result;
end;
$$;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text, uuid) to authenticated;
