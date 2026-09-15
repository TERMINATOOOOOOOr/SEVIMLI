-- ============================================================
-- SEVIMLI — миграция 004 «запуск»: закрытие дыр безопасности,
-- серверное оформление заказа, доставка продавцом, реестр подлинности,
-- лояльность по факту выкупа, события аналитики, Storage-политики.
-- Применять после 001–003. Идемпотентна (можно перезапускать).
-- ============================================================

-- ---------- 0. Служебные функции ----------

-- Текущий пользователь — админ?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
$$;

-- Флаг «системная операция» для SECURITY DEFINER-функций: триггеры-защитники его уважают.
create or replace function public.sys_bypass()
returns boolean
language sql
stable
as $$ select coalesce(current_setting('sevimli.bypass', true), '') = '1' $$;

-- ---------- 1. profiles: никто не назначает себя admin и не пишет себе баллы ----------

-- Чтение: только свою строку (+ админ). Публичные поля — через view public_profiles.
drop policy if exists "profiles_read" on public.profiles;
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Защищённые колонки меняет только админ или системная функция.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if public.sys_bypass() or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.loyalty_points is distinct from old.loyalty_points
     or new.loyalty_tier is distinct from old.loyalty_tier
     or new.loyalty_card_no is distinct from old.loyalty_card_no then
    raise exception 'protected profile columns' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Публичный профиль без телефона (для отзывов, постов, Q&A).
drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = false) as
  select id, name, avatar_url, city, loyalty_tier, created_at
  from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- «Стать продавцом» — только через функцию (клиентский update role запрещён триггером).
create or replace function public.become_seller()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  perform set_config('sevimli.bypass', '1', true);
  update public.profiles set role = 'seller' where id = auth.uid() and role = 'buyer';
end;
$$;
grant execute on function public.become_seller() to authenticated;

-- ---------- 2. shops / products: само-верификация запрещена ----------

alter table public.shops add column if not exists delivery_fee        numeric default 15000;
alter table public.shops add column if not exists free_delivery_from  numeric default 200000;
alter table public.shops add column if not exists delivery_days_text  text;
alter table public.shops add column if not exists pickup_enabled      boolean default false;
alter table public.shops add column if not exists pickup_address      text;
alter table public.shops add column if not exists ships_to_regions    boolean default false;
alter table public.shops add column if not exists plan                text not null default 'free'
  check (plan in ('free', 'pro', 'premium', 'salon_pro'));
alter table public.shops add column if not exists plan_until          timestamptz;
alter table public.shops add column if not exists featured_until      timestamptz;
alter table public.shops add column if not exists davra_enabled       boolean default false;
alter table public.shops add column if not exists is_original_verified boolean default false;
alter table public.shops add column if not exists is_demo             boolean not null default false;

create or replace function public.protect_shop_columns()
returns trigger
language plpgsql
as $$
begin
  if public.sys_bypass() or public.is_admin() then
    return new;
  end if;
  if new.is_verified is distinct from old.is_verified
     or new.rating is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count
     or new.plan is distinct from old.plan
     or new.plan_until is distinct from old.plan_until
     or new.featured_until is distinct from old.featured_until
     or new.is_original_verified is distinct from old.is_original_verified then
    raise exception 'protected shop columns' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_shop_columns on public.shops;
create trigger trg_protect_shop_columns
  before update on public.shops
  for each row execute function public.protect_shop_columns();

-- При создании магазина продавец не может сразу поставить себе verified/rating.
create or replace function public.reset_shop_flags_on_insert()
returns trigger
language plpgsql
as $$
begin
  if not (public.sys_bypass() or public.is_admin()) then
    new.is_verified := false;
    new.rating := 0;
    new.reviews_count := 0;
    new.plan := 'free';
    new.plan_until := null;
    new.featured_until := null;
    new.is_original_verified := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reset_shop_flags_on_insert on public.shops;
create trigger trg_reset_shop_flags_on_insert
  before insert on public.shops
  for each row execute function public.reset_shop_flags_on_insert();

-- Метка «оригинал» у товара — только если магазину её подтвердил админ по документам.
create or replace function public.protect_product_original()
returns trigger
language plpgsql
as $$
declare
  ok boolean;
