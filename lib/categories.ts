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

export function categoryEmoji(slug?: string | null): string {
  return (slug && CATEGORY_EMOJI[slug]) || '🛍️'
}
