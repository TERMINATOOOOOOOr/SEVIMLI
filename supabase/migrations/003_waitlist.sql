-- 003_waitlist.sql — ранний список ожидания (сбор реальной тяги до боевого запуска).
-- Любой может записаться (анонимно), но читать заявки может только владелец проекта.
-- Публичный счётчик отдаётся через SECURITY DEFINER-функцию, без доступа к строкам.

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  contact    text not null,               -- телефон / @telegram / email
  city       text,
  interests  text[] default '{}',         -- 'kbeauty' | 'clothes' | 'salons'
  source     text,                        -- метка канала (utm/ig/tg)
  created_at timestamptz default now()
);

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- Публичная анонимная запись в лист ожидания.
drop policy if exists "waitlist public insert" on public.waitlist;
create policy "waitlist public insert"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- Читать заявки могут только админы (role='admin' в profiles).
drop policy if exists "waitlist admin read" on public.waitlist;
create policy "waitlist admin read"
  on public.waitlist for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Публичный счётчик записавшихся — без раскрытия строк.
create or replace function public.waitlist_count()
returns bigint
language sql
security definer
set search_path = public
as $$ select count(*) from public.waitlist $$;

grant execute on function public.waitlist_count() to anon, authenticated;
