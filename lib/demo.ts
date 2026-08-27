import type {
  Category,
  Shop,
  Product,
  Review,
  CommunityPost,
  ProductQuestion,
  Order,
  Booking,
} from '@/lib/types'

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
  { id: 's7', owner_id: null, name: 'Seoul Beauty', description: 'Официальный импорт корейской косметики. 100% оригинал, гарантия подлинности, бесплатная доставка по Ташкенту.', category_slug: 'beauty', logo_url: null, city: 'Ташкент', phone: '+998 90 700 07 07', instagram: 'seoulbeauty.uz', is_verified: true, rating: 4.9, reviews_count: 512, created_at: '2026-04-01T10:00:00Z' },
  { id: 's8', owner_id: null, name: 'Salomat Pharm', description: 'Лицензированная аптека: витамины, дермокосметика, товары для здоровья. Консультация фармацевта в чате.', category_slug: 'pharmacy', logo_url: null, city: 'Ташкент', phone: '+998 71 200 03 03', instagram: 'salomat.pharm', is_verified: true, rating: 4.8, reviews_count: 156, created_at: '2026-06-20T10:00:00Z' },
  { id: 's9', owner_id: null, name: 'Yashil Bozor', description: 'Фермерские продукты как с базара: мёд, орехи, сезонные фрукты. Доставка в день заказа.', category_slug: 'grocery', logo_url: null, city: 'Ташкент', phone: '+998 90 555 09 09', instagram: 'yashil.bozor', is_verified: false, rating: 4.7, reviews_count: 89, created_at: '2026-07-01T10:00:00Z' },
]

// Реальные фото лежат в public/img (см. скрипт загрузки): товары — по id,
// магазины — по id, аватары — по имени автора.
demoShops.forEach((s) => {
  s.logo_url = `/img/shops/${s.id}.jpg`
})

/** Аватары постоянных героинь демо-данных. */
export const DEMO_AVATARS: Record<string, string> = {
  Нигора: '/img/avatars/a1.jpg',
  Малика: '/img/avatars/a2.jpg',
  Севара: '/img/avatars/a3.jpg',
  Дилноза: '/img/avatars/a4.jpg',
  Камила: '/img/avatars/a5.jpg',
  Зарина: '/img/avatars/a6.jpg',
  Гульнора: '/img/avatars/a7.jpg',
  Феруза: '/img/avatars/a8.jpg',
}

