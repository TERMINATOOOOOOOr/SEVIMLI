import type { Order, Product } from '@/lib/types'

/**
 * Демо-движок «умных» фич: история цен, сравнение с рынком, проверка
 * подлинности, аналитика продавца. Всё детерминировано (seed от id),
 * чтобы данные не «прыгали» между рендерами и выглядели правдоподобно.
 * При подключении реальной базы заменяется таблицами price_history,
 * market_offers, authenticity_codes и событийной аналитикой.
 */

// ---------- Seeded PRNG (mulberry32) ----------

function hashSeed(s: string): number {
  let h = 1779033703
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round1000 = (n: number) => Math.round(n / 1000) * 1000

// ---------- 1. История цен ----------

export interface PricePoint {
  /** ISO-дата (день). */
  date: string
  price: number
}

/**
 * История цены за 90 дней: ступенчатая (как в прайс-трекерах) — сегменты
 * постоянной цены, к концу сходится к текущей. Стартует от рыночной/старой.
 */
export function getPriceHistory(product: Product, days = 90): PricePoint[] {
  const rnd = mulberry32(hashSeed(`price-${product.id}`))
  const start = product.market_price ?? product.old_price ?? Math.round(product.price * 1.2)
  const end = product.price

  // 4–6 сегментов постоянной цены
  const segCount = 4 + Math.floor(rnd() * 3)
  const bounds: number[] = [0]
  for (let i = 1; i < segCount; i++) bounds.push(Math.floor((days / segCount) * i + rnd() * 8 - 4))
  bounds.push(days)

  const prices: number[] = []
  for (let i = 0; i < segCount; i++) {
    const t = i / (segCount - 1)
    // плавное снижение + шум; последний сегмент — ровно текущая цена
    const base = start + (end - start) * t
    const noise = i === segCount - 1 ? 0 : base * (rnd() * 0.06 - 0.02)
    prices.push(i === segCount - 1 ? end : round1000(Math.max(end, base + noise)))
  }

  const today = new Date()
  const points: PricePoint[] = []
  for (let d = 0; d < days; d++) {
    const seg = bounds.findIndex((b, i) => d >= b && d < (bounds[i + 1] ?? days + 1))
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - d))
    points.push({
      date: date.toISOString().slice(0, 10),
      price: prices[Math.min(Math.max(seg, 0), segCount - 1)],
    })
  }
  return points
}

// ---------- 2. Сравнение цены с рынком (с источниками) ----------

export interface MarketOffer {
  /** Название источника. */
  source: { ru: string; uz: string }
  /** Пояснение, как получена цифра. */
  note: { ru: string; uz: string }
  price: number
  /** Дата последней проверки цены (ISO). */
  checked: string
  /** Это наша цена. */
  isSevimli?: boolean
}

/** Сравнение с рынком — только для товаров с market_price (K-beauty). */
export function getMarketComparison(product: Product): MarketOffer[] | null {
  if (!product.market_price) return null
  const rnd = mulberry32(hashSeed(`market-${product.id}`))
  const daysAgo = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().slice(0, 10)
  }
  const mp = product.market_price
  return [
    {
      source: { ru: 'SEVIMLI · Seoul Beauty', uz: 'SEVIMLI · Seoul Beauty' },
      note: {
        ru: 'официальный импорт, гарантия подлинности',
        uz: 'rasmiy import, asllik kafolati',
      },
      price: product.price,
      checked: daysAgo(0),
      isSevimli: true,
    },
    {
      source: {
        ru: 'Офлайн-ритейл Ташкента',
        uz: 'Toshkent oflayn-riteyli',
      },
      note: {
        ru: 'среднее по 3 сетям косметики, ТЦ',
        uz: "3 kosmetika tarmog'i bo'yicha o'rtacha",
      },
      price: round1000(mp * (1 + rnd() * 0.04)),
      checked: daysAgo(2 + Math.floor(rnd() * 3)),
    },
    {
      source: { ru: 'Онлайн-маркетплейсы UZ', uz: 'UZ onlayn-marketpleyslar' },
      note: {
        ru: 'медианная цена листингов, без проверки подлинности',
        uz: 'listinglar mediana narxi, asllik tekshiruvisiz',
      },
      price: round1000(mp * (0.9 + rnd() * 0.06)),
      checked: daysAgo(1 + Math.floor(rnd() * 3)),
    },
    {
      source: { ru: 'Instagram-продавцы', uz: 'Instagram-sotuvchilar' },
      note: {
        ru: 'среднее по 5 популярным аккаунтам, происхождение неизвестно',
        uz: "5 mashhur akkaunt bo'yicha o'rtacha, kelib chiqishi noma'lum",
      },
      price: round1000(mp * (0.82 + rnd() * 0.08)),
      checked: daysAgo(3 + Math.floor(rnd() * 4)),
    },
  ]
}