begin
  if public.sys_bypass() or public.is_admin() then
    return new;
  end if;
  if coalesce(new.is_original, false) then
    select s.is_original_verified into ok from public.shops s where s.id = new.shop_id;
    if not coalesce(ok, false) then
      new.is_original := false;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_product_original on public.products;
create trigger trg_protect_product_original
  before insert or update on public.products
  for each row execute function public.protect_product_original();

-- Публично видны только активные товары (продавец видит свои все).
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select using (
  is_active = true
  or shop_id in (select id from public.shops where owner_id = auth.uid())
  or public.is_admin()
);

-- Лимит товаров по тарифу: free — 20, pro — 200, premium/salon_pro — без лимита.
create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
as $$
declare
  cur_plan text;
  cnt int;
  lim int;
begin
  if public.sys_bypass() or public.is_admin() then
    return new;
  end if;
  select case when plan_until is null or plan_until > now() then plan else 'free' end
    into cur_plan from public.shops where id = new.shop_id;
  lim := case cur_plan when 'pro' then 200 when 'premium' then 1000000 when 'salon_pro' then 1000000 else 20 end;
  select count(*) into cnt from public.products where shop_id = new.shop_id;
  if cnt >= lim then
    raise exception 'product limit for plan % reached (%)', coalesce(cur_plan, 'free'), lim using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_product_limit on public.products;
create trigger trg_enforce_product_limit
  before insert on public.products
  for each row execute function public.enforce_product_limit();

-- ---------- 3. Заказы: доставка продавцом, контакты, серверное оформление ----------

alter table public.orders add column if not exists delivery_method  text not null default 'seller'
  check (delivery_method in ('seller', 'pickup', 'partner', 'point'));
alter table public.orders add column if not exists delivery_fee     numeric default 0;
alter table public.orders add column if not exists recipient_name   text;
alter table public.orders add column if not exists recipient_phone  text;
alter table public.orders add column if not exists pickup_code      char(4) default lpad((1000 + floor(random() * 9000))::int::text, 4, '0');
alter table public.orders add column if not exists tracking_url     text;
alter table public.orders add column if not exists delivered_at     timestamptz;
alter table public.orders add column if not exists source           text;
alter table public.orders add column if not exists dispute_status   text not null default 'none'
  check (dispute_status in ('none', 'open', 'resolved'));
alter table public.orders add column if not exists dispute_note     text;
alter table public.orders add column if not exists updated_at       timestamptz default now();

-- Клиент больше не пишет заказы напрямую — только через create_order().
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "order_items_insert_own" on public.order_items;

-- Покупатель может открыть спор по своему заказу (только эти два поля).
drop policy if exists "orders_update_buyer_dispute" on public.orders;
create policy "orders_update_buyer_dispute" on public.orders for update
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

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
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_protect_order_columns on public.orders;
create trigger trg_protect_order_columns
  before update on public.orders
  for each row execute function public.protect_order_columns();

-- Серверное оформление: цены, активность и сток — из базы; один заказ на магазин; всё в одной транзакции.
-- p_items: [{"product_id": "...", "quantity": 2}, ...]
create or replace function public.create_order(
  p_items jsonb,
  p_recipient_name text,
  p_recipient_phone text,
  p_address text,
  p_comment text default null,
  p_delivery_method text default 'seller',
  p_source text default null
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
  v_fee numeric;
  v_shop_row record;
  v_result jsonb := '[]'::jsonb;
  v_qty int;
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
    select * into v_shop_row from public.shops where id = v_shop;

    insert into public.orders (buyer_id, shop_id, status, total_price, address, comment,
                               delivery_method, delivery_fee, recipient_name, recipient_phone, source)
    values (v_buyer, v_shop, 'pending', 0, p_address, p_comment,
            p_delivery_method, 0, trim(p_recipient_name), trim(p_recipient_phone), p_source)
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
      insert into public.order_items (order_id, product_id, quantity, price_at_order)
      values (v_order, v_prod.id, v_qty, v_prod.price);
      update public.products set stock = stock - v_qty where id = v_prod.id and stock is not null;
      v_total := v_total + v_prod.price * v_qty;
    end loop;

    -- Доставка: тариф магазина, бесплатно от порога; самовывоз — 0
    v_fee := case
      when p_delivery_method = 'pickup' then 0
      when v_shop_row.free_delivery_from is not null and v_total >= v_shop_row.free_delivery_from then 0
      else coalesce(v_shop_row.delivery_fee, 0)
    end;

    update public.orders set total_price = v_total + v_fee, delivery_fee = v_fee where id = v_order;
    v_result := v_result || jsonb_build_object('order_id', v_order, 'shop_id', v_shop, 'total', v_total + v_fee);
  end loop;

  if jsonb_array_length(v_result) = 0 then
    raise exception 'no valid items' using errcode = 'P0001';
  end if;
  return v_result;
end;
$$;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text) to authenticated;

