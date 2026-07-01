import type { Category, Shop, Product, Review } from '@/lib/types'

/**
 * Демо-данные для локального просмотра, пока не подключён реальный Supabase.
 * Как только в .env.local появятся реальные ключи (см. DEPLOY.md), все выборки
 * начнут идти из базы, а эти данные использоваться не будут.
 */

export const demoCategories: Category[] = [
  { id: 1, slug: 'clothes', name_ru: 'Одежда и обувь', name_uz: 'Kiyim va poyabzal', icon: '👗', parent_id: null, sort_order: 1 },
  { id: 2, slug: 'beauty', name_ru: 'Косметика и бьюти', name_uz: 'Kosmetika', icon: '💄', parent_id: null, sort_order: 2 },
  { id: 3, slug: 'lingerie', name_ru: 'Нижнее бельё', name_uz: 'Ich kiyim', icon: '🩲', parent_id: null, sort_order: 3 },
  { id: 4, slug: 'salons', name_ru: 'Салоны и массаж', name_uz: 'Salonlar', icon: '💆', parent_id: null, sort_order: 4 },
  { id: 5, slug: 'kids', name_ru: 'Детские товары', name_uz: 'Bolalar', icon: '🍼', parent_id: null, sort_order: 5 },
  { id: 6, slug: 'home', name_ru: 'Товары для дома', name_uz: 'Uy uchun', icon: '🏠', parent_id: null, sort_order: 6 },
  { id: 7, slug: 'pharmacy', name_ru: 'Аптека', name_uz: 'Dorixona', icon: '💊', parent_id: null, sort_order: 7 },
  { id: 8, slug: 'grocery', name_ru: 'Продукты', name_uz: 'Oziq-ovqat', icon: '🛒', parent_id: null, sort_order: 8 },
]

export const demoShops: Shop[] = [
  { id: 's1', owner_id: null, name: 'Lola Boutique', description: 'Женская одежда и аксессуары из Стамбула. Новые коллекции каждую неделю.', category_slug: 'clothes', logo_url: null, city: 'Ташкент', phone: '+998 90 123 45 67', instagram: 'lola.boutique', is_verified: true, rating: 4.8, reviews_count: 124, created_at: '2026-05-01T10:00:00Z' },
  { id: 's2', owner_id: null, name: 'Zebo Cosmetics', description: 'Оригинальная корейская и европейская косметика.', category_slug: 'beauty', logo_url: null, city: 'Ташкент', phone: '+998 90 222 33 44', instagram: 'zebo.cosmetics', is_verified: true, rating: 4.9, reviews_count: 210, created_at: '2026-04-15T10:00:00Z' },
  { id: 's3', owner_id: null, name: 'Nozanin Lingerie', description: 'Нижнее бельё и домашняя одежда для женщин.', category_slug: 'lingerie', logo_url: null, city: 'Самарканд', phone: '+998 91 555 66 77', instagram: 'nozanin.lingerie', is_verified: false, rating: 4.7, reviews_count: 88, created_at: '2026-05-20T10:00:00Z' },
  { id: 's4', owner_id: null, name: 'Malika Beauty Salon', description: 'Салон красоты: маникюр, брови, макияж, массаж. Запись онлайн.', category_slug: 'salons', logo_url: null, city: 'Ташкент', phone: '+998 90 777 88 99', instagram: 'malika.beauty', is_verified: true, rating: 4.9, reviews_count: 340, created_at: '2026-03-10T10:00:00Z' },
  { id: 's5', owner_id: null, name: 'Bebi Kids', description: 'Всё для малышей: одежда, игрушки, коляски.', category_slug: 'kids', logo_url: null, city: 'Ташкент', phone: '+998 93 111 22 33', instagram: 'bebi.kids', is_verified: false, rating: 4.6, reviews_count: 65, created_at: '2026-06-01T10:00:00Z' },
  { id: 's6', owner_id: null, name: 'Uy Home Decor', description: 'Декор и текстиль для уютного дома.', category_slug: 'home', logo_url: null, city: 'Бухара', phone: '+998 94 444 55 66', instagram: 'uy.decor', is_verified: false, rating: 4.5, reviews_count: 42, created_at: '2026-06-10T10:00:00Z' },
]

function withShop(p: Omit<Product, 'shop'>): Product {
  return { ...p, shop: demoShops.find((s) => s.id === p.shop_id) ?? null }
}

const base = {
  currency: 'UZS',
  images: [] as string[],
  is_active: true,
}