// ---------- 3. Проверка подлинности ----------

export interface VerifyRecord {
  code: string
  productId: string
  batch: string
  /** Демо-данные официального ввоза. */
  importInfo: {
    supplier: string
    declaration: string
    importedAt: string
    expiresAt: string
  }
}

/** Демо-реестр кодов защитных наклеек (в проде — таблица + генерация кодов). */
export const VERIFY_CODES: VerifyRecord[] = [
  'k1:7F3A:B240611',
  'k2:9D21:B240705',
  'k3:4C8E:B240528',
  'k4:1A6F:B240619',
  'k5:8E2B:B240701',
  'k6:5D9C:B240514',
  'k7:3B7D:B240622',
  'k8:6F4A:B240630',
].map((row) => {
  const [pid, tail, batch] = row.split(':')
  return {
    code: `SVM-${pid.toUpperCase()}-${tail}`,
    productId: pid,
    batch,
    importInfo: {
      supplier: 'Демо-поставщик (пример записи реестра)',
      declaration: 'Пример — в боевом реестре здесь номер документа поставщика',
      importedAt: '2026-06-28',
      expiresAt: '2028-06-01',
    },
  }
})

export type VerifyResult =
  | { status: 'ok'; record: VerifyRecord }
  | { status: 'not_found' }
  | { status: 'bad_format' }

export function verifyCode(input: string): VerifyResult {
  const code = input.trim().toUpperCase().replace(/\s+/g, '')
  if (!/^SVM-[A-Z0-9]{2,4}-[A-Z0-9]{4}$/.test(code)) return { status: 'bad_format' }
  const record = VERIFY_CODES.find((r) => r.code === code)
  return record ? { status: 'ok', record } : { status: 'not_found' }
}

// ---------- 4. Аналитика продавца ----------

/** Боевая аналитика: считается только по фактическим заказам магазина. */
function realAnalytics(orders: Order[], today: Date): SellerAnalytics {
  const days: DayMetric[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toDateString()
    const dayOrders = orders.filter(
      (o) => o.status !== 'cancelled' && new Date(o.created_at).toDateString() === key,
    )
    days.push({
      date: d.toISOString().slice(0, 10),
      revenue: dayOrders.reduce((s, o) => s + (o.total_price ?? 0), 0),
      orders: dayOrders.length,
      views: 0,
    })
  }
  const revenue = days.reduce((s, d) => s + d.revenue, 0)
  const ordersCount = days.reduce((s, d) => s + d.orders, 0)
  const buyers = new Map<string, number>()
  for (const o of orders) if (o.buyer_id) buyers.set(o.buyer_id, (buyers.get(o.buyer_id) ?? 0) + 1)
  const repeat = [...buyers.values()].filter((n) => n > 1).length
  const done = orders.filter((o) => o.status === 'done').length
  return {
    days,
    totals: {
      revenue,
      orders: ordersCount,
      views: 0,
      conversion: 0,
      avgCheck: ordersCount ? Math.round(revenue / ordersCount) : 0,
      repeatShare: buyers.size ? repeat / buyers.size : 0,
    },
    funnel: [
      { stage: { ru: 'Оформили заказ', uz: 'Buyurtma berdi' }, value: orders.length },
      { stage: { ru: 'Выкупили', uz: 'Sotib oldi' }, value: done },
    ],
    topProducts: [],
    citySplit: [],
  }
}