function withShop(p: Omit<Product, 'shop'>): Product {
  return {
    ...p,
    images: p.images.length ? p.images : [`/img/products/${p.id}.jpg`],
    shop: demoShops.find((s) => s.id === p.shop_id) ?? null,
  }
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

  // --- Корейская косметика (Seoul Beauty, 100% оригинал) ---
  { ...base, id: 'k1', shop_id: 's7', name: 'COSRX Advanced Snail 96 Mucin Power Essence', description: 'Эссенция с 96% муцином улитки. Увлажнение, восстановление, сияние. 100 мл. Официальный оригинал.', brand: 'COSRX', country: 'Корея', is_original: true, price: 139000, old_price: 189000, market_price: 210000, category_slug: 'beauty', stock: 60, created_at: '2026-07-14T10:00:00Z' },
  { ...base, id: 'k2', shop_id: 's7', name: 'Beauty of Joseon Relief Sun SPF50+ PA++++', description: 'Лёгкий солнцезащитный крем с рисом и пробиотиками. Без белых следов. 50 мл.', brand: 'Beauty of Joseon', country: 'Корея', is_original: true, price: 99000, old_price: 135000, market_price: 155000, category_slug: 'beauty', stock: 80, created_at: '2026-07-13T10:00:00Z' },
  { ...base, id: 'k3', shop_id: 's7', name: 'Anua Heartleaf 77% Soothing Toner', description: 'Успокаивающий тонер с экстрактом хауттюйнии 77%. Для чувствительной кожи. 250 мл.', brand: 'Anua', country: 'Корея', is_original: true, price: 149000, old_price: 199000, market_price: 230000, category_slug: 'beauty', stock: 45, created_at: '2026-07-12T10:00:00Z' },
  { ...base, id: 'k4', shop_id: 's7', name: 'SOME BY MI AHA-BHA-PHA 30 Days Miracle Toner', description: 'Тонер-эксфолиант с кислотами и чайным деревом. Против воспалений. 150 мл.', brand: 'SOME BY MI', country: 'Корея', is_original: true, price: 129000, old_price: 175000, market_price: 195000, category_slug: 'beauty', stock: 38, created_at: '2026-07-11T10:00:00Z' },
  { ...base, id: 'k5', shop_id: 's7', name: 'Torriden DIVE-IN Low Molecular Hyaluronic Serum', description: 'Сыворотка с 5D гиалуроновой кислотой. Глубокое увлажнение. 50 мл.', brand: 'Torriden', country: 'Корея', is_original: true, price: 145000, old_price: 195000, market_price: 220000, category_slug: 'beauty', stock: 52, created_at: '2026-07-10T10:00:00Z' },
  { ...base, id: 'k6', shop_id: 's7', name: 'medicube Zero Pore Pad 2.0', description: 'Пэды для сужения пор и мягкой эксфолиации. 70 шт.', brand: 'medicube', country: 'Корея', is_original: true, price: 179000, old_price: 240000, market_price: 275000, category_slug: 'beauty', stock: 30, created_at: '2026-07-09T10:00:00Z' },
  { ...base, id: 'k7', shop_id: 's7', name: 'numbuzin No.3 Skin Softening Serum', description: 'Сыворотка с ниацинамидом и экстрактами для ровного тона. 50 мл.', brand: 'numbuzin', country: 'Корея', is_original: true, price: 159000, old_price: 210000, market_price: 245000, category_slug: 'beauty', stock: 41, created_at: '2026-07-08T10:00:00Z' },
  { ...base, id: 'k8', shop_id: 's7', name: 'ROUND LAB 1025 Dokdo Toner', description: 'Увлажняющий тонер с морской водой Токто и пантенолом. 200 мл.', brand: 'ROUND LAB', country: 'Корея', is_original: true, price: 135000, old_price: 180000, market_price: 205000, category_slug: 'beauty', stock: 47, created_at: '2026-07-07T10:00:00Z' },

  // --- Одежда и обувь (Lola Boutique) ---
  { ...base, id: 'p15', shop_id: 's1', name: 'Блузка шёлковая «Ivory»', description: 'Струящаяся блузка из искусственного шёлка, свободный крой. Размеры S–XL.', price: 195000, old_price: 240000, category_slug: 'clothes', stock: 16, created_at: '2026-07-26T10:00:00Z' },
  { ...base, id: 'p16', shop_id: 's1', name: 'Юбка плиссе «Nilufar»', description: 'Юбка-плиссе миди, лёгкая ткань, резинка на талии.', price: 165000, old_price: null, category_slug: 'clothes', stock: 20, created_at: '2026-07-23T10:00:00Z' },
  { ...base, id: 'p17', shop_id: 's1', name: 'Туфли лодочки «Grace»', description: 'Классические лодочки, каблук 7 см, экокожа. Размеры 35–40.', price: 320000, old_price: 385000, category_slug: 'clothes', stock: 11, created_at: '2026-07-29T10:00:00Z' },
  { ...base, id: 'p18', shop_id: 's1', name: 'Кроссовки белые «Street»', description: 'Универсальные белые кроссовки на каждый день. Размеры 35–41.', price: 290000, old_price: null, category_slug: 'clothes', stock: 24, created_at: '2026-07-31T10:00:00Z' },
  { ...base, id: 'p19', shop_id: 's1', name: 'Пальто осеннее «Tashkent»', description: 'Прямое пальто из смесовой шерсти, пояс в комплекте. Цвет кэмел.', price: 780000, old_price: 920000, category_slug: 'clothes', stock: 7, created_at: '2026-08-01T12:00:00Z' },
  { ...base, id: 'p20', shop_id: 's1', name: 'Платок шёлковый «Atlas»', description: 'Платок из натурального шёлка с национальным узором, 90×90 см.', price: 85000, old_price: null, category_slug: 'clothes', stock: 35, created_at: '2026-07-22T10:00:00Z' },

  // --- Косметика (Zebo Cosmetics) ---
  { ...base, id: 'p21', shop_id: 's2', name: 'Тушь для ресниц Volume Pro', description: 'Объёмная тушь, не осыпается, стойкость 12 часов.', price: 95000, old_price: null, category_slug: 'beauty', stock: 40, created_at: '2026-07-24T10:00:00Z' },
  { ...base, id: 'p22', shop_id: 's2', name: 'Крем для рук с маслом ши', description: 'Питательный крем для рук, 75 мл. Впитывается без липкости.', price: 45000, old_price: null, category_slug: 'beauty', stock: 60, created_at: '2026-07-21T10:00:00Z' },
  { ...base, id: 'p23', shop_id: 's2', name: 'Парфюм «Oud Rose» 50 мл', description: 'Восточный аромат: роза, уд, ваниль. Стойкость 8+ часов.', price: 420000, old_price: 520000, category_slug: 'beauty', stock: 9, created_at: '2026-08-01T10:00:00Z' },
  { ...base, id: 'p24', shop_id: 's2', name: 'Набор тканевых масок, 10 шт', description: 'Увлажняющие тканевые маски с алоэ и гиалуроном.', price: 120000, old_price: 145000, category_slug: 'beauty', stock: 28, created_at: '2026-07-29T15:00:00Z' },

  // --- Бельё и домашняя одежда (Nozanin) ---
  { ...base, id: 'p25', shop_id: 's3', name: 'Ромпер шёлковый «Zaytun»', description: 'Домашний ромпер из искусственного шёлка с поясом, оливковый. Размеры S–XL.', price: 210000, old_price: null, category_slug: 'lingerie', stock: 14, created_at: '2026-07-27T10:00:00Z' },
  { ...base, id: 'p26', shop_id: 's3', name: 'Пижама льняная «Tinch»', description: 'Дышащий лён, свободный крой — для жарких ночей. Размеры S–XL.', price: 185000, old_price: 220000, category_slug: 'lingerie', stock: 12, created_at: '2026-07-24T12:00:00Z' },

  // --- Услуги салона (Malika Beauty) ---
  { ...base, id: 'p27', shop_id: 's4', name: 'Макияж вечерний', description: 'Полный вечерний образ: тон, глаза, губы. Работа визажиста, 60–90 мин.', price: 300000, old_price: null, category_slug: 'salons', stock: 100, created_at: '2026-07-25T10:00:00Z' },
  { ...base, id: 'p28', shop_id: 's4', name: 'Укладка + уход для волос', description: 'Мытьё, уходовая маска и укладка на любую длину, 45–60 мин.', price: 180000, old_price: null, category_slug: 'salons', stock: 100, created_at: '2026-07-22T12:00:00Z' },

  // --- Детские товары (Bebi Kids) ---
  { ...base, id: 'p29', shop_id: 's5', name: 'Конструктор деревянный, 60 дет.', description: 'Экологичные деревянные кубики, развивает моторику. От 1,5 лет.', price: 145000, old_price: null, category_slug: 'kids', stock: 22, created_at: '2026-07-26T12:00:00Z' },
  { ...base, id: 'p30', shop_id: 's5', name: 'Платье детское праздничное', description: 'Нарядное платье с фатиновой юбкой. Рост 92–128 см.', price: 130000, old_price: 160000, category_slug: 'kids', stock: 18, created_at: '2026-07-25T12:00:00Z' },
  { ...base, id: 'p31', shop_id: 's5', name: 'Плед детский плюшевый', description: 'Мягкий плюшевый плед 100×120 см. Не электризуется, можно в стиралку.', price: 155000, old_price: 185000, category_slug: 'kids', stock: 19, created_at: '2026-07-31T15:00:00Z' },
  { ...base, id: 'p32', shop_id: 's5', name: 'Игрушка мягкая «Зайка»', description: 'Плюшевый зайка 35 см, гипоаллергенный наполнитель.', price: 75000, old_price: null, category_slug: 'kids', stock: 30, created_at: '2026-07-23T12:00:00Z' },

  // --- Товары для дома (Uy Home Decor) ---
  { ...base, id: 'p33', shop_id: 's6', name: 'Ваза керамическая «Oq gul»', description: 'Ручная работа, матовая керамика, высота 25 см.', price: 95000, old_price: null, category_slug: 'home', stock: 15, created_at: '2026-07-24T14:00:00Z' },
  { ...base, id: 'p34', shop_id: 's6', name: 'Постельное бельё сатин, евро', description: 'Сатин премиум, 4 наволочки. Не линяет, не мнётся.', price: 340000, old_price: 420000, category_slug: 'home', stock: 13, created_at: '2026-07-30T10:00:00Z' },
  { ...base, id: 'p35', shop_id: 's6', name: 'Ковёр «Samarkand» 160×230', description: 'Ковёр с восточным орнаментом, короткий ворс, легко чистится.', price: 890000, old_price: null, category_slug: 'home', stock: 6, created_at: '2026-07-27T14:00:00Z' },
  { ...base, id: 'p36', shop_id: 's6', name: 'Набор посуды керамика, 12 предм.', description: 'Обеденный набор на 4 персоны: тарелки, салатники, кружки.', price: 480000, old_price: 560000, category_slug: 'home', stock: 9, created_at: '2026-07-25T14:00:00Z' },

  // --- Аптека (Salomat Pharm) ---
  { ...base, id: 'p37', shop_id: 's8', name: 'Омега-3 1000 мг, 60 капсул', description: 'Рыбий жир высокой очистки. Для сердца, кожи и волос.', price: 98000, old_price: null, category_slug: 'pharmacy', stock: 45, created_at: '2026-07-28T10:00:00Z' },
  { ...base, id: 'p38', shop_id: 's8', name: 'Витамины для волос и ногтей, 30 таб.', description: 'Биотин, цинк и селен. Курс на месяц — для крепких ногтей и блеска волос.', price: 89000, old_price: null, category_slug: 'pharmacy', stock: 33, created_at: '2026-07-26T14:00:00Z' },
  { ...base, id: 'p39', shop_id: 's8', name: 'Крем аптечный для чувствительной кожи', description: 'Дермокосметика без отдушек, восстанавливает барьер кожи. 50 мл.', price: 145000, old_price: null, category_slug: 'pharmacy', stock: 26, created_at: '2026-07-24T16:00:00Z' },
  { ...base, id: 'p40', shop_id: 's8', name: 'Витамин D3 2000 МЕ, 90 капсул', description: 'Поддержка иммунитета и настроения. Принимать по 1 капсуле в день.', price: 65000, old_price: null, category_slug: 'pharmacy', stock: 50, created_at: '2026-07-28T14:00:00Z' },

  // --- Продукты (Yashil Bozor) ---
  { ...base, id: 'p41', shop_id: 's9', name: 'Мёд горный, 0,5 кг', description: 'Натуральный горный мёд урожая этого года. Без сахара и добавок.', price: 85000, old_price: null, category_slug: 'grocery', stock: 25, created_at: '2026-07-30T14:00:00Z' },
  { ...base, id: 'p42', shop_id: 's9', name: 'Помидоры розовые, 1 кг', description: 'Сезонные розовые помидоры с ферм Ташкентской области. Сладкие, мясистые.', price: 24000, old_price: null, category_slug: 'grocery', stock: 70, created_at: '2026-07-28T16:00:00Z' },
  { ...base, id: 'p43', shop_id: 's9', name: 'Чай зелёный №95, 200 г', description: 'Классический узбекский зелёный чай, крупный лист.', price: 35000, old_price: null, category_slug: 'grocery', stock: 60, created_at: '2026-07-26T16:00:00Z' },
  { ...base, id: 'p44', shop_id: 's9', name: 'Гранаты сезонные, 1 кг', description: 'Сладкие гранаты из Кувы. Отборные плоды, сок — рубин.', price: 28000, old_price: null, category_slug: 'grocery', stock: 80, created_at: '2026-07-29T08:00:00Z' },
].map(withShop)

