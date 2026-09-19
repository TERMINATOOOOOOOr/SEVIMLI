-- ============================================================
-- SEVIMLI — миграция 010: Davra (круг подруг) на сервере.
--  • circles / circle_members / circle_items — круг, участницы (≤6), общая корзина
--  • приглашение по коду: /davra/join/<code> → join_circle(code); превью для гостя — circle_preview
--  • роли: создательница переименовывает, удаляет участниц и распускает круг; участница выходит сама
--  • скидка круга −10% при общей сумме ≥ 500 000 сум применяется В ЗАКАЗЕ: create_order(..., p_circle)
--    считает сумму круга по текущим ценам и пишет цену со скидкой в order_items; orders.circle_id/discount_total
-- Применять после 009. Идемпотентна.
-- ============================================================

-- ---------- 1. Таблицы ----------
create table if not exists public.circles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique check (invite_code ~ '^[a-z0-9]{8}$'),
  created_at  timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id  uuid not null references public.circles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table if not exists public.circle_items (
  id         uuid primary key default gen_random_uuid(),
  circle_id  uuid not null references public.circles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty        int  not null default 1 check (qty between 1 and 50),
  created_at timestamptz not null default now(),
  unique (circle_id, user_id, product_id)
);

create index if not exists idx_circle_members_user on public.circle_members(user_id);
create index if not exists idx_circle_items_circle on public.circle_items(circle_id);

alter table public.orders add column if not exists circle_id      uuid references public.circles(id) on delete set null;
alter table public.orders add column if not exists discount_total numeric not null default 0;

-- ---------- 2. Константы и помощники ----------
create or replace function public.davra_threshold() returns numeric language sql immutable as $$ select 500000::numeric $$;
create or replace function public.davra_price(p_price numeric, p_active boolean)
returns numeric language sql immutable as $$
  select case when p_active then round(p_price * 0.9 / 1000) * 1000 else p_price end
$$;

