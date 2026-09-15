/**
 * Лёгкий in-memory rate-limiter (перебор логина, квота ассистента).
 * Держит счётчики в Map по ключу (IP / user / global). Для одного инстанса
 * на Railway этого достаточно; при нескольких репликах ключи выносятся
 * в общий стор (Upstash/Redis) — интерфейс тот же.
 */

interface Bucket {
  count: number
  reset: number
}

const buckets = new Map<string, Bucket>()

/** Порог, после которого подметаем протухшие ключи. */
const SWEEP_AT = 5000
/** Жёсткий потолок: если Map всё равно разросся (флуд уникальными ключами) — сбрасываем. */
const HARD_CAP = 20000

export interface RateResult {
  ok: boolean
  remaining: number
  retryAfter: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now()

  if (buckets.size > SWEEP_AT) {
    for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k)
    if (buckets.size > HARD_CAP) buckets.clear()
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

/**
 * Сколько доверенных прокси стоит перед приложением. Railway добавляет
 * ровно один hop — значит доверять можно только ПОСЛЕДНЕМУ адресу в
 * X-Forwarded-For: всё левее клиент может подделать сам.
 */
const TRUSTED_HOPS = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1) || 1)

/** IP клиента из заголовков прокси — берём адрес, который поставил доверенный edge. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) {
    const parts = fwd
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const idx = Math.max(0, parts.length - TRUSTED_HOPS)
    const ip = parts[idx]
    if (ip) return ip
  }
  return headers.get('x-real-ip') ?? 'unknown'
}