-- Код выдачи видит только покупатель (через функцию, не через select *).
create or replace function public.my_pickup_code(p_order uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select o.pickup_code::text from public.orders o where o.id = p_order and o.buyer_id = auth.uid()
$$;
grant execute on function public.my_pickup_code(uuid) to authenticated;

-- Продавец закрывает заказ только по коду покупательницы → баллы начисляются здесь же.
create or replace function public.complete_order(p_order uuid, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_points int;
  v_tier text;
  v_cashback int;
begin
  select o.* into v_order from public.orders o
    join public.shops s on s.id = o.shop_id
   where o.id = p_order and (s.owner_id = auth.uid() or public.is_admin())
   for update;
  if not found then
    raise exception 'order not found' using errcode = '42501';
  end if;
  if v_order.status = 'done' then return true; end if;
  if v_order.pickup_code::text <> regexp_replace(coalesce(p_code, ''), '\D', '', 'g') then
    return false;
  end if;
  perform set_config('sevimli.bypass', '1', true);
  update public.orders set status = 'done', delivered_at = now() where id = p_order;

  -- Лояльность: 1 балл за каждые 1000 сум + кешбэк уровня (1/2/3/5%)
  if v_order.buyer_id is not null then
    select loyalty_tier into v_tier from public.profiles where id = v_order.buyer_id;
    v_cashback := case v_tier when 'silver' then 2 when 'gold' then 3 when 'platinum' then 5 else 1 end;
    v_points := floor(coalesce(v_order.total_price, 0) / 1000);
    v_points := v_points + floor(v_points * v_cashback / 100.0);
    if v_points > 0 then
      insert into public.loyalty_entries (user_id, points, reason) values (v_order.buyer_id, v_points, 'order:' || p_order::text);
      update public.profiles p
         set loyalty_points = p.loyalty_points + v_points,
             loyalty_tier = case
               when p.loyalty_points + v_points >= 8000 then 'platinum'
               when p.loyalty_points + v_points >= 3000 then 'gold'
               when p.loyalty_points + v_points >= 1000 then 'silver'
               else 'bronze' end
       where p.id = v_order.buyer_id;
    end if;
  end if;
  return true;
end;
$$;
grant execute on function public.complete_order(uuid, text) to authenticated;

-- ---------- 4. Лояльность: клиент баллы не пишет ----------
drop policy if exists "loyalty_insert_own" on public.loyalty_entries;

-- ---------- 5. Отзывы только по выкупленным заказам; лайки без накрутки ----------

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.buyer_id = auth.uid() and o.status = 'done' and oi.product_id = reviews.product_id
  )
);

create table if not exists public.post_likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.post_likes enable row level security;
drop policy if exists "post_likes_read" on public.post_likes;
create policy "post_likes_read" on public.post_likes for select using (true);
drop policy if exists "post_likes_insert_own" on public.post_likes;
create policy "post_likes_insert_own" on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "post_likes_delete_own" on public.post_likes;
create policy "post_likes_delete_own" on public.post_likes for delete using (auth.uid() = user_id);

-- Счётчик лайков поста пересчитывается триггером, а не клиентом.
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
drop trigger if exists trg_sync_post_likes on public.post_likes;
create trigger trg_sync_post_likes
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes();

