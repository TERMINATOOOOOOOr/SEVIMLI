# Деплой SEVIMLI

Проект: **Next.js 16 (App Router) + Supabase + Tailwind CSS v4**.
Пока в `.env.local` стоят заглушки, сайт работает на демо-данных (`lib/demo.ts`).
Чтобы включить реальную базу, авторизацию, заказы и загрузку фото — выполните шаги ниже.

---

## 1. Создать проект Supabase

1. Зайдите на https://supabase.com → **New project**.
2. Задайте имя, пароль БД и регион (ближайший, напр. `Central EU`).
3. Дождитесь готовности проекта.

## 2. Применить миграцию (создать таблицы)

1. В Supabase откройте **SQL Editor → New query**.
2. Скопируйте содержимое [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) и запустите (**Run**).
3. Это создаст 8 таблиц, RLS-политики, триггер профиля и наполнит категории.

## 3. Создать Storage-бакеты (для фото)

В **Storage → Create bucket** создайте два **публичных** бакета:

| Имя        | Public |
|------------|--------|
| `products` | ✅ да  |
| `shops`    | ✅ да  |

Затем добавьте политику загрузки для авторизованных (Storage → Policies → New policy → *Allow authenticated uploads*), например:

```sql
create policy "authenticated upload products"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'products');

create policy "authenticated upload shops"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'shops');
```

(Чтение публичное, т.к. бакеты public.)

## 4. Настроить Auth

- **Authentication → Providers → Email**: включён по умолчанию.
- Для быстрого старта можно отключить подтверждение по email:
  **Authentication → Sign In / Providers → Email → Confirm email = OFF**
  (тогда после регистрации сразу создаётся сессия).
- **URL Configuration → Site URL**: `http://localhost:3000` для локали и адрес Vercel для прода.
  В **Redirect URLs** добавьте `http://localhost:3000/auth/callback` и `https://<ваш-домен>/auth/callback`.

## 5. Прописать ключи в `.env.local`

Supabase → **Project Settings → API**. Скопируйте значения в `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ваш-проект>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Перезапустите dev-сервер — сайт начнёт брать данные из базы.

## 6. Локальный запуск

```bash
npm install
npm run dev
# http://localhost:3000
```

## 7. Деплой на Vercel

1. Залейте проект на GitHub (`git init && git add . && git commit -m "init" && git push`).
2. На https://vercel.com → **Add New → Project** → импортируйте репозиторий.
3. В **Environment Variables** добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**. Framework preset — Next.js (определится автоматически).
5. После деплоя добавьте адрес Vercel в Supabase → Auth → **Site URL / Redirect URLs** (шаг 4).

---

## Как проверить

- Регистрация на `/auth` → создаётся запись в `profiles` (триггер).
- Кнопка «Стать продавцом» в `/profile` → роль `seller`, открывается `/seller/dashboard`.
- В `/seller/shop` создайте магазин, в `/seller/products` добавьте товары с фото.
- Товары появятся на главной, в каталоге и в поиске.
- Оформление заказа в `/cart` создаёт записи в `orders` и `order_items`.
- Для салонов (категория `salons`) на странице магазина — кнопка «Записаться» → `bookings`.
