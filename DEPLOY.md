# Деплой SEVIMLI

Проект: **Next.js 16 (App Router) + Supabase + Tailwind CSS v4**, хостинг — **Railway**.
Пока в `.env.local` стоят заглушки, сайт работает на демо-данных (`lib/demo.ts`) и показывает баннер «Демо-витрина».
Чтобы включить реальную базу, авторизацию, заказы и загрузку фото — выполните шаги ниже по порядку.

---

## 1. Создать проект Supabase

1. https://supabase.com → **New project**: имя `sevimli`, регион **Frankfurt (eu-central-1)**, сильный пароль БД (сохраните).
2. Дождитесь готовности проекта.
3. **Project Settings → API**: скопируйте `Project URL`, `anon public` и `service_role` (секрет, только сервер).

## 2. Применить миграции — строго по порядку

**SQL Editor → New query**, запускайте файлы из `supabase/migrations/` один за другим:

| № | Файл | Что делает |
|---|------|------------|
| 1 | `001_init.sql` | базовые таблицы, RLS, триггер профиля, категории |
| 2 | `002_social_loyalty.sql` | сообщество, Q&A, лояльность, поля K-beauty |
| 3 | `003_waitlist.sql` | лист ожидания |
| 4 | `004_launch.sql` | **обязательно перед первым живым пользователем**: закрытие дыр RLS, серверное оформление заказа (`create_order`), закрытие по коду (`complete_order`), реестр подлинности (`verify_code`), доставка продавцом, Storage-бакеты и политики, события аналитики |

Каждая миграция идемпотентна — повторный запуск безопасен.

## 3. Storage

Бакеты `products` и `shops` (публичные, до 5 МБ, только jpeg/png/webp) и политики владельца
создаются миграцией **004** — вручную ничего делать не нужно.

## 4. Auth и почта (без этого регистрация не работает)

Встроенная почта Supabase шлёт **2 письма в час и только членам проекта** — для реальных пользователей нужен свой SMTP.

1. Заведите аккаунт **Resend** (бесплатно 3 000 писем/мес), добавьте домен `sevimli.uz`, пропишите SPF/DKIM/DMARC из панели Resend в DNS домена, дождитесь верификации.
2. Supabase → **Authentication → SMTP Settings → Enable Custom SMTP**: host `smtp.resend.com`, port `465`, user `resend`, password — API-ключ Resend, sender `hello@sevimli.uz`.
3. **Authentication → Email Templates**: шаблоны *Confirm signup* и *Reset password* — на русском/узбекском, ссылка вида `{{ .ConfirmationURL }}`.
4. **URL Configuration**: Site URL — `https://sevimli.uz` (или текущий адрес Railway); Redirect URLs — `https://<домен>/auth/callback`, `http://localhost:3000/auth/callback`.
5. **Confirm email = ON** (защита от опечаток и мультиаккаунтов). Восстановление пароля работает через `/auth/forgot` → письмо → `/auth/reset`.
6. Рекомендуется: **Auth → Bot and Abuse Protection** — включить Turnstile.

## 5. Переменные окружения

`.env.local` (локально) и Railway → **Variables** (прод):

```
NEXT_PUBLIC_SUPABASE_URL=https://<проект>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>     # только сервер: сид, служебные скрипты
ANTHROPIC_API_KEY=sk-ant-...                      # ассистент Севиля
ASSISTANT_MODEL=claude-haiku-4-5
ASSISTANT_DAILY_CAP=2000
TRUSTED_PROXY_HOPS=1
NEXT_PUBLIC_DEMO_MODE=                            # 1 — принудительно показывать баннер «демо»
NEXT_PUBLIC_COURIER_DEMO=                         # 1 — открыть демо-кабинет курьера /courier
```

На Railway `NEXT_PUBLIC_*` должны быть заданы **до** сборки (они вшиваются в бандл).

## 6. Демо-каталог для стенда (необязательно)

```bash
npm run seed            # залить демо-магазины и товары (помечены is_demo)
npm run seed -- --clear # удалить всё демо перед боевым запуском
```

## 7. Локальный запуск

```bash
npm install
npm run dev
# http://localhost:3000
```

## 8. Деплой на Railway

```bash
railway up -y --ci --service sevimli
```

Сборка идёт на сервере; сообщение «Failed to stream build logs» — не ошибка. Проверка: главная без баннера «Демо-витрина», `/courier` → 404.

---

## Как проверить после подключения базы

- Регистрация на `/auth` → письмо подтверждения приходит (SMTP) → запись в `profiles` (триггер).
- «Стать продавцом» в `/profile` → роль `seller` через `become_seller()`, открывается `/seller/dashboard`.
- `/seller/shop`: магазин, условия доставки и самовывоз; `/seller/products`: товары с фото (Storage).
- `/cart`: заказ создаётся серверной функцией `create_order` — цены и сток берутся из базы.
- `/seller/orders`: продавец видит состав заказа и телефон, закрывает заказ по 4-значному коду покупательницы → баллы начисляются автоматически.
- `/verify`: код из таблицы `authenticity_codes` → счётчик проверок.
- Снаружи: `curl` с anon-ключом к `/rest/v1/profiles?select=phone` должен вернуть пусто (телефоны не публичны).