-- Автор поста не может менять likes и author_name на чужое: author_name берётся из профиля
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
  select coalesce(nullif(name, ''), 'Пользователь'), city into v_name, v_city from public.profiles where id = auth.uid();
  new.author_id := auth.uid();
  new.author_name := coalesce(v_name, 'Пользователь');
  if tg_table_name = 'community_posts' then
    new.author_city := v_city;
    if tg_op = 'INSERT' then new.likes := 0; else new.likes := old.likes; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_stamp_post_author on public.community_posts;
create trigger trg_stamp_post_author
  before insert or update on public.community_posts
  for each row execute function public.stamp_post_author();
drop trigger if exists trg_stamp_comment_author on public.post_comments;
create trigger trg_stamp_comment_author
  before insert on public.post_comments
  for each row execute function public.stamp_post_author();
drop trigger if exists trg_stamp_question_author on public.product_questions;
create trigger trg_stamp_question_author
  before insert on public.product_questions
  for each row execute function public.stamp_post_author();

-- Ответ «от продавца» помечается только если автор — владелец магазина товара.
create or replace function public.stamp_answer_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_is_seller boolean;
begin
  if public.sys_bypass() or public.is_admin() then return new; end if;
  select coalesce(nullif(name, ''), 'Пользователь') into v_name from public.profiles where id = auth.uid();
  select exists (
    select 1 from public.product_questions q
    join public.products p on p.id = q.product_id
    join public.shops s on s.id = p.shop_id
    where q.id = new.question_id and s.owner_id = auth.uid()
  ) into v_is_seller;
  new.author_id := auth.uid();
  new.author_name := case when v_is_seller
    then (select s.name from public.product_questions q join public.products p on p.id = q.product_id
          join public.shops s on s.id = p.shop_id where q.id = new.question_id)
    else v_name end;
  new.is_seller := v_is_seller;
  return new;
end;
$$;
drop trigger if exists trg_stamp_answer_author on public.product_answers;
create trigger trg_stamp_answer_author
  before insert on public.product_answers
  for each row execute function public.stamp_answer_author();

-- ---------- 6. Реестр подлинности ----------

