/**
 * Клиентские криптопримитивы демо-режима.
 * В проде хэширование паролей выполняет Supabase Auth (bcrypt на сервере);
 * здесь хэшируем локально, чтобы пароль никогда не существовал в приложении
 * в открытом виде — ни в сторах, ни в сравнениях, ни в бандле.
 */

/** SHA-256 → hex (Web Crypto, работает в браузере и Node 20+). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Хэш демо-пароля (sha256("demo123")). В коде хранится только хэш —
 * сравнение идёт хэш-к-хэшу, plaintext-константы пароля в бандле нет.
 */
export const DEMO_PASSWORD_SHA256 =
  'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791'

/** Проверка пароля демо-аккаунта без plaintext-сравнения. */
export async function verifyDemoPassword(password: string): Promise<boolean> {
  return (await sha256Hex(password)) === DEMO_PASSWORD_SHA256
}

/**
 * Защита от open redirect: принимаем только внутренние пути.
 * Отклоняем абсолютные URL, протоколы, //host, userinfo (@) и бэкслэши.
 */
export function safeInternalPath(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//')) return fallback
  if (value.includes('\\') || value.includes('@') || value.includes(':')) return fallback
  return value
}