const demoReviewsRaw: Review[] = [
  { id: 'r1', product_id: 'p1', user_id: null, rating: 5, text: 'Платье шикарное, ткань приятная, села идеально!', created_at: '2026-06-27T12:00:00Z', author: { id: 'u1', name: 'Дилноза', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-06-27T12:00:00Z' } },
  { id: 'r2', product_id: 'p1', user_id: null, rating: 4, text: 'Красивое, но доставка немного задержалась.', created_at: '2026-06-26T12:00:00Z', author: { id: 'u2', name: 'Малика', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-06-26T12:00:00Z' } },
  { id: 'r3', product_id: 'p4', user_id: null, rating: 5, text: 'Кожа стала заметно ровнее за 2 недели. Рекомендую!', created_at: '2026-06-25T12:00:00Z', author: { id: 'u3', name: 'Севара', phone: null, role: 'buyer', avatar_url: null, city: 'Самарканд', created_at: '2026-06-25T12:00:00Z' } },
  { id: 'r4', product_id: 'k1', user_id: null, rating: 5, text: 'Оригинал 100%, коробка с защитной наклейкой и QR. Кожа увлажнённая с первого применения.', created_at: '2026-07-15T12:00:00Z', author: { id: 'u4', name: 'Нигора', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-07-15T12:00:00Z' } },
  { id: 'r5', product_id: 'k2', user_id: null, rating: 5, text: 'Лучший санскрин! И тут реально дешевле, чем в оффлайн-магазинах. Доставили бесплатно за день.', created_at: '2026-07-14T12:00:00Z', author: { id: 'u5', name: 'Камила', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-07-14T12:00:00Z' } },
  { id: 'r6', product_id: 'p23', user_id: null, rating: 5, text: 'Аромат восхитительный, держится с утра до вечера. Муж оценил 😄', created_at: '2026-08-01T15:00:00Z', author: { id: 'u6', name: 'Зарина', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-08-01T15:00:00Z' } },
  { id: 'r7', product_id: 'p18', user_id: null, rating: 5, text: 'Удобные, лёгкие, размер в размер. Ношу вторую неделю — белые до сих пор 😅', created_at: '2026-07-31T18:00:00Z', author: { id: 'u5', name: 'Камила', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-07-31T18:00:00Z' } },
  { id: 'r8', product_id: 'p41', user_id: null, rating: 5, text: 'Мёд настоящий, густой, ароматный. Как у бабушки в кишлаке!', created_at: '2026-07-31T09:00:00Z', author: { id: 'u7', name: 'Гульнора', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-07-31T09:00:00Z' } },
  { id: 'r9', product_id: 'p31', user_id: null, rating: 5, text: 'Плед нежнейший, малышка спит только под ним. После стирки как новый.', created_at: '2026-08-01T11:00:00Z', author: { id: 'u4', name: 'Дилноза', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-08-01T11:00:00Z' } },
  { id: 'r10', product_id: 'p37', user_id: null, rating: 5, text: 'Капсулы без рыбного привкуса, пью месяц — ногти заметно крепче.', created_at: '2026-07-30T20:00:00Z', author: { id: 'u8', name: 'Феруза', phone: null, role: 'buyer', avatar_url: null, city: 'Ташкент', created_at: '2026-07-30T20:00:00Z' } },
]

export const demoReviews: Review[] = demoReviewsRaw.map((r) => ({
  ...r,
  author: r.author ? { ...r.author, avatar_url: DEMO_AVATARS[r.author.name ?? ''] ?? null } : r.author,
}))

/**
 * Демо-посты встроенного сообщества (тип соц-медиа «Потребитель UZ»):
 * девушки делятся опытом, задают вопросы, оставляют отзывы — со ссылкой на товар.
 */
export const demoPosts: CommunityPost[] = [
  {
    id: 'cp1', author_name: 'Нигора', author_city: 'Ташкент', author_avatar: DEMO_AVATARS['Нигора'], kind: 'review',
    text: 'Девочки, наконец нашла где брать оригинал COSRX по нормальной цене 🙌 Эссенция с муцином — кожа реально стала более увлажнённой за неделю. Брала на SEVIMLI, пришло с защитной наклейкой.',
    images: ['/img/community/post1.jpg'], tags: ['уход', 'корея', 'отзыв'], product_id: 'k1', likes: 42,
    created_at: '2026-07-15T09:30:00Z',
    comments: [
      { id: 'cc1', post_id: 'cp1', author_name: 'Малика', text: 'А как отличить оригинал от подделки?', created_at: '2026-07-15T10:00:00Z' },
      { id: 'cc2', post_id: 'cp1', author_name: 'Нигора', text: 'На официальном есть QR-код и наклейка, тут всё было 👍', created_at: '2026-07-15T10:20:00Z' },
    ],
  },
  {
    id: 'cp2', author_name: 'Камила', author_city: 'Ташкент', author_avatar: DEMO_AVATARS['Камила'], kind: 'question',
    text: 'Подскажите санскрин для жирной кожи, чтобы не оставлял белых следов? Хочу что-то корейское 🌸',
    images: [], tags: ['вопрос', 'уход', 'spf'], product_id: null, likes: 15,
    created_at: '2026-07-14T14:00:00Z',
    comments: [
      { id: 'cc3', post_id: 'cp2', author_name: 'Севара', text: 'Beauty of Joseon Relief Sun — идеально! Тут как раз есть.', created_at: '2026-07-14T14:30:00Z' },
      { id: 'cc4', post_id: 'cp2', author_name: 'Дилноза', text: 'Плюсую, взяла по совету, довольна ✨', created_at: '2026-07-14T15:10:00Z' },
    ],
  },
  {
    id: 'cp3', author_name: 'Севара', author_city: 'Самарканд', author_avatar: DEMO_AVATARS['Севара'], kind: 'tip',
    text: 'Лайфхак по уходу: тонер Anua Heartleaf наносите похлопывающими движениями, а не тереть ватным диском — так меньше раздражения. Мой холи-грейл для чувствительной кожи 💚',
    images: ['/img/community/post3.jpg'], tags: ['совет', 'уход', 'корея'], product_id: 'k3', likes: 28,
    created_at: '2026-07-13T11:00:00Z',
    comments: [],
  },
  {
    id: 'cp4', author_name: 'Дилноза', author_city: 'Ташкент', author_avatar: DEMO_AVATARS['Дилноза'], kind: 'review',
    text: 'Платье Aurora с SEVIMLI — качество супер за эти деньги. Ношу уже вторую неделю, ткань не мнётся. Рекомендую для лета! 👗',
    images: ['/img/community/post4.jpg'], tags: ['отзыв', 'одежда'], product_id: 'p1', likes: 19,
    created_at: '2026-07-12T16:00:00Z',
    comments: [
      { id: 'cc5', post_id: 'cp4', author_name: 'Камила', text: 'Какой размер брали? Как в размер?', created_at: '2026-07-12T16:40:00Z' },
      { id: 'cc6', post_id: 'cp4', author_name: 'Дилноза', text: 'Брала M, село как влитое. Размерная сетка честная 👍', created_at: '2026-07-12T17:05:00Z' },
    ],
  },
  {
    id: 'cp5', author_name: 'Зарина', author_city: 'Ташкент', author_avatar: DEMO_AVATARS['Зарина'], kind: 'question',
    text: 'Кто пробовал numbuzin No.3? Реально помогает с тоном лица или маркетинг? Хочу отзывы реальных людей, а не блогеров 🙏',
    images: [], tags: ['вопрос', 'корея', 'сыворотка'], product_id: 'k7', likes: 11,
    created_at: '2026-07-11T18:00:00Z',
    comments: [
      { id: 'cc7', post_id: 'cp5', author_name: 'Нигора', text: 'Пользуюсь месяц — тон реально ровнее, но эффект накопительный, ждите 3–4 недели.', created_at: '2026-07-11T19:20:00Z' },
    ],
  },
  {
    id: 'cp6', author_name: 'Феруза', author_city: 'Ташкент', author_avatar: DEMO_AVATARS['Феруза'], kind: 'review',
    text: 'Санскрин Beauty of Joseon — 10/10. Никаких белых следов, под макияж идеально. Заказала в обед — привезли к вечеру, бесплатно 🚚 Цена ниже, чем я брала раньше у девочки в инсте.',
    images: ['/img/community/post2.jpg'], tags: ['отзыв', 'spf', 'корея'], product_id: 'k2', likes: 33,
    created_at: '2026-07-16T10:00:00Z',
    comments: [
      { id: 'cc8', post_id: 'cp6', author_name: 'Камила', text: 'Всё, беру! Спасибо за отзыв 💛', created_at: '2026-07-16T10:40:00Z' },
    ],
  },
  {
    id: 'cp7', author_name: 'Зарина', author_city: 'Ташкент', author_avatar: DEMO_AVATARS['Зарина'], kind: 'review',
    text: 'Сходила в Malika Beauty по записи через SEVIMLI — маникюр огонь, мастер аккуратная, запись без звонков и ожидания. Покрытие держится уже 2 недели 💅',
    images: ['/img/community/post6.jpg'], tags: ['салон', 'маникюр', 'отзыв'], product_id: 'p14', likes: 26,
    created_at: '2026-07-17T15:30:00Z',
    comments: [
      { id: 'cc9', post_id: 'cp7', author_name: 'Севара', text: 'А к какому мастеру записывались?', created_at: '2026-07-17T16:00:00Z' },
      { id: 'cc10', post_id: 'cp7', author_name: 'Зарина', text: 'К Наргизе, но говорят у них все хорошие 😊', created_at: '2026-07-17T16:25:00Z' },
    ],
  },
  {
    id: 'cp8', author_name: 'Малика', author_city: 'Бухара', author_avatar: DEMO_AVATARS['Малика'], kind: 'tip',
    text: 'Совет для уюта дома: вязаный плед + пара ароматических свечей — и осенние вечера совсем другие ✨ Плед Cozy с SEVIMLI мягче, чем ожидала, не колется вообще.',
    images: ['/img/community/post7.jpg'], tags: ['дом', 'уют', 'совет'], product_id: 'p11', likes: 17,
    created_at: '2026-07-18T20:00:00Z',
    comments: [],
  },
  {
    id: 'cp9', author_name: 'Гульнора', author_city: 'Ташкент', author_avatar: DEMO_AVATARS['Гульнора'], kind: 'question',
    text: 'Девочки, что подарить малышке на годик? Думаю про развивающий коврик — у кого есть, стоит брать? Или лучше что-то другое? 🎁',
    images: ['/img/community/post8.jpg'], tags: ['дети', 'вопрос', 'подарок'], product_id: 'p10', likes: 9,
    created_at: '2026-07-19T12:00:00Z',
    comments: [
      { id: 'cc11', post_id: 'cp9', author_name: 'Дилноза', text: 'Коврик — топ, у нас такой. Дуги снимаются, хватает надолго.', created_at: '2026-07-19T12:45:00Z' },
    ],
  },
  {
    id: 'cp11', author_name: 'Малика', author_city: 'Бухара', author_avatar: DEMO_AVATARS['Малика'], kind: 'review',
    text: 'Девочки, парфюм Oud Rose — это что-то 😍 Восточный, но не тяжёлый, шлейф нежный. Заказала вечером — привезли утром. По такой цене в ТЦ даже смотреть нечего.',
    images: ['/img/products/p23.jpg'], tags: ['отзыв', 'парфюм', 'красота'], product_id: 'p23', likes: 24,
    created_at: '2026-08-01T18:00:00Z',
    comments: [
      { id: 'cc13', post_id: 'cp11', author_name: 'Зарина', text: 'Подтверждаю, у меня такой же — стойкость супер 👌', created_at: '2026-08-01T19:00:00Z' },
    ],
  },
  {
    id: 'cp12', author_name: 'Гульнора', author_city: 'Ташкент', author_avatar: DEMO_AVATARS['Гульнора'], kind: 'tip',
    text: 'Осенний лайфхак: ложка горного мёда + зелёный чай №95 по утрам — и никакие простуды не страшны. Мёд беру в Yashil Bozor через SEVIMLI, привозят в тот же день 🍯',
    images: ['/img/products/p41.jpg'], tags: ['совет', 'здоровье', 'продукты'], product_id: 'p41', likes: 16,
    created_at: '2026-07-31T08:30:00Z',
    comments: [],
  },
  {
    id: 'cp10', author_name: 'Севара', author_city: 'Самарканд', author_avatar: DEMO_AVATARS['Севара'], kind: 'tip',
    text: 'Как отличить оригинал K-beauty: 1) защитная наклейка на коробке 2) QR-код ведёт на сайт бренда 3) батч-код совпадает на коробке и флаконе 4) цена не «в 3 раза дешевле рынка». На SEVIMLI всё это проверяют до продажи — но проверять самой тоже полезно 😉',
    images: [], tags: ['совет', 'корея', 'оригинал'], product_id: null, likes: 54,
    created_at: '2026-07-20T09:00:00Z',
    comments: [
      { id: 'cc12', post_id: 'cp10', author_name: 'Феруза', text: 'Сохранила! Очень полезно 🙏', created_at: '2026-07-20T09:30:00Z' },
    ],
  },
]

/** Магазин демо-продавца (кабинет продавца в демо-режиме). */
export const DEMO_SELLER_SHOP_ID = 's7'

/** Демо-заказы. buyer_id='demo-user' — заказы демо-покупателя; shop_id='s7' — входящие для демо-продавца. */
export const demoOrders: Order[] = [
  { id: 'o1000001-aaaa-4aaa-8aaa-000000000001', buyer_id: 'demo-user', shop_id: 's7', status: 'done', total_price: 238000, address: 'Ташкент, Мирзо-Улугбек, ул. Амира Темура 15', comment: null, created_at: '2026-07-10T10:00:00Z' },
  { id: 'o1000002-aaaa-4aaa-8aaa-000000000002', buyer_id: 'demo-user', shop_id: 's7', status: 'delivering', total_price: 149000, address: 'Ташкент, Юнусабад, 4-квартал', comment: 'Позвонить за час', created_at: '2026-07-14T12:30:00Z' },
  { id: 'o1000003-aaaa-4aaa-8aaa-000000000003', buyer_id: 'demo-user', shop_id: 's1', status: 'pending', total_price: 349000, address: 'Ташкент, Чиланзар, 9-квартал', comment: null, created_at: '2026-07-15T18:05:00Z' },
  { id: 'o1000004-aaaa-4aaa-8aaa-000000000004', buyer_id: 'u9', shop_id: 's7', status: 'confirmed', total_price: 179000, address: 'Ташкент, Сергели', comment: null, created_at: '2026-07-15T09:15:00Z' },
  { id: 'o1000005-aaaa-4aaa-8aaa-000000000005', buyer_id: 'u8', shop_id: 's7', status: 'done', total_price: 99000, address: 'Ташкент, Шайхантахур', comment: null, created_at: '2026-07-12T14:40:00Z' },
  { id: 'o1000006-aaaa-4aaa-8aaa-000000000006', buyer_id: 'u7', shop_id: 's7', status: 'pending', total_price: 284000, address: 'Ташкент, Мирабад', comment: 'Подарочная упаковка', created_at: '2026-07-16T08:20:00Z' },
]

/** Демо-записи в салоны. */
export const demoBookings: Booking[] = [
  { id: 'b0000001-aaaa-4aaa-8aaa-000000000001', shop_id: 's4', user_id: 'demo-user', service_name: 'Маникюр + гель-лак', booking_date: '2026-07-20', time_slot: '15:00', status: 'подтверждена', phone: '+998 90 123 45 67', created_at: '2026-07-14T10:00:00Z', shop: demoShops.find((s) => s.id === 's4') ?? null },
  { id: 'b0000002-aaaa-4aaa-8aaa-000000000002', shop_id: 's4', user_id: 'demo-user', service_name: 'Массаж расслабляющий, 60 мин', booking_date: '2026-07-25', time_slot: '11:00', status: 'ожидает', phone: '+998 90 123 45 67', created_at: '2026-07-15T16:00:00Z', shop: demoShops.find((s) => s.id === 's4') ?? null },
]

/** Демо-вопросы о товаре (Q&A на карточке). */
export const demoQuestions: ProductQuestion[] = [
  {
    id: 'q1', product_id: 'k1', author_name: 'Малика',
    text: 'Это точно оригинал? Не подделка из Китая?', created_at: '2026-07-14T10:00:00Z',
    answers: [
      { id: 'qa1', question_id: 'q1', author_name: 'Seoul Beauty', is_seller: true, text: 'Да, 100% оригинал — прямой официальный импорт. На каждой упаковке защитная наклейка и QR-код производителя. Даём гарантию подлинности.', created_at: '2026-07-14T11:00:00Z' },
    ],
  },
  {
    id: 'q2', product_id: 'k1', author_name: 'Гульнора',
    text: 'Подойдёт для сухой кожи зимой?', created_at: '2026-07-13T12:00:00Z',
    answers: [
      { id: 'qa2', question_id: 'q2', author_name: 'Нигора', is_seller: false, text: 'У меня сухая, зимой наношу под крем — спасает 🙌', created_at: '2026-07-13T13:00:00Z' },
    ],
  },
  {
    id: 'q3', product_id: 'k2', author_name: 'Феруза',
    text: 'Доставка правда бесплатная? И как быстро?', created_at: '2026-07-12T09:00:00Z',
    answers: [
      { id: 'qa3', question_id: 'q3', author_name: 'Seoul Beauty', is_seller: true, text: 'Да, доставка по Ташкенту бесплатная, обычно в течение 1 дня.', created_at: '2026-07-12T09:30:00Z' },
    ],
  },
]