-- Членство без рекурсии RLS (SECURITY DEFINER читает circle_members напрямую)
create or replace function public.is_circle_member(p_circle uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_uid is not null and exists (
    select 1 from public.circle_members m where m.circle_id = p_circle and m.user_id = p_uid
  )
$$;

/** Сумма круга по текущим ценам активных товаров. */
create or replace function public.circle_total(p_circle uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(p.price * i.qty), 0)
    from public.circle_items i
    join public.products p on p.id = i.product_id and coalesce(p.is_active, false)
   where i.circle_id = p_circle
$$;

-- ---------- 3. RLS ----------
alter table public.circles        enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_items   enable row level security;

drop policy if exists "circles_read_member" on public.circles;
create policy "circles_read_member" on public.circles for select
  using (public.is_circle_member(id, auth.uid()));
drop policy if exists "circles_update_owner" on public.circles;
create policy "circles_update_owner" on public.circles for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "circles_delete_owner" on public.circles;
create policy "circles_delete_owner" on public.circles for delete
  using (auth.uid() = owner_id);
-- insert — только через create_circle()

drop policy if exists "circle_members_read" on public.circle_members;
create policy "circle_members_read" on public.circle_members for select
  using (public.is_circle_member(circle_id, auth.uid()));
-- insert/delete — только через join_circle / remove_member / leave_circle

drop policy if exists "circle_items_read" on public.circle_items;
create policy "circle_items_read" on public.circle_items for select
  using (public.is_circle_member(circle_id, auth.uid()));
drop policy if exists "circle_items_insert_own" on public.circle_items;
create policy "circle_items_insert_own" on public.circle_items for insert to authenticated
  with check (auth.uid() = user_id and public.is_circle_member(circle_id, auth.uid()));
drop policy if exists "circle_items_update_own" on public.circle_items;
create policy "circle_items_update_own" on public.circle_items for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "circle_items_delete_own" on public.circle_items;
create policy "circle_items_delete_own" on public.circle_items for delete
  using (auth.uid() = user_id);

-- Автор позиции не подделывается; переносить позицию в другой круг нельзя
create or replace function public.stamp_circle_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.sys_bypass() or auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.created_at := now();
  else
    new.user_id := old.user_id;
    new.circle_id := old.circle_id;
    new.product_id := old.product_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_stamp_circle_item on public.circle_items;
create trigger trg_stamp_circle_item before insert or update on public.circle_items
  for each row execute function public.stamp_circle_item();

-- Переименование — единственное, что меняет владелица напрямую
create or replace function public.protect_circle_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.sys_bypass() or auth.uid() is null then return new; end if;
  new.owner_id := old.owner_id;
  new.invite_code := old.invite_code;
  new.created_at := old.created_at;
  return new;
end;
$$;
drop trigger if exists trg_protect_circle_columns on public.circles;
create trigger trg_protect_circle_columns before update on public.circles
  for each row execute function public.protect_circle_columns();

-- ---------- 4. RPC ----------
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
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if v_name = '' then v_name := 'Davra'; end if;
  if (select count(*) from public.circles where owner_id = v_uid) >= 10 then
    raise exception 'circle_limit_exceeded' using errcode = 'P0001';
  end if;
  loop
    v_code := lower(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
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

/** Превью по коду приглашения — для страницы /davra/join/<code> (видит и гость). */
create or replace function public.circle_preview(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_c record;
  v_owner text;
  v_cnt int;
begin
  select * into v_c from public.circles where invite_code = lower(btrim(coalesce(p_code, '')));
  if not found then return null; end if;
  select coalesce(nullif(name, ''), 'Пользователь') into v_owner from public.profiles where id = v_c.owner_id;
  select count(*) into v_cnt from public.circle_members where circle_id = v_c.id;
  return jsonb_build_object(
    'id', v_c.id, 'name', v_c.name, 'owner_name', v_owner, 'members', v_cnt,
    'is_full', v_cnt >= 6,
    'is_member', auth.uid() is not null and exists (
      select 1 from public.circle_members where circle_id = v_c.id and user_id = auth.uid())
  );
end;
$$;
grant execute on function public.circle_preview(text) to anon, authenticated;

/** Создательница удаляет участницу (вместе с её позициями). */
create or replace function public.remove_member(p_circle uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select owner_id into v_owner from public.circles where id = p_circle;
  if v_owner is null or v_owner <> v_uid then raise exception 'owner only' using errcode = '42501'; end if;
  if p_user = v_owner then raise exception 'cannot remove owner' using errcode = 'P0001'; end if;
  delete from public.circle_items where circle_id = p_circle and user_id = p_user;
  delete from public.circle_members where circle_id = p_circle and user_id = p_user;
end;
$$;
grant execute on function public.remove_member(uuid, uuid) to authenticated;

/** Участница выходит из круга сама (создательница — распускает круг). */
create or replace function public.leave_circle(p_circle uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select owner_id into v_owner from public.circles where id = p_circle;
  if v_owner is null then raise exception 'circle_not_found' using errcode = 'P0002'; end if;
  if v_owner = v_uid then raise exception 'owner_cannot_leave' using errcode = 'P0001'; end if;
  delete from public.circle_items where circle_id = p_circle and user_id = v_uid;
  delete from public.circle_members where circle_id = p_circle and user_id = v_uid;
end;
$$;
grant execute on function public.leave_circle(uuid) to authenticated;

-- ---------- 5. create_order со скидкой круга ----------
drop function if exists public.create_order(jsonb, text, text, text, text, text, text);
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
  v_total numeric;
  v_discount numeric;
  v_unit numeric;
  v_fee numeric;
  v_shop_row record;
  v_result jsonb := '[]'::jsonb;
  v_qty int;
  v_circle uuid := null;
  v_circle_on boolean := false;
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

  -- Круг: только для участницы; скидка активна при сумме круга ≥ порога (по текущим ценам)
  if p_circle is not null and public.is_circle_member(p_circle, v_buyer) then
    v_circle := p_circle;
    v_circle_on := public.circle_total(p_circle) >= public.davra_threshold();
  end if;

  -- Лимит от спама: не больше 3 неподтверждённых заказов на покупателя в сутки
  if (select count(*) from public.orders o
      where o.buyer_id = v_buyer and o.status = 'pending' and o.created_at > now() - interval '1 day') >= 3 then
    raise exception 'too many pending orders' using errcode = 'P0001';
  end if;

  -- Блокируем товары в детерминированном порядке и проверяем сток
  for v_shop in
    select distinct p.shop_id
    from jsonb_array_elements(p_items) i
    join public.products p on p.id = (i->>'product_id')::uuid
    order by 1
  loop
    v_total := 0;
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
      v_unit := public.davra_price(v_prod.price, v_circle_on);
      insert into public.order_items (order_id, product_id, quantity, price_at_order)
      values (v_order, v_prod.id, v_qty, v_unit);
      update public.products set stock = stock - v_qty where id = v_prod.id and stock is not null;
      v_total := v_total + v_unit * v_qty;
      v_discount := v_discount + (v_prod.price - v_unit) * v_qty;
    end loop;

    -- Доставка: тариф магазина, бесплатно от порога; самовывоз — 0
    v_fee := case
      when p_delivery_method = 'pickup' then 0
      when v_shop_row.free_delivery_from is not null and v_total >= v_shop_row.free_delivery_from then 0
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

  -- Оформленные позиции уходят из общей корзины круга
  if v_circle is not null then
    delete from public.circle_items ci
     where ci.circle_id = v_circle and ci.user_id = v_buyer
       and ci.product_id in (select (i->>'product_id')::uuid from jsonb_array_elements(p_items) i);
  end if;
  return v_result;
end;
$$;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text, uuid) to authenticated;
