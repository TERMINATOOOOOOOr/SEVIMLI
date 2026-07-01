/** Форматирует цену в UZS с разделителем разрядов: 1290000 → «1 290 000 сум». */
export function formatPrice(value: number | null | undefined, currency = 'UZS'): string {
  if (value == null) return ''
  const suffix = currency === 'UZS' ? 'сум' : currency
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