create table if not exists public.authenticity_codes (
  code             text primary key,
  product_id       uuid references public.products(id) on delete set null,
  shop_id          uuid references public.shops(id) on delete cascade,
  batch            text,
  supplier         text,
  declaration_no   text,
  imported_at      date,
  expires_at       date,
  checks_count     int not null default 0,
  first_checked_at timestamptz,
  last_checked_at  timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists idx_auth_codes_shop on public.authenticity_codes(shop_id);
alter table public.authenticity_codes enable row level security;

-- Прямого чтения нет (иначе весь реестр можно выкачать); проверка — только через verify_code().
drop policy if exists "auth_codes_seller_manage" on public.authenticity_codes;
create policy "auth_codes_seller_manage" on public.authenticity_codes for all
  using (shop_id in (select id from public.shops where owner_id = auth.uid() and is_original_verified) or public.is_admin())
  with check (shop_id in (select id from public.shops where owner_id = auth.uid() and is_original_verified) or public.is_admin());

create or replace function public.verify_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  r record;
begin
  if v_code !~ '^SVM-[A-Z0-9]{2,6}-[A-Z0-9]{4,8}$' then
    return jsonb_build_object('status', 'bad_format');
  end if;
  select * into r from public.authenticity_codes where code = v_code;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  update public.authenticity_codes
     set checks_count = checks_count + 1,
         first_checked_at = coalesce(first_checked_at, now()),
         last_checked_at = now()
   where code = v_code;
  return jsonb_build_object(
    'status', 'ok',
    'product_id', r.product_id,
    'batch', r.batch,
    'supplier', r.supplier,
    'declaration', r.declaration_no,
    'imported_at', r.imported_at,
    'expires_at', r.expires_at,
    'checks_count', r.checks_count + 1,
    'first_checked_at', coalesce(r.first_checked_at, now())
  );
end;
$$;
grant execute on function public.verify_code(text) to anon, authenticated;

-- ---------- 7. События аналитики (просмотр → корзина → заказ) ----------

create table if not exists public.events (
  id         bigserial primary key,
  user_id    uuid,
  session_id text,
  type       text not null check (type in ('view_product', 'add_to_cart', 'order', 'assistant_reco', 'post_click', 'davra_join')),
  product_id uuid,
  shop_id    uuid,
  source     text,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_shop_created on public.events(shop_id, created_at desc);
create index if not exists idx_events_type_created on public.events(type, created_at desc);
alter table public.events enable row level security;
drop policy if exists "events_insert_any" on public.events;
create policy "events_insert_any" on public.events for insert to anon, authenticated with check (true);
drop policy if exists "events_read_shop_or_admin" on public.events;
create policy "events_read_shop_or_admin" on public.events for select using (
  public.is_admin() or shop_id in (select id from public.shops where owner_id = auth.uid())
);

-- ---------- 8. Storage: бакеты и политики владельца ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
       ('shops',    'shops',    true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Чтение публичное; запись — только в свою папку (<uid>/...), с проверкой владельца.
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects for select
  using (bucket_id in ('products', 'shops'));
drop policy if exists "storage_owner_insert" on storage.objects;
create policy "storage_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('products', 'shops') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "storage_owner_update" on storage.objects;
create policy "storage_owner_update" on storage.objects for update to authenticated
  using (bucket_id in ('products', 'shops') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "storage_owner_delete" on storage.objects;
create policy "storage_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('products', 'shops') and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 9. Категории: «Аптека» → «Здоровье и гигиена» (без лекарств и БАД) ----------
update public.categories
   set name_ru = 'Здоровье и гигиена', name_uz = 'Salomatlik va gigiyena', icon = '🧴'
 where slug = 'pharmacy';

-- ---------- 10. Сид демо-каталога (только service_role; удаляется одной командой) ----------

create or replace function public.seed_demo(p_shops jsonb, p_products jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  p record;
  v_map jsonb := '{}'::jsonb;
  v_id uuid;
  v_shops int := 0;
  v_products int := 0;
begin
  perform set_config('sevimli.bypass', '1', true);
  for s in select * from jsonb_to_recordset(p_shops) as x(
    key text, name text, description text, category_slug text, logo_url text, city text,
    is_verified boolean, rating numeric, reviews_count int)
  loop
    insert into public.shops (owner_id, name, description, category_slug, logo_url, city,
                              is_verified, rating, reviews_count, is_demo)
    values (null, s.name, s.description, s.category_slug, s.logo_url, coalesce(s.city, 'Ташкент'),
            coalesce(s.is_verified, false), coalesce(s.rating, 0), coalesce(s.reviews_count, 0), true)
    returning id into v_id;
    v_map := v_map || jsonb_build_object(s.key, v_id);
    v_shops := v_shops + 1;
  end loop;
  for p in select * from jsonb_to_recordset(p_products) as x(
    shop_key text, name text, description text, price numeric, old_price numeric, images text[],
    category_slug text, stock int, is_active boolean, brand text, country text, is_original boolean, market_price numeric)
  loop
    if v_map ? p.shop_key then
      insert into public.products (shop_id, name, description, price, old_price, images, category_slug, stock,
                                   is_active, brand, country, is_original, market_price)
      values ((v_map ->> p.shop_key)::uuid, p.name, p.description, p.price, p.old_price, coalesce(p.images, '{}'),
              p.category_slug, coalesce(p.stock, 0), coalesce(p.is_active, true), p.brand, p.country,
              coalesce(p.is_original, false), p.market_price);
      v_products := v_products + 1;
    end if;
  end loop;
  return jsonb_build_object('shops', v_shops, 'products', v_products, 'map', v_map);
end;
$$;
revoke execute on function public.seed_demo(jsonb, jsonb) from public, anon, authenticated;

create or replace function public.clear_demo()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  perform set_config('sevimli.bypass', '1', true);
  delete from public.shops where is_demo;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.clear_demo() from public, anon, authenticated;

-- ---------- 11. Кабинет продавца: заказ вместе с позициями и контактами ----------
-- (RLS orders_read/order_items_read уже дают продавцу доступ к своим заказам;
--  в приложении select('*, items:order_items(*, product:products(*))').)
