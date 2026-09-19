-- ============================================================
-- SEVIMLI — миграция 015: оплата заказов.
-- Модель: деньги идут МАГАЗИНУ напрямую (его касса Payme/Click), платформа чужие деньги не держит.
-- Магазин вводит реквизиты своей кассы, платформа собирает ссылку на оплату для каждого заказа,
-- статус оплаты подтверждает вебхук провайдера (когда магазин введёт ключ) или сам магазин вручную.
--  • shops: реквизиты кассы (публичны — по ним строится ссылка) и секреты вебхука (только владелец)
--  • orders: payment_status / payment_provider / paid_at / payment_ref
--  • payments: журнал транзакций, идемпотентность по (provider, provider_txn_id)
--  • set_order_paid / set_order_unpaid — владелец магазина отмечает оплату руками
--  • pay_apply — применяет подтверждённый платёж (зовёт только сервер из вебхука, service_role)
-- Применять после 014. Идемпотентна.
-- ============================================================

-- ---------- 1. Реквизиты кассы магазина ----------
-- Публичная часть: по ней строится ссылка на оплату, она и так видна покупателю в адресе.
alter table public.shops add column if not exists payment_provider text not null default 'none'
  check (payment_provider in ('none', 'payme', 'click', 'link'));
alter table public.shops add column if not exists payme_merchant_id text;
alter table public.shops add column if not exists payme_account_field text not null default 'order_id';
alter table public.shops add column if not exists click_service_id text;
alter table public.shops add column if not exists click_merchant_id text;
-- Своя ссылка на оплату (например, страница магазина в Click/Payme), если касса не подключена к платформе
alter table public.shops add column if not exists payment_url text
  check (payment_url is null or payment_url ~ '^https://');
alter table public.shops add column if not exists payment_note text
  check (payment_note is null or char_length(payment_note) <= 200);

-- Секреты вебхука хранятся отдельно: их не должно быть в публичной выдаче магазина
create table if not exists public.shop_payment_secrets (
  shop_id           uuid primary key references public.shops(id) on delete cascade,
  payme_key         text,   -- ключ кассы Payme (Basic auth вебхука)
  click_secret_key  text,   -- секретный ключ Click (подпись колбэка)
  updated_at        timestamptz not null default now()
);
alter table public.shop_payment_secrets enable row level security;

drop policy if exists "shop_secrets_owner" on public.shop_payment_secrets;
create policy "shop_secrets_owner" on public.shop_payment_secrets for all to authenticated
  using (shop_id in (select id from public.shops where owner_id = auth.uid()) or public.is_admin())
  with check (shop_id in (select id from public.shops where owner_id = auth.uid()) or public.is_admin());

-- ---------- 2. Оплата в заказе ----------
alter table public.orders add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'pending', 'paid', 'refunded', 'failed'));
alter table public.orders add column if not exists payment_provider text
  check (payment_provider is null or payment_provider in ('cod', 'payme', 'click', 'link'));
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists payment_ref text;

create index if not exists idx_orders_payment_status on public.orders(payment_status);

-- ---------- 3. Журнал платежей ----------
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  shop_id         uuid references public.shops(id) on delete set null,
  provider        text not null check (provider in ('payme', 'click')),
  provider_txn_id text not null,
  amount          numeric not null check (amount >= 0),
  state           text not null default 'created' check (state in ('created', 'paid', 'cancelled', 'failed')),
  raw             jsonb,
  created_at      timestamptz not null default now(),
  paid_at         timestamptz,
  cancelled_at    timestamptz,
  unique (provider, provider_txn_id)
);
create index if not exists idx_payments_order on public.payments(order_id);
alter table public.payments enable row level security;

-- Покупательница видит платежи своих заказов, продавец — своих магазинов; пишет только сервер (service_role)
drop policy if exists "payments_read_own" on public.payments;
create policy "payments_read_own" on public.payments for select using (
  order_id in (select id from public.orders where buyer_id = auth.uid())
  or shop_id in (select id from public.shops where owner_id = auth.uid())
  or public.is_admin()
);

-- ---------- 4. Защита колонок оплаты в заказе ----------
-- Правила из 004 сохранены (покупательница — только спор; продавец — не цена/покупатель/код,
-- статус done только через complete_order), сверху добавлена защита полей оплаты:
-- payment_status / paid_at / payment_ref / payment_provider меняют только RPC и вебхук (там bypass).
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
  -- Оплату не объявляет ни одна из сторон напрямую
  if new.payment_status is distinct from old.payment_status
     or new.paid_at is distinct from old.paid_at
     or new.payment_ref is distinct from old.payment_ref
     or new.payment_provider is distinct from old.payment_provider
     or new.circle_id is distinct from old.circle_id
     or new.discount_total is distinct from old.discount_total then
    raise exception 'protected payment columns' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_protect_order_columns on public.orders;