export const demoProducts: Product[] = [
  { ...base, id: 'p1', shop_id: 's1', name: 'Платье миди «Aurora»', description: 'Лёгкое платье из вискозы, свободный крой, длина миди. Идеально для лета.', price: 349000, old_price: 490000, category_slug: 'clothes', stock: 12, created_at: '2026-06-25T10:00:00Z' },
  { ...base, id: 'p2', shop_id: 's1', name: 'Костюм двойка «Milano»', description: 'Пиджак и брюки, костюмная ткань, цвет пудра.', price: 690000, old_price: null, category_slug: 'clothes', stock: 5, created_at: '2026-06-24T10:00:00Z' },
  { ...base, id: 'p3', shop_id: 's1', name: 'Сумка кожаная «Bella»', description: 'Натуральная кожа, регулируемый ремень.', price: 420000, old_price: 520000, category_slug: 'clothes', stock: 8, created_at: '2026-06-20T10:00:00Z' },
  { ...base, id: 'p4', shop_id: 's2', name: 'Сыворотка с витамином C', description: 'Осветляющая сыворотка для лица, 30 мл.', price: 189000, old_price: 240000, category_slug: 'beauty', stock: 30, created_at: '2026-06-26T10:00:00Z' },
  { ...base, id: 'p5', shop_id: 's2', name: 'Палетка теней «Nude 12»', description: '12 матовых и шиммерных оттенков.', price: 155000, old_price: null, category_slug: 'beauty', stock: 22, created_at: '2026-06-23T10:00:00Z' },
  { ...base, id: 'p6', shop_id: 's2', name: 'Набор кистей для макияжа', description: '10 профессиональных кистей в чехле.', price: 220000, old_price: 280000, category_slug: 'beauty', stock: 15, created_at: '2026-06-18T10:00:00Z' },
  { ...base, id: 'p7', shop_id: 's3', name: 'Комплект белья «Роза»', description: 'Кружевной комплект, размеры S–XL.', price: 175000, old_price: 210000, category_slug: 'lingerie', stock: 18, created_at: '2026-06-22T10:00:00Z' },
  { ...base, id: 'p8', shop_id: 's3', name: 'Пижама шёлковая', description: 'Домашний костюм из искусственного шёлка.', price: 240000, old_price: null, category_slug: 'lingerie', stock: 10, created_at: '2026-06-19T10:00:00Z' },
  { ...base, id: 'p9', shop_id: 's5', name: 'Комбинезон для новорождённых', description: 'Мягкий хлопок, 0–6 месяцев.', price: 95000, old_price: 120000, category_slug: 'kids', stock: 40, created_at: '2026-06-27T10:00:00Z' },
  { ...base, id: 'p10', shop_id: 's5', name: 'Развивающий коврик', description: 'Игровой коврик с дугами и игрушками.', price: 310000, old_price: null, category_slug: 'kids', stock: 7, created_at: '2026-06-21T10:00:00Z' },
  { ...base, id: 'p11', shop_id: 's6', name: 'Плед вязаный «Cozy»', description: 'Тёплый плед из акрила, 150×200 см.', price: 210000, old_price: 260000, category_slug: 'home', stock: 14, created_at: '2026-06-17T10:00:00Z' },
  { ...base, id: 'p12', shop_id: 's6', name: 'Набор свечей ароматических', description: '3 свечи: ваниль, лаванда, сандал.', price: 130000, old_price: null, category_slug: 'home', stock: 25, created_at: '2026-06-15T10:00:00Z' },
  { ...base, id: 'p13', shop_id: 's4', name: 'Массаж расслабляющий, 60 мин', description: 'Сеанс массажа всего тела. Запись через салон.', price: 250000, old_price: null, category_slug: 'salons', stock: 100, created_at: '2026-06-28T10:00:00Z' },
  { ...base, id: 'p14', shop_id: 's4', name: 'Маникюр + покрытие гель-лак', description: 'Комплексный уход и покрытие.', price: 150000, old_price: null, category_slug: 'salons', stock: 100, created_at: '2026-06-16T10:00:00Z' },
].map(withShop)

export const demoReviews: Review[] = [
  { id: 'r1', product_id: 'p1', user_id: null, rating: 5, text: 'Платье шикарное, ткань приятная, села идеально!', created_at: '2026-06-27T12:00:00Z', author: { id: 'u1', name: 'Дилноза', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-06-27T12:00:00Z' } },
  { id: 'r2', product_id: 'p1', user_id: null, rating: 4, text: 'Красивое, но доставка немного задержалась.', created_at: '2026-06-26T12:00:00Z', author: { id: 'u2', name: 'Малика', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-06-26T12:00:00Z' } },
  { id: 'r3', product_id: 'p4', user_id: null, rating: 5, text: 'Кожа стала заметно ровнее за 2 недели. Рекомендую!', created_at: '2026-06-25T12:00:00Z', author: { id: 'u3', name: 'Севара', phone: null, role: 'buyer', avatar_url: null, city: 'Самарканд', created_at: '2026-06-25T12:00:00Z' } },
]
