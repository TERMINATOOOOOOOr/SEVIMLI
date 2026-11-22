import type { Lang } from '@/lib/i18n'

/** Форматирует цену в UZS с разделителем разрядов: 1290000 → «1 290 000 сум». */
export function formatPrice(value: number | null | undefined, currency = 'UZS', lang: Lang = 'ru'): string {
  if (value == null) return ''
  const suffix = currency === 'UZS' ? (lang === 'en' ? 'UZS' : lang === 'uz' ? "so'm" : 'сум') : currency
  return `${Math.round(value).toLocaleString('ru-RU').replace(/,/g, ' ')} ${suffix}`
}

/** Скидка в процентах между старой и новой ценой (или null). */
export function discountPercent(price: number, oldPrice?: number | null): number | null {
  if (!oldPrice || oldPrice <= price) return null
  return Math.round((1 - price / oldPrice) * 100)
}

/** Дата в формате «1 июля 2026». */
export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Детерминированные названия месяцев (НЕ toLocaleDateString): у Node и
 * браузера разные ICU-данные (особенно для uz) → hydration mismatch.
 */
const MONTHS_SHORT: Record<Lang, string[]> = {
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
const MONTHS_FULL: Record<Lang, string[]> = {
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

/** «1 авг» / «1 avg» — одинаково на сервере и клиенте. */
export function formatDayMonth(value: string | Date, lang: Lang = 'ru'): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return `${d.getDate()} ${MONTHS_SHORT[lang][d.getMonth()]}`
}

/** «1 августа 2026» / «1-avgust 2026» — одинаково на сервере и клиенте. */
export function formatDateLang(value: string | Date, lang: Lang = 'ru'): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (lang === 'uz') return `${d.getDate()}-${MONTHS_FULL.uz[d.getMonth()]} ${d.getFullYear()}`
  if (lang === 'en') return `${MONTHS_FULL.en[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  return `${d.getDate()} ${MONTHS_FULL.ru[d.getMonth()]} ${d.getFullYear()}`
}

/** Относительное время для ленты: «5 мин назад», «2 ч назад», «3 дн назад». */
export function formatRelative(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} дн назад`
  return formatDate(d)
}

/** Цена с локализованной валютой: «120 000 сум» / «120 000 so'm». */
export function formatPriceLang(
  value: number | null | undefined,
  lang: Lang = 'ru',
): string {
  if (value == null) return ''
  const suffix = lang === 'uz' ? "so'm" : lang === 'en' ? 'UZS' : 'сум'
  return `${Math.round(value).toLocaleString('ru-RU').replace(/,/g, ' ')} ${suffix}`
}

/** Относительное время с учётом языка. */
export function formatRelativeLang(value: string | Date, lang: Lang = 'ru'): string {
  if (lang === 'ru') return formatRelative(value)
  const d = typeof value === 'string' ? new Date(value) : value
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (lang === 'en') {
    if (min < 1) return 'just now'
    if (min < 60) return `${min} min ago`
    const hours = Math.floor(min / 60)
    if (hours < 24) return `${hours} hr ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} days ago`
    return formatDateLang(d, lang)
  }
  if (min < 1) return 'hozirgina'
  if (min < 60) return `${min} daq oldin`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} kun oldin`
  return formatDateLang(d, 'uz')
}

/** Баллы с учётом языка: RU — со склонением, UZ — «120 ball». */
export function formatPointsLang(n: number, lang: Lang = 'ru'): string {
  if (lang === 'uz') return `${n.toLocaleString('ru-RU').replace(/,/g, ' ')} ball`
  if (lang === 'en') return `${n.toLocaleString('en-US')} points`
  return formatPoints(n)
}

/** Число баллов со словом: «120 баллов». */
export function formatPoints(n: number): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  let word = 'баллов'
  if (abs < 11 || abs > 14) {
    if (last === 1) word = 'балл'
    else if (last >= 2 && last <= 4) word = 'балла'
  }
  return `${n.toLocaleString('ru-RU').replace(/,/g, ' ')} ${word}`
}
