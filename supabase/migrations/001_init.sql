-- ============================================================
-- SEVIMLI — начальная схема базы данных (Supabase / PostgreSQL)
-- Применить в Supabase → SQL Editor или через supabase CLI.
-- ============================================================

-- ---------- 1. profiles (расширение auth.users) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  phone      text,
  role       text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  avatar_url text,
  city       text,
  created_at timestamptz not null default now()
);

-- ---------- 2. categories ----------
create table if not exists public.categories (
  id         serial primary key,
  name_ru    text not null,
  name_uz    text,
  icon       text,
  slug       text unique not null,
  parent_id  int references public.categories(id),
  sort_order int default 0
);

-- ---------- 3. shops ----------
create table if not exists public.shops (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references public.profiles(id) on delete cascade,
  name          text not null,
  description   text,
  category_slug text references public.categories(slug),
  logo_url      text,
  city          text default 'Ташкент',
  phone         text,
  instagram     text,
  is_verified   boolean default false,
  rating        numeric(3, 2) default 0,
  reviews_count int default 0,
  created_at    timestamptz not null default now()
);

-- ---------- 4. products ----------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid references public.shops(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric not null,
  old_price     numeric,
  currency      text default 'UZS',
  images        text[] default '{}',
  category_slug text,
  stock         int default 0,
  is_active     boolean default true,
  created_at    timestamptz not null default now()
);

-- ---------- 5. orders ----------
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid references public.profiles(id),
  shop_id     uuid references public.shops(id),
  status      text default 'pending' check (status in ('pending', 'confirmed', 'delivering', 'done', 'cancelled')),
  total_price numeric,
  address     text,
  comment     text,
  created_at  timestamptz not null default now()
);

-- ---------- 6. order_items ----------
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references public.orders(id) on delete cascade,
  product_id     uuid references public.products(id),
  quantity       int default 1,
  price_at_order numeric
);

-- ---------- 7. reviews ----------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_id    uuid references public.profiles(id),
  rating     int check (rating between 1 and 5),
  text       text,
  created_at timestamptz not null default now()
);

-- ---------- 8. bookings (салоны и услуги) ----------
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid references public.shops(id),
  user_id      uuid references public.profiles(id),
  service_name text,
  booking_date date,
  time_slot    text,
  status       text default 'pending',
  phone        text,
  created_at   timestamptz not null default now()
);

-- Индексы для частых выборок
create index if not exists idx_products_category on public.products(category_slug);
create index if not exists idx_products_shop on public.products(shop_id);
create index if not exists idx_orders_buyer on public.orders(buyer_id);
create index if not exists idx_orders_shop on public.orders(shop_id);
create index if not exists idx_reviews_product on public.reviews(product_id);

-- ============================================================
-- Триггер: при регистрации пользователя создаём запись в profiles
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.shops       enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews     enable row level security;
alter table public.bookings    enable row level security;

-- profiles: читают все, редактирует только владелец
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- categories: публичное чтение
drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories for select using (true);

-- shops: публичное чтение; продавец управляет своими
drop policy if exists "shops_read" on public.shops;
create policy "shops_read" on public.shops for select using (true);
drop policy if exists "shops_insert_own" on public.shops;
create policy "shops_insert_own" on public.shops for insert with check (auth.uid() = owner_id);
drop policy if exists "shops_update_own" on public.shops;
create policy "shops_update_own" on public.shops for update using (auth.uid() = owner_id);
drop policy if exists "shops_delete_own" on public.shops;
create policy "shops_delete_own" on public.shops for delete using (auth.uid() = owner_id);

-- products: публичное чтение; продавец управляет товарами своих магазинов
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select using (true);
drop policy if exists "products_write_own" on public.products;
create policy "products_write_own" on public.products for all
  using (shop_id in (select id from public.shops where owner_id = auth.uid()))
  with check (shop_id in (select id from public.shops where owner_id = auth.uid()));

-- orders: покупатель видит свои, продавец — заказы своих магазинов
drop policy if exists "orders_read" on public.orders;
create policy "orders_read" on public.orders for select using (
  auth.uid() = buyer_id
  or shop_id in (select id from public.shops where owner_id = auth.uid())
);
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = buyer_id);
drop policy if exists "orders_update_seller" on public.orders;
create policy "orders_update_seller" on public.orders for update using (
  shop_id in (select id from public.shops where owner_id = auth.uid())
);

-- order_items: доступ через связанный заказ
drop policy if exists "order_items_read" on public.order_items;
create policy "order_items_read" on public.order_items for select using (
  order_id in (
    select id from public.orders
    where buyer_id = auth.uid()
       or shop_id in (select id from public.shops where owner_id = auth.uid())
  )
);
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items for insert with check (
  order_id in (select id from public.orders where buyer_id = auth.uid())
);

-- reviews: публичное чтение; автор управляет своими
drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews for select using (true);
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- bookings: пользователь видит свои, владелец салона — записи к себе
drop policy if exists "bookings_read" on public.bookings;
create policy "bookings_read" on public.bookings for select using (
  auth.uid() = user_id
  or shop_id in (select id from public.shops where owner_id = auth.uid())
);
drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings for insert with check (auth.uid() = user_id);
drop policy if exists "bookings_update" on public.bookings;
create policy "bookings_update" on public.bookings for update using (
  auth.uid() = user_id
  or shop_id in (select id from public.shops where owner_id = auth.uid())
);

-- ============================================================
-- Seed: категории
-- ============================================================
insert into public.categories (name_ru, name_uz, icon, slug, sort_order) values
  ('Одежда и обувь',   'Kiyim va poyabzal', '👗', 'clothes',  1),
  ('Косметика и бьюти','Kosmetika',         '💄', 'beauty',   2),
  ('Нижнее бельё',     'Ich kiyim',         '🩲', 'lingerie', 3),
  ('Салоны и массаж',  'Salonlar',          '💆', 'salons',   4),
  ('Детские товары',   'Bolalar',           '🍼', 'kids',     5),
  ('Товары для дома',  'Uy uchun',          '🏠', 'home',     6),
  ('Аптека',           'Dorixona',          '💊', 'pharmacy', 7),
  ('Продукты',         'Oziq-ovqat',        '🛒', 'grocery',  8)
on conflict (slug) do nothing;
