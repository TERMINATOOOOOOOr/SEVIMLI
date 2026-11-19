-- ============================================================
-- SEVIMLI — миграция 018: срок годности товара, снимок товара в позиции заказа, флаги магазина.
--  • products: expires_on (+ точность month/day), made_on, pao_months, no_expiry; expiry_set_at ставит сервер
--  • товар с наступившим сроком не видят покупательницы и его нельзя заказать (владелец и админ видят)
--  • order_items: название, срок и метка «оригинал» на момент заказа
--  • товар с заказами или отзывами можно скрыть, удалить нельзя
--  • shops.is_demo меняет только админ или сервис; снятие проверки импорта снимает метку с товаров; журнал флагов
--  • refresh_demo_trust() — данные демо-стенда, только service_role (миграция данных не меняет)
-- Применять после 017. Идемпотентна. Функции и политики 001–017 не переопределяет.
-- ============================================================

create or replace function public.today_uz()
returns date language sql stable
as $$ select (now() at time zone 'Asia/Tashkent')::date $$;

-- ---------- 1. Срок годности у товара ----------
alter table public.products add column if not exists expires_on        date;
alter table public.products add column if not exists expires_precision text not null default 'month';
alter table public.products add column if not exists made_on           date;
alter table public.products add column if not exists pao_months        smallint;
alter table public.products add column if not exists no_expiry         boolean not null default false;
alter table public.products add column if not exists expiry_set_at     timestamptz;

alter table public.products drop constraint if exists products_expiry_ok;
alter table public.products add constraint products_expiry_ok check (
  expires_precision in ('month', 'day')
  and (expires_on is null or expires_precision = 'day' or extract(day from expires_on) = 1)
  and (made_on is null or extract(day from made_on) = 1)
  and (pao_months is null or pao_months between 1 and 60)
  and not (no_expiry and (expires_on is not null or made_on is not null))
  and (expires_on is null or made_on is null or made_on < expires_on)
  and (expires_on is null or expires_on < date '2100-01-01')
) not valid;

-- Когда магазин указал срок — ставит сервер; присланное клиентом значение не учитывается
create or replace function public.stamp_product_expiry()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT'
     or (new.expires_on, new.expires_precision, new.made_on, new.pao_months, new.no_expiry)
        is distinct from (old.expires_on, old.expires_precision, old.made_on, old.pao_months, old.no_expiry) then
    new.expiry_set_at := case when new.expires_on is not null or new.made_on is not null or new.no_expiry
                              then now() end;
  else
    new.expiry_set_at := old.expiry_set_at;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_stamp_product_expiry on public.products;
create trigger trg_stamp_product_expiry before insert or update on public.products
  for each row execute function public.stamp_product_expiry();

-- Витрина: товар с наступившим сроком видят только владелец магазина и админ.
-- Ограничивающая политика с новым именем: products_read (004:183-188) не трогаем.
drop policy if exists "products_hide_expired" on public.products;
create policy "products_hide_expired" on public.products as restrictive for select using (
  expires_on is null
  or expires_on > public.today_uz()
  or shop_id in (select id from public.shops where owner_id = auth.uid())
  or public.is_admin()
);

-- ---------- 2. Снимок товара в позиции заказа и запрет заказа истёкшего ----------
alter table public.order_items add column if not exists product_name      text;
alter table public.order_items add column if not exists expires_on        date;
alter table public.order_items add column if not exists expires_precision text;
alter table public.order_items add column if not exists made_on           date;
alter table public.order_items add column if not exists is_original       boolean not null default false;
create index if not exists idx_order_items_product on public.order_items(product_id);

create or replace function public.stamp_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  select name, expires_on, expires_precision, made_on, is_original into p
    from public.products where id = new.product_id;
  if not found then return new; end if;
  if p.expires_on is not null and p.expires_on <= public.today_uz() then
    raise exception 'product_expired: %', p.name using errcode = 'P0001';
  end if;
  new.product_name      := p.name;
  new.expires_on        := p.expires_on;
  new.expires_precision := case when p.expires_on is not null then p.expires_precision end;
  new.made_on           := p.made_on;
  new.is_original       := coalesce(p.is_original, false);
  return new;
end;
$$;
drop trigger if exists trg_stamp_order_item on public.order_items;
create trigger trg_stamp_order_item before insert on public.order_items
  for each row execute function public.stamp_order_item();

-- Уже существующие позиции: только название (метку и срок задним числом не выдумываем)
update public.order_items oi set product_name = p.name
  from public.products p
 where p.id = oi.product_id and oi.product_name is null;

-- ---------- 3. Товар с историей не удаляется (его можно скрыть) ----------
create or replace function public.guard_product_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.sys_bypass() or auth.uid() is null then return old; end if;   -- удаление аккаунта, clear_demo, сервис
  if exists (select 1 from public.order_items where product_id = old.id)
     or exists (select 1 from public.reviews where product_id = old.id) then
    raise exception 'product_has_history' using errcode = 'P0001';
  end if;
  return old;
