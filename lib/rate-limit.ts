/**
 * Лёгкий in-memory rate-limiter для middleware (перебор логина, брутфорс).
 * Держит счётчики попыток в Map по ключу (обычно IP). Для одного инстанса
 * на Railway этого достаточно; в проде с несколькими репликами ключи
 * выносятся в общий стор (Upstash/Redis) — интерфейс тот же.
 */

interface Bucket {
  count: number
  reset: number
}

const buckets = new Map<string, Bucket>()

export interface RateResult {
  ok: boolean
  remaining: number
  retryAfter: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now()

  // Изредка подметаем протухшие ключи, чтобы Map не рос без предела
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k)
  }

  const b = buckets.get(key)
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  b.count++
  if (b.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.reset - now) / 1000) }
  }
  return { ok: true, remaining: limit - b.count, retryAfter: 0 }
}

/** IP клиента из заголовков прокси (Railway отдаёт x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}
