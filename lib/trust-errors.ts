/**
 * Разбор ошибок базы для товаров и оформления заказа.
 * Ответ PostgREST — обычный объект `{ message, code }`, поэтому `instanceof Error` для него ложно.
 */

export type TrustErrorCode =
  | 'product_expired'
  | 'stock'
  | 'unavailable'
  | 'too_many_pending'
  | 'product_has_history'
  | 'product_limit'
  | 'auth'
  | 'duplicate'
  | 'unknown'

export interface TrustError {
  code: TrustErrorCode
  /** Название товара, если база его сообщила. */
  detail?: string
}

export function mapTrustError(e: unknown): TrustError {
  const err = (e ?? {}) as { message?: unknown; code?: unknown }
  const msg = typeof err.message === 'string' ? err.message : ''
  const code = typeof err.code === 'string' ? err.code : ''

  let m = msg.match(/product_expired:\s*(.+)$/)
  if (m) return { code: 'product_expired', detail: m[1].trim() }
  m = msg.match(/not enough stock for\s+(.+)$/)
  if (m) return { code: 'stock', detail: m[1].trim() }
  if (/is not available/.test(msg)) return { code: 'unavailable' }
  if (/too many pending orders/.test(msg)) return { code: 'too_many_pending' }
  if (/product_has_history/.test(msg)) return { code: 'product_has_history' }
  if (/product limit|limit reached|products? limit/i.test(msg)) return { code: 'product_limit' }
  if (code === '23505') return { code: 'duplicate' }
  if (code === '42501') return { code: 'auth' }
  return { code: 'unknown' }
}
