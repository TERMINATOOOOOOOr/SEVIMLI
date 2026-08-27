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
  pharmacy: 'Аптека',
  grocery: 'Продукты',
}

export const CATEGORY_LABEL_UZ: Record<string, string> = {
  clothes: 'Kiyim va poyabzal',
  beauty: 'Kosmetika va byuti',
  lingerie: 'Ichki kiyim',
  salons: 'Salonlar va massaj',
  kids: 'Bolalar mahsulotlari',
  home: 'Uy uchun mahsulotlar',
  pharmacy: 'Dorixona',
  grocery: 'Oziq-ovqat',
}

/** Подпись категории на нужном языке. */
export function categoryLabel(slug: string | null | undefined, lang: 'ru' | 'uz'): string {
  if (!slug) return lang === 'uz' ? "Do'kon" : 'Магазин'
  const map = lang === 'uz' ? CATEGORY_LABEL_UZ : CATEGORY_LABEL
  return map[slug] ?? slug
}

export function categoryEmoji(slug?: string | null): string {
  return (slug && CATEGORY_EMOJI[slug]) || '🛍️'
}
