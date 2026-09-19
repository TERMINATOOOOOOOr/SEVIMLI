-- ============================================================
-- SEVIMLI — миграция 012: аккаунт, лояльность, история чата, коды подлинности, админка.
--  • delete_my_account: нельзя удалить общий аккаунт стенда и аккаунт продавца с незакрытыми заказами
--  • ensure_loyalty_card(): номер карты лояльности выдаёт сервер (колонка защищена от клиента)
--  • assistant_conversations: история диалогов с Севилёй (только свои, ≤ 50 диалогов, ≤ 200 КБ на диалог)
--  • issue_codes(...): выпуск кодов подлинности пачкой (только магазин с подтверждённым импортом или админ)
--  • админка: правка магазинов админом, сводка admin_stats()
-- Применять после 011. Идемпотентна.
-- ============================================================

-- ---------- 1. Удаление аккаунта ----------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if public.is_stand_account(v_uid) then
    raise exception 'stand_account' using errcode = 'P0001';
  end if;
  -- Продавец с незакрытыми заказами: сначала закрыть заказы (иначе покупательницы потеряют их вместе с магазином)
  if exists (
    select 1 from public.orders o join public.shops s on s.id = o.shop_id
     where s.owner_id = v_uid and o.status in ('pending', 'confirmed', 'delivering')
  ) then
    raise exception 'seller_has_open_orders' using errcode = 'P0001';
  end if;
  perform set_config('sevimli.bypass', '1', true);
  delete from auth.users where id = v_uid;
end;
$$;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- 2. Карта лояльности ----------
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
  select loyalty_card_no into v_no from public.profiles where id = v_uid;
  if v_no is not null and v_no <> '' then return v_no; end if;
  perform set_config('sevimli.bypass', '1', true);
  loop
    v_no := '5555 ' || lpad((floor(random() * 10000))::int::text, 4, '0') || ' '
                    || lpad((floor(random() * 10000))::int::text, 4, '0') || ' '
                    || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.profiles where loyalty_card_no = v_no);
  end loop;
  update public.profiles set loyalty_card_no = v_no where id = v_uid;
  return v_no;
end;
$$;
grant execute on function public.ensure_loyalty_card() to authenticated;

-- ---------- 3. История диалогов с Севилёй ----------
create table if not exists public.assistant_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null default '' check (char_length(title) <= 80),
  messages   jsonb not null default '[]'::jsonb check (pg_column_size(messages) <= 204800),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_assistant_conv_user on public.assistant_conversations(user_id, updated_at desc);
alter table public.assistant_conversations enable row level security;

drop policy if exists "assistant_conv_own" on public.assistant_conversations;
create policy "assistant_conv_own" on public.assistant_conversations for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.stamp_assistant_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.sys_bypass() or auth.uid() is null then return new; end if;
  new.user_id := auth.uid();
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_at := now();
    if (select count(*) from public.assistant_conversations where user_id = auth.uid()) >= 50 then
      -- держим последние 50: самый старый уходит
      delete from public.assistant_conversations c
       where c.id = (select id from public.assistant_conversations
                      where user_id = auth.uid() order by updated_at asc limit 1);
    end if;
  else
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_stamp_assistant_conversation on public.assistant_conversations;
create trigger trg_stamp_assistant_conversation before insert or update on public.assistant_conversations
  for each row execute function public.stamp_assistant_conversation();

-- ---------- 4. Выпуск кодов подлинности ----------
create or replace function public.random_code(p_len int)
returns text
language plpgsql
volatile
as $$
declare
  v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- без I, O, 0, 1
  v_hex text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_out text := '';
  i int;
begin
  for i in 0 .. greatest(1, least(p_len, 24)) - 1 loop
    v_out := v_out || substr(v_alpha, 1 + (('x' || substr(v_hex, 1 + i * 2, 2))::bit(8)::int % 32), 1);
  end loop;
  return v_out;
end;
$$;
revoke execute on function public.random_code(int) from public, anon, authenticated;

create or replace function public.issue_codes(
  p_shop uuid,
  p_product uuid,
  p_count int,
  p_batch text default null,
  p_supplier text default null,
  p_declaration text default null,
  p_imported date default null,
  p_expires date default null
)
returns setof text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_shop record;
  v_mid  text;
  v_code text;
  v_n    int := greatest(1, least(coalesce(p_count, 1), 500));
  i int;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_shop from public.shops where id = p_shop;
  if not found then raise exception 'shop_not_found' using errcode = 'P0002'; end if;
  if not public.is_admin() then
    if v_shop.owner_id is distinct from v_uid then raise exception 'owner only' using errcode = '42501'; end if;
    if not coalesce(v_shop.is_original_verified, false) then
      raise exception 'import_not_verified' using errcode = 'P0001';
    end if;
  end if;
  if p_product is not null and not exists (select 1 from public.products where id = p_product and shop_id = p_shop) then
    raise exception 'product_not_in_shop' using errcode = 'P0001';
  end if;
  -- не больше 5000 кодов на магазин в сутки
  if (select count(*) from public.authenticity_codes where shop_id = p_shop and created_at > now() - interval '1 day') + v_n > 5000 then
    raise exception 'codes_limit_exceeded' using errcode = 'P0001';
  end if;
  v_mid := upper(substr(replace(p_shop::text, '-', ''), 1, 4));
  for i in 1 .. v_n loop
    loop
      v_code := 'SVM-' || v_mid || '-' || public.random_code(8);
      exit when not exists (select 1 from public.authenticity_codes where code = v_code);
    end loop;
    insert into public.authenticity_codes (code, product_id, shop_id, batch, supplier, declaration_no, imported_at, expires_at)
    values (v_code, p_product, p_shop, nullif(btrim(p_batch), ''), nullif(btrim(p_supplier), ''),
            nullif(btrim(p_declaration), ''), p_imported, p_expires);
    return next v_code;
  end loop;
  return;
end;
$$;
revoke execute on function public.issue_codes(uuid, uuid, int, text, text, text, date, date) from public, anon;
grant execute on function public.issue_codes(uuid, uuid, int, text, text, text, date, date) to authenticated;

-- ---------- 5. Админка ----------
drop policy if exists "shops_admin_update" on public.shops;
create policy "shops_admin_update" on public.shops for update
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  return jsonb_build_object(
    'users',            (select count(*) from public.profiles),
    'sellers',          (select count(*) from public.profiles where role = 'seller'),
    'shops',            (select count(*) from public.shops where not is_demo),
    'shops_demo',       (select count(*) from public.shops where is_demo),
    'shops_unverified', (select count(*) from public.shops where not is_demo and not coalesce(is_verified, false)),
    'products',         (select count(*) from public.products p join public.shops s on s.id = p.shop_id where not s.is_demo),
    'orders_pending',   (select count(*) from public.orders where status = 'pending'),
    'orders_active',    (select count(*) from public.orders where status in ('confirmed', 'delivering')),
    'orders_done',      (select count(*) from public.orders where status = 'done'),
    'gmv_done',         (select coalesce(sum(total_price), 0) from public.orders where status = 'done'),
    'posts',            (select count(*) from public.community_posts where not is_demo),
    'posts_hidden',     (select count(*) from public.community_posts where hidden),
    'posts_reported',   (select count(*) from public.community_posts where reports_count > 0 and not hidden),
    'waitlist',         (select count(*) from public.waitlist),
    'circles',          (select count(*) from public.circles)
  );
end;
$$;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
