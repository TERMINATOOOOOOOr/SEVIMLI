-- ============================================================
-- SEVIMLI — миграция 002: сообщество (соц-медиа), Q&A о товарах,
-- программа лояльности и поля корейской косметики.
-- Применять после 001_init.sql.
-- ============================================================

-- ---------- Поля косметики/оригинала у товаров ----------
alter table public.products add column if not exists brand        text;
alter table public.products add column if not exists country      text;
alter table public.products add column if not exists is_original  boolean default false;
alter table public.products add column if not exists market_price numeric;

-- ---------- Лояльность: баллы и уровень в профиле ----------
alter table public.profiles add column if not exists loyalty_points int  not null default 0;
alter table public.profiles add column if not exists loyalty_tier   text not null default 'bronze'
  check (loyalty_tier in ('bronze', 'silver', 'gold', 'platinum'));
alter table public.profiles add column if not exists loyalty_card_no text;

-- История начислений/списаний баллов
create table if not exists public.loyalty_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  points     int not null,
  reason     text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Сообщество (встроенная соц-медиа)
-- ============================================================
create table if not exists public.community_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null,
  author_city text,
  kind        text not null default 'review' check (kind in ('review', 'question', 'tip')),
  text        text not null,
  images      text[] default '{}',
  tags        text[] default '{}',
  product_id  uuid references public.products(id) on delete set null,
  likes       int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.community_posts(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Вопросы о товаре (Q&A)
-- ============================================================
create table if not exists public.product_questions (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null,
  text        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.product_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid references public.product_questions(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null,
  is_seller   boolean default false,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- Индексы
create index if not exists idx_posts_product     on public.community_posts(product_id);
create index if not exists idx_posts_created     on public.community_posts(created_at desc);
create index if not exists idx_comments_post     on public.post_comments(post_id);
create index if not exists idx_questions_product on public.product_questions(product_id);
create index if not exists idx_answers_question  on public.product_answers(question_id);
create index if not exists idx_loyalty_user      on public.loyalty_entries(user_id);
create index if not exists idx_products_original on public.products(is_original);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.community_posts   enable row level security;
alter table public.post_comments     enable row level security;
alter table public.product_questions enable row level security;
alter table public.product_answers   enable row level security;
alter table public.loyalty_entries   enable row level security;

-- community_posts: читают все; автор создаёт/правит своё
drop policy if exists "posts_read" on public.community_posts;
create policy "posts_read" on public.community_posts for select using (true);
drop policy if exists "posts_insert_own" on public.community_posts;
create policy "posts_insert_own" on public.community_posts for insert with check (auth.uid() = author_id);
drop policy if exists "posts_update_own" on public.community_posts;
create policy "posts_update_own" on public.community_posts for update using (auth.uid() = author_id);
drop policy if exists "posts_delete_own" on public.community_posts;
create policy "posts_delete_own" on public.community_posts for delete using (auth.uid() = author_id);

-- post_comments: читают все; автор создаёт своё
drop policy if exists "comments_read" on public.post_comments;
create policy "comments_read" on public.post_comments for select using (true);
drop policy if exists "comments_insert_own" on public.post_comments;
create policy "comments_insert_own" on public.post_comments for insert with check (auth.uid() = author_id);

-- product_questions: читают все; автор создаёт своё
drop policy if exists "questions_read" on public.product_questions;
create policy "questions_read" on public.product_questions for select using (true);
drop policy if exists "questions_insert_own" on public.product_questions;
create policy "questions_insert_own" on public.product_questions for insert with check (auth.uid() = author_id);

-- product_answers: читают все; автор создаёт своё
drop policy if exists "answers_read" on public.product_answers;
create policy "answers_read" on public.product_answers for select using (true);
drop policy if exists "answers_insert_own" on public.product_answers;
create policy "answers_insert_own" on public.product_answers for insert with check (auth.uid() = author_id);

-- loyalty_entries: пользователь видит только свои
drop policy if exists "loyalty_read_own" on public.loyalty_entries;
create policy "loyalty_read_own" on public.loyalty_entries for select using (auth.uid() = user_id);
drop policy if exists "loyalty_insert_own" on public.loyalty_entries;
create policy "loyalty_insert_own" on public.loyalty_entries for insert with check (auth.uid() = user_id);