export interface DayMetric {
  date: string
  revenue: number
  orders: number
  views: number
}

export interface SellerAnalytics {
  days: DayMetric[]
  totals: {
    revenue: number
    orders: number
    views: number
    conversion: number
    avgCheck: number
    repeatShare: number
  }
  funnel: { stage: { ru: string; uz: string }; value: number }[]
  topProducts: { product: Product; sold: number; revenue: number }[]
  citySplit: { city: string; share: number }[]
}

/**
 * Демо-аналитика магазина за 30 дней: детерминированные «просмотры» +
 * реальные демо-заказы, воронка, топ товаров, география.
 */
export function getSellerAnalytics(
  shopId: string,
  orders: Order[],
  products: Product[],
  opts: { synthetic?: boolean } = {},
): SellerAnalytics {
  // synthetic=false — боевой режим: только реальные заказы, никаких смоделированных
  // просмотров и «фоновых» продаж (иначе продавец видит выдуманные цифры).
  const synthetic = opts.synthetic ?? true
  const rnd = mulberry32(hashSeed(`analytics-${shopId}`))
  const today = new Date()

  if (!synthetic) return realAnalytics(orders, today)

  const days: DayMetric[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toDateString()
    const dayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === key)
    const weekend = d.getDay() === 0 || d.getDay() === 6
    // Просмотры: база + рост к концу месяца + всплески в выходные
    const views = Math.round((140 + (29 - i) * 4 + (weekend ? 60 : 0)) * (0.8 + rnd() * 0.5))
    // Выручка: реальные демо-заказы + детерминированный «фон» продаж
    const bgOrders = Math.floor(rnd() * 3) + (weekend ? 1 : 0)
    const bgRevenue = round1000(bgOrders * (90000 + rnd() * 120000))
    days.push({
      date: d.toISOString().slice(0, 10),
      revenue: dayOrders.reduce((s, o) => s + (o.total_price ?? 0), 0) + bgRevenue,
      orders: dayOrders.length + bgOrders,
      views,
    })
  }

  const revenue = days.reduce((s, d) => s + d.revenue, 0)
  const ordersCount = days.reduce((s, d) => s + d.orders, 0)
  const views = days.reduce((s, d) => s + d.views, 0)
  const carts = Math.round(views * 0.11)

  const totals = {
    revenue,
    orders: ordersCount,
    views,
    conversion: ordersCount / views,
    avgCheck: ordersCount ? Math.round(revenue / ordersCount) : 0,
    repeatShare: 0.34,
  }

  const funnel = [
    { stage: { ru: 'Просмотры товаров', uz: "Mahsulot ko'rishlari" }, value: views },
    { stage: { ru: 'Добавили в корзину', uz: "Savatga qo'shdi" }, value: carts },
    { stage: { ru: 'Оформили заказ', uz: 'Buyurtma berdi' }, value: ordersCount },
    { stage: { ru: 'Выкупили', uz: 'Sotib oldi' }, value: Math.round(ordersCount * 0.86) },
  ]

  const topProducts = products
    .map((p) => {
      const sold = Math.floor(mulberry32(hashSeed(`sold-${shopId}-${p.id}`))() * 40) + 3
      return { product: p, sold, revenue: sold * p.price }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const citySplit = [
    { city: 'Ташкент', share: 0.71 },
    { city: 'Самарканд', share: 0.11 },
    { city: 'Бухара', share: 0.07 },
    { city: 'Наманган', share: 0.05 },
    { city: 'Другие', share: 0.06 },
  ]

  return { days, totals, funnel, topProducts, citySplit }
}