end;
$$;
drop trigger if exists trg_guard_product_delete on public.products;
create trigger trg_guard_product_delete before delete on public.products
  for each row execute function public.guard_product_delete();

-- ---------- 4. Флаги магазина ----------
-- is_demo даёт послабления (лимиты, отметка покупки в демо-магазине) — владелец его не меняет
create or replace function public.protect_shop_demo()
returns trigger language plpgsql as $$
begin
  if public.sys_bypass() or auth.uid() is null or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then new.is_demo := false; else new.is_demo := old.is_demo; end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_shop_demo on public.shops;
create trigger trg_protect_shop_demo before insert or update on public.shops
  for each row execute function public.protect_shop_demo();

-- Журналы «только добавление» (пригодится и для журнала фото перед отправкой)
create or replace function public.forbid_change()
returns trigger language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = '42501';
end;
$$;

create table if not exists public.shop_flag_log (
  id         bigint generated always as identity primary key,
  shop_id    uuid not null,          -- без внешнего ключа: запись переживает удаление магазина
  flag       text not null check (flag in ('is_original_verified', 'is_demo')),
  old_value  boolean,
  new_value  boolean,
  actor_id   uuid,                   -- null: сервис или SQL Editor
  created_at timestamptz not null default now()
);
alter table public.shop_flag_log enable row level security;
revoke insert, update, delete, truncate on table public.shop_flag_log from anon, authenticated;
drop policy if exists "shop_flag_log_admin_read" on public.shop_flag_log;
create policy "shop_flag_log_admin_read" on public.shop_flag_log for select using (public.is_admin());
drop trigger if exists trg_shop_flag_log_append_only on public.shop_flag_log;
create trigger trg_shop_flag_log_append_only before update or delete on public.shop_flag_log
  for each row execute function public.forbid_change();

create or replace function public.sync_shop_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev text := current_setting('sevimli.bypass', true);
begin
  if new.is_original_verified is distinct from old.is_original_verified then
    insert into public.shop_flag_log (shop_id, flag, old_value, new_value, actor_id)
    values (new.id, 'is_original_verified', old.is_original_verified, new.is_original_verified, auth.uid());
    if not coalesce(new.is_original_verified, false) then
      perform set_config('sevimli.bypass', '1', true);
      update public.products set is_original = false where shop_id = new.id and is_original;
      perform set_config('sevimli.bypass', coalesce(v_prev, ''), true);
    end if;
  end if;
  if new.is_demo is distinct from old.is_demo then
    insert into public.shop_flag_log (shop_id, flag, old_value, new_value, actor_id)
    values (new.id, 'is_demo', old.is_demo, new.is_demo, auth.uid());
  end if;
  return null;
end;
$$;
drop trigger if exists trg_sync_shop_flags on public.shops;
create trigger trg_sync_shop_flags after update on public.shops
  for each row execute function public.sync_shop_flags();

-- ---------- 5. Данные демо-стенда (только service_role; запускается вручную: select public.refresh_demo_trust()) ----------
create or replace function public.refresh_demo_trust()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_shops int; n_marks int; n_dates int;
begin
  perform set_config('sevimli.bypass', '1', true);
  -- импорт подтверждён у демо-магазина с корейскими брендами (это Seoul Beauty: lib/demo.ts:90-97)
  update public.shops s set is_original_verified = true
   where s.is_demo and not coalesce(s.is_original_verified, false)
     and exists (select 1 from public.products p
                  where p.shop_id = s.id and p.brand is not null and p.country = 'Корея');
  get diagnostics n_shops = row_count;
  -- метка возвращается товарам k1…k8, если её сняли правкой (protect_product_original, 004:157-180)
  update public.products p set is_original = true
    from public.shops s
   where s.id = p.shop_id and s.is_demo and s.is_original_verified
     and p.brand is not null and p.country = 'Корея' and not coalesce(p.is_original, false);
  get diagnostics n_marks = row_count;
  -- сроки от сегодняшнего дня: месяц и год; один товар — «меньше 6 месяцев»
  update public.products p
     set expires_on = (date_trunc('month', public.today_uz()) + interval '16 months')::date,
         expires_precision = 'month', made_on = null, no_expiry = false, pao_months = 12
    from public.shops s
   where s.id = p.shop_id and s.is_demo and p.brand is not null and p.country = 'Корея';
  get diagnostics n_dates = row_count;
  update public.products p
     set expires_on = (date_trunc('month', public.today_uz()) + interval '4 months')::date
    from public.shops s
   where s.id = p.shop_id and s.is_demo and p.name like 'Beauty of Joseon Relief Sun%';
  return jsonb_build_object('shops_verified', n_shops, 'marks_restored', n_marks, 'dates_set', n_dates);
end;
$$;
revoke execute on function public.refresh_demo_trust() from public, anon, authenticated;
