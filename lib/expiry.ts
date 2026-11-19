import type { Dict } from '@/lib/i18n'

/**
 * Срок годности: разбор и показ без `new Date()` по строке даты, чтобы сервер и браузер
 * считали одинаково. «Сегодня» — по Ташкенту (UTC+5), как today_uz() в базе.
 */

/** До конца срока меньше этого числа месяцев — показываем предупреждение. */
export const SOON_MONTHS = 6

type ExpiryFields = {
  expires_on?: string | null
  expires_precision?: 'month' | 'day' | null
  made_on?: string | null
  pao_months?: number | null
  no_expiry?: boolean | null
}

export type ExpiryState = 'unknown' | 'none' | 'mfg' | 'ok' | 'soon' | 'expired'

/** Сегодняшняя дата в Ташкенте: ГГГГ-ММ-ДД. */
export function todayTashkent(): string {
  const d = new Date(Date.now() + 5 * 60 * 60 * 1000)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${mm}-${dd}`
}

/** «2028-03-01» → «03.2028». */
export function monthYear(iso: string): string {
  const [y, m] = iso.slice(0, 10).split('-')
  return `${m}.${y}`
}

/** «2026-11-20» → «20.11.2026». */
export function dayMonthYear(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}.${m}.${y}`
}

/** Прибавить месяцы к дате ГГГГ-ММ-ДД (день сохраняется, если он есть в новом месяце). */
export function addMonthsIso(iso: string, n: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate()
  return `${ny}-${String(nm).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`
}

/** Состояние срока относительно сегодняшнего дня (ГГГГ-ММ-ДД). */
export function expiryState(p: ExpiryFields, today: string): ExpiryState {
  if (p.expires_on) {
    const exp = p.expires_on.slice(0, 10)
    if (exp <= today) return 'expired'
    if (exp <= addMonthsIso(today, SOON_MONTHS)) return 'soon'
    return 'ok'
  }
  if (p.made_on) return 'mfg'
  if (p.no_expiry) return 'none'
  return 'unknown'
}

/** Строка срока для карточки и заказа: «Годен до 03.2028» / «03.2028 gacha yaroqli». */
export function formatExpiry(p: ExpiryFields, t: Dict['product']): string {
  if (p.expires_on) {
    const date = p.expires_precision === 'day' ? dayMonthYear(p.expires_on) : monthYear(p.expires_on)
    return [t.expiresPrefix, date, t.expiresSuffix].filter(Boolean).join(' ')
  }
  if (p.made_on) {
    const parts = [`${t.madeOn} ${monthYear(p.made_on)}`]
    if (p.pao_months) parts.push(`${t.pao} ${p.pao_months} ${t.months}`)
    return parts.join(' · ')
  }
  return ''
}