create trigger trg_protect_order_columns before update on public.orders
  for each row execute function public.protect_order_columns();

-- ---------- 5. Ручная отметка оплаты владельцем магазина ----------
create or replace function public.set_order_paid(p_order uuid, p_ref text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.orders o join public.shops s on s.id = o.shop_id
     where o.id = p_order and (s.owner_id = v_uid or public.is_admin())
  ) then
    raise exception 'owner only' using errcode = '42501';
  end if;
  perform set_config('sevimli.bypass', '1', true);
  update public.orders
     set payment_status = 'paid',
         paid_at = coalesce(paid_at, now()),
         payment_ref = coalesce(nullif(btrim(p_ref), ''), payment_ref),
         payment_provider = coalesce(payment_provider, 'cod')
   where id = p_order;
end;
$$;
grant execute on function public.set_order_paid(uuid, text) to authenticated;

create or replace function public.set_order_unpaid(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.orders o join public.shops s on s.id = o.shop_id
     where o.id = p_order and (s.owner_id = v_uid or public.is_admin())
  ) then
    raise exception 'owner only' using errcode = '42501';
  end if;
  perform set_config('sevimli.bypass', '1', true);
  update public.orders set payment_status = 'unpaid', paid_at = null where id = p_order;
end;
$$;
grant execute on function public.set_order_unpaid(uuid) to authenticated;

-- ---------- 6. Применение платежа из вебхука (только service_role) ----------
-- Идемпотентно: повтор того же provider_txn_id не создаёт второй платёж и не портит статус.
create or replace function public.pay_apply(
  p_order uuid,
  p_provider text,
  p_txn text,
  p_amount numeric,
  p_state text,
  p_raw jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_pay   record;
begin
  if p_provider not in ('payme', 'click') then
    raise exception 'unknown provider' using errcode = '22023';
  end if;
  if p_state not in ('created', 'paid', 'cancelled', 'failed') then
    raise exception 'unknown state' using errcode = '22023';
  end if;
  perform set_config('sevimli.bypass', '1', true);
  select * into v_order from public.orders where id = p_order;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;

  insert into public.payments (order_id, shop_id, provider, provider_txn_id, amount, state, raw,
                               paid_at, cancelled_at)
  values (p_order, v_order.shop_id, p_provider, p_txn, p_amount, p_state, p_raw,
          case when p_state = 'paid' then now() end,
          case when p_state = 'cancelled' then now() end)
  on conflict (provider, provider_txn_id) do update
    set state        = excluded.state,
        amount       = excluded.amount,
        raw          = coalesce(excluded.raw, public.payments.raw),
        paid_at      = coalesce(public.payments.paid_at, excluded.paid_at),
        cancelled_at = coalesce(public.payments.cancelled_at, excluded.cancelled_at)
  returning * into v_pay;

  if p_state = 'paid' then
    update public.orders
       set payment_status = 'paid',
           payment_provider = p_provider,
           payment_ref = p_txn,
           paid_at = coalesce(paid_at, now())
     where id = p_order;
  elsif p_state = 'cancelled' then
    update public.orders
       set payment_status = case when payment_status = 'paid' then 'refunded' else 'unpaid' end,
           paid_at = null
     where id = p_order and payment_ref is not distinct from p_txn;
  elsif p_state = 'created' then
    update public.orders
       set payment_status = case when payment_status = 'paid' then payment_status else 'pending' end,
           payment_provider = coalesce(payment_provider, p_provider)
     where id = p_order;
  end if;

  return jsonb_build_object('payment_id', v_pay.id, 'order_total', v_order.total_price,
                            'payment_status', (select payment_status from public.orders where id = p_order));
end;
$$;
revoke execute on function public.pay_apply(uuid, text, text, numeric, text, jsonb) from public, anon, authenticated;

-- ---------- 7. Данные заказа для вебхука (только service_role) ----------
create or replace function public.pay_order_info(p_order uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  select jsonb_build_object(
           'id', o.id, 'total', o.total_price, 'status', o.status,
           'payment_status', o.payment_status, 'shop_id', o.shop_id,
           'payme_key', sec.payme_key, 'click_secret_key', sec.click_secret_key,
           'payme_merchant_id', s.payme_merchant_id, 'click_service_id', s.click_service_id
         )
    into v
    from public.orders o
    join public.shops s on s.id = o.shop_id
    left join public.shop_payment_secrets sec on sec.shop_id = s.id
   where o.id = p_order;
  return v;
end;
$$;
revoke execute on function public.pay_order_info(uuid) from public, anon, authenticated;
