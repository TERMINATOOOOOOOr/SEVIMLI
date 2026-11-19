/** Иконки и названия категорий (для плейсхолдеров и подписей на клиенте). */

export const CATEGORY_EMOJI: Record<string, string> = {
  clothes: '👗',
  beauty: '💄',
  lingerie: '🩲',
  salons: '💆',
  kids: '🍼',
  home: '🏠',
  pharmacy: '💊',
  grocery: '🛒',
}

export const CATEGORY_LABEL: Record<string, string> = {
  clothes: 'Одежда и обувь',
  beauty: 'Косметика и бьюти',
  lingerie: 'Нижнее бельё',
  salons: 'Салоны и массаж',
  kids: 'Детские товары',
  home: 'Товары для дома',
  pharmacy: 'Здоровье и гигиена',
  grocery: 'Продукты',
}

export const CATEGORY_LABEL_UZ: Record<string, string> = {
  clothes: 'Kiyim va poyabzal',
  beauty: 'Kosmetika va byuti',
  lingerie: 'Ichki kiyim',
  salons: 'Salonlar va massaj',
  kids: 'Bolalar mahsulotlari',
  home: 'Uy uchun mahsulotlar',
  pharmacy: 'Salomatlik va gigiyena',
  grocery: 'Oziq-ovqat',
}

/** Подпись категории на нужном языке. */
export function categoryLabel(slug: string | null | undefined, lang: 'ru' | 'uz'): string {
  if (!slug) return lang === 'uz' ? "Do'kon" : 'Магазин'
  const map = lang === 'uz' ? CATEGORY_LABEL_UZ : CATEGORY_LABEL
  return map[slug] ?? slug
}

/** Нужен ли товару категории срок годности в форме продавца. */
export const EXPIRY_MODE: Record<string, 'required' | 'optional' | 'hidden'> = {
  beauty: 'required',
  pharmacy: 'required',
  grocery: 'optional',
  kids: 'optional',
  home: 'optional',
  clothes: 'hidden',
  lingerie: 'hidden',
  salons: 'hidden',
}

export function expiryMode(slug: string | null | undefined): 'required' | 'optional' | 'hidden' {
  return (slug && EXPIRY_MODE[slug]) || 'optional'
}

/** Продукты приходят с точной датой, остальное — месяц и год, как на упаковке. */
export function defaultPrecision(slug: string | null | undefined): 'month' | 'day' {
  return slug === 'grocery' ? 'day' : 'month'
}

export function categoryEmoji(slug?: string | null): string {
  return (slug && CATEGORY_EMOJI[slug]) || '🛍️'
}
