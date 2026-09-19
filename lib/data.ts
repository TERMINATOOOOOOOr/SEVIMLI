import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/utils'
import {
  POST_WITH_ALL,
  QUESTION_WITH_ANSWERS,
  isUuid,
  normalizePost,
  normalizeQuestion,
} from '@/lib/community-select'
import {
  demoCategories,
  demoShops,
  demoProducts,
  demoReviews,
  demoPosts,
  demoQuestions,
  demoOrders,
  demoBookings,
} from '@/lib/demo'
import type {
  Category,
  Shop,
  Product,
  Review,
  CommunityPost,
  ProductQuestion,
  Viewer,
  Order,
  Booking,
  Circle,
  CirclePreview,
  CircleState,
  LoyaltyEntry,
} from '@/lib/types'
import { CIRCLE_WITH_ALL, normalizeCircle } from '@/lib/davra-select'

/**
 * Слой доступа к данным для серверных компонентов.
 * Демо-данные используются ТОЛЬКО пока Supabase не настроен (заглушки в .env).
 * В боевом режиме ошибка запроса или пустая таблица дают пустой результат —
 * страница рендерится, но ничего не выдумывает и не подменяет реальные данные демо.
 */

const PRODUCT_WITH_SHOP = '*, shop:shops(*)'
const ORDER_WITH_ITEMS = '*, items:order_items(*, product:products(*))'
const REVIEW_WITH_AUTHOR = '*, author:public_profiles(*)'

export type ProductSort = 'newest' | 'price_asc' | 'price_desc'

export interface CatalogFilters {
  minPrice?: number
  maxPrice?: number
  city?: string
  sort?: ProductSort
  page?: number
  pageSize?: number
}

// ---------- Категории ----------

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return demoCategories
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('categories').select('*').order('sort_order')
    // Категории сидятся миграцией; если их нет — показываем справочник, он не «данные»
    if (error || !data?.length) return demoCategories
    return data as Category[]
  } catch {
    return demoCategories
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories()
  return categories.find((c) => c.slug === slug) ?? null
}

// ---------- Магазины ----------

export async function getFeaturedShops(limit = 6): Promise<Shop[]> {
  if (!isSupabaseConfigured()) {
    return [...demoShops].sort((a, b) => b.rating - a.rating).slice(0, limit)
  }
  try {
    const supabase = await createClient()
    // Сначала оплаченные featured-места, затем по рейтингу
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('rating', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data as Shop[]) ?? []
  } catch {
    return []
  }
}

export async function getShopById(id: string): Promise<Shop | null> {
  if (!isSupabaseConfigured()) return demoShops.find((s) => s.id === id) ?? null
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('shops').select('*').eq('id', id).maybeSingle()
    return (data as Shop) ?? null
  } catch {
    return null
  }
}

// ---------- Товары ----------

export async function getNewProducts(limit = 8): Promise<Product[]> {
  if (!isSupabaseConfigured()) return demoProducts.slice(0, limit)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_WITH_SHOP)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data as Product[]) ?? []
  } catch {
    return []
  }
}

/** Корейская косметика с подтверждённым оригиналом — для главной и страницы /korean. */
export async function getOriginalProducts(limit = 8): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return demoProducts.filter((p) => p.is_original).slice(0, limit)
  }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_WITH_SHOP)
      .eq('is_original', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data as Product[]) ?? []
  } catch {
    return []
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return demoProducts.find((p) => p.id === id) ?? null
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('products').select(PRODUCT_WITH_SHOP).eq('id', id).maybeSingle()
    return (data as Product) ?? null
  } catch {
    return null
  }
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getProductsByCategoryRaw(product.category_slug)
  return all.filter((p) => p.id !== product.id).slice(0, limit)
}

/** Товары магазина. Для публичной витрины — только активные; продавец в кабинете видит все свои. */
export async function getProductsByShop(shopId: string, includeInactive = false): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return demoProducts.filter((p) => p.shop_id === shopId && (includeInactive || p.is_active))
  }
  try {
    const supabase = await createClient()
    let query = supabase
      .from('products')
      .select(PRODUCT_WITH_SHOP)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
    if (!includeInactive) query = query.eq('is_active', true)
    const { data } = await query
    return (data as Product[]) ?? []
  } catch {
    return []
  }
}

async function getProductsByCategoryRaw(slug: string | null): Promise<Product[]> {
  if (!slug) return []
  if (!isSupabaseConfigured()) return demoProducts.filter((p) => p.category_slug === slug)
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_WITH_SHOP)
      .eq('category_slug', slug)
      .eq('is_active', true)
    return (data as Product[]) ?? []
  } catch {
    return []
  }
}

/** Товары категории с фильтрами, сортировкой и пагинацией. */
export async function getCatalogProducts(
  slug: string,
  filters: CatalogFilters = {},
): Promise<{ items: Product[]; total: number }> {
  const { minPrice, maxPrice, city, sort = 'newest', page = 1, pageSize = 12 } = filters
  const safePage = Math.max(1, Math.floor(page) || 1)

  const paginate = (items: Product[]) => {
    const total = items.length
    const start = (safePage - 1) * pageSize
    return { items: items.slice(start, start + pageSize), total }
  }

  // Демо-режим — фильтруем в памяти.
  if (!isSupabaseConfigured()) {
    let items = await getProductsByCategoryRaw(slug)
    if (minPrice != null) items = items.filter((p) => p.price >= minPrice)
    if (maxPrice != null) items = items.filter((p) => p.price <= maxPrice)
    if (city) items = items.filter((p) => p.shop?.city === city)
    return paginate(sortProducts(items, sort))
  }

  try {
    const supabase = await createClient()
    let query = supabase
      .from('products')
      .select(PRODUCT_WITH_SHOP, { count: 'exact' })
      .eq('category_slug', slug)
      .eq('is_active', true)

    if (minPrice != null) query = query.gte('price', minPrice)
    if (maxPrice != null) query = query.lte('price', maxPrice)

    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    // Фильтр по городу идёт по связанному магазину — считать и резать страницу
    // нужно ПОСЛЕ него, иначе total и страницы расходятся.
    if (city) {
      const { data, error } = await query
      if (error) return { items: [], total: 0 }
      const items = ((data as Product[]) ?? []).filter((p) => p.shop?.city === city)
      return paginate(items)
    }

    const from = (safePage - 1) * pageSize
    query = query.range(from, from + pageSize - 1)
    const { data, count, error } = await query
    if (error) return { items: [], total: 0 }
    return { items: (data as Product[]) ?? [], total: count ?? 0 }
  } catch {
    return { items: [], total: 0 }
  }
}

function sortProducts(items: Product[], sort: ProductSort): Product[] {
  const copy = [...items]
  if (sort === 'price_asc') return copy.sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') return copy.sort((a, b) => b.price - a.price)
  return copy.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

// ---------- Отзывы ----------

export async function getReviewsForProduct(productId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) return demoReviews.filter((r) => r.product_id === productId)
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('reviews')
      .select(REVIEW_WITH_AUTHOR)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    return (data as Review[]) ?? []
  } catch {
    return []
  }
}

/** Отзывы на все товары магазина. */
export async function getShopReviews(shopId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) {
    const productIds = demoProducts.filter((p) => p.shop_id === shopId).map((p) => p.id)
    return demoReviews.filter((r) => r.product_id && productIds.includes(r.product_id))
  }
  try {
    const supabase = await createClient()
    const { data: products } = await supabase.from('products').select('id').eq('shop_id', shopId)
    const ids = (products ?? []).map((p: { id: string }) => p.id)
    if (ids.length === 0) return []
    const { data } = await supabase
      .from('reviews')
      .select(REVIEW_WITH_AUTHOR)
      .in('product_id', ids)
      .order('created_at', { ascending: false })
    return (data as Review[]) ?? []
  } catch {
    return []
  }
}

// ---------- Заказы и записи магазина (кабинет продавца) ----------

/** Входящие заказы магазина — с позициями и контактами покупательницы. */
export async function getOrdersByShop(shopId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return demoOrders.filter((o) => o.shop_id === shopId)
  }
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
    return (data as Order[]) ?? []
  } catch {
    return []
  }
}

/** Заказы покупательницы — с позициями. */
export async function getOrdersByBuyer(userId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return demoOrders.filter((o) => o.buyer_id === userId)
  }
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })
    return (data as Order[]) ?? []
  } catch {
    return []
  }
}

/** Записи к магазину (салоны). */
export async function getBookingsByShop(shopId: string): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return demoBookings.filter((b) => b.shop_id === shopId)
  }
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
    return (data as Booking[]) ?? []
  } catch {
    return []
  }
}

// ---------- Сообщество ----------

/** Последние посты сообщества (для тизера на главной). */
/** Тизер на главной: свежие посты с автором, комментариями и товаром. */
export async function getCommunityPosts(limit = 3): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured()) return demoPosts.slice(0, limit)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('community_posts')
      .select(POST_WITH_ALL)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data ?? []).map(normalizePost)
  } catch {
    return []
  }
}

export const FEED_PAGE = 50

/**
 * Лента сообщества: не скрытые, новые сверху, страницами.
 * Фильтры по типу/тегу и сортировка «популярные» — на клиенте над загруженной страницей.
 */
export async function getCommunityFeed(
  page = 1,
  limit = FEED_PAGE,
): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
  if (!isSupabaseConfigured()) return { posts: demoPosts, hasMore: false }
  try {
    const supabase = await createClient()
    const from = (Math.max(1, Math.floor(page) || 1) - 1) * limit
    const { data, error } = await supabase
      .from('community_posts')
      .select(POST_WITH_ALL)
      .eq('hidden', false) // дубль RLS posts_read (см. шапку 007)
      .order('created_at', { ascending: false })
      .range(from, from + limit) // limit+1 строка → hasMore
    if (error) return { posts: [], hasMore: false }
    const rows = (data ?? []).map(normalizePost)
    return { posts: rows.slice(0, limit), hasMore: rows.length > limit }
  } catch {
    return { posts: [], hasMore: false }
  }
}

/**
 * Один пост (страница + generateMetadata → cache(): один запрос на рендер).
 * hidden не фильтруем: автор/админ видят свой скрытый пост по RLS.
 */
export const getCommunityPost = cache(async (id: string): Promise<CommunityPost | null> => {
  if (!isSupabaseConfigured()) return demoPosts.find((p) => p.id === id) ?? null
  if (!isUuid(id)) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('community_posts')
      .select(POST_WITH_ALL)
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    return normalizePost(data)
  } catch {
    return null
  }
})

/** Обсуждения товара из сообщества (карточка товара). */
export async function getPostsByProduct(productId: string): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured()) return demoPosts.filter((p) => p.product_id === productId)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('community_posts')
      .select(POST_WITH_ALL)
      .eq('product_id', productId)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) return []
    return (data ?? []).map(normalizePost)
  } catch {
    return []
  }
}

/** Вопросы о товаре с ответами. */
export async function getQuestionsForProduct(productId: string): Promise<ProductQuestion[]> {
  if (!isSupabaseConfigured()) return demoQuestions.filter((q) => q.product_id === productId)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('product_questions')
      .select(QUESTION_WITH_ANSWERS)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return []
    return (data ?? []).map(normalizeQuestion)
  } catch {
    return []
  }
}

/**
 * Текущий пользователь для гейта и «моего лайка». Демо → null (в демо гейта нет).
 * Имя — из profiles (его же штампует триггер); пустое имя → null.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data: p } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle()
    return { id: user.id, name: p?.name || null }
  } catch {
    return null
  }
})

/** id постов из списка, которые лайкнул пользователь (post_likes_read: using(true)). */
export async function getMyLikedPostIds(userId: string, postIds: string[]): Promise<string[]> {
  if (!isSupabaseConfigured() || postIds.length === 0) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)
    if (error) return []
    return (data ?? []).map((r: { post_id: string }) => r.post_id)
  } catch {
    return []
  }
}

// ---------- Коды подлинности (кабинет продавца) ----------

export interface ShopCode {
  code: string
  product_id: string | null
  batch: string | null
  expires_at: string | null
  checks_count: number
  first_checked_at: string | null
  created_at: string
}

/** Коды, выпущенные магазином (RLS: владелец магазина с подтверждённым импортом или админ). */
export async function getShopCodes(shopId: string): Promise<ShopCode[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('authenticity_codes')
      .select('code, product_id, batch, expires_at, checks_count, first_checked_at, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) return []
    return (data as ShopCode[] | null) ?? []
  } catch {
    return []
  }
}

// ---------- История диалогов с Севилёй ----------

export interface StoredConversation {
  id: string
  title: string
  messages: unknown[]
  updatedAt: number
}

/** Диалоги текущего пользователя (RLS: только свои), свежие сверху. Гость/демо → null. */
export async function getMyAssistantChats(): Promise<StoredConversation[] | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('assistant_conversations')
      .select('id, title, messages, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50)
    if (error) return []
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? '',
      messages: Array.isArray(r.messages) ? (r.messages as unknown[]) : [],
      updatedAt: Date.parse(r.updated_at as string) || 0,
    }))
  } catch {
    return []
  }
}

// ---------- Карта сайта ----------

export interface SitemapEntries {
  products: { id: string; at: string }[]
  shops: { id: string; at: string }[]
  posts: { id: string; at: string }[]
}

/** Публичные сущности для sitemap.xml. Демо-режим — только демо-товары и магазины (посты живут в браузере). */
export async function getSitemapEntries(): Promise<SitemapEntries> {
  if (!isSupabaseConfigured()) {
    return {
      products: demoProducts.map((p) => ({ id: p.id, at: p.created_at })),
      shops: demoShops.map((s) => ({ id: s.id, at: s.created_at })),
      posts: [],
    }
  }
  try {
    const supabase = await createClient()
    const [products, shops, posts] = await Promise.all([
      supabase.from('products').select('id, created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(2000),
      supabase.from('shops').select('id, created_at').order('created_at', { ascending: false }).limit(1000),
      supabase.from('community_posts').select('id, created_at').eq('hidden', false).order('created_at', { ascending: false }).limit(1000),
    ])
    const map = (rows: { id: string; created_at: string }[] | null) => (rows ?? []).map((r) => ({ id: r.id, at: r.created_at }))
    return { products: map(products.data), shops: map(shops.data), posts: map(posts.data) }
  } catch {
    return { products: [], shops: [], posts: [] }
  }
}

// ---------- Лояльность ----------

export interface MyLoyalty {
  points: number
  cardNo: string | null
  entries: LoyaltyEntry[]
}

/** Баллы, номер карты и история начислений текущего пользователя (RLS: только свои). null — гость/демо. */
export async function getMyLoyalty(): Promise<MyLoyalty | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const [{ data: p }, { data: e }] = await Promise.all([
      supabase.from('profiles').select('loyalty_points, loyalty_card_no').eq('id', user.id).maybeSingle(),
      supabase.from('loyalty_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    ])
    return {
      points: Number(p?.loyalty_points ?? 0),
      cardNo: (p?.loyalty_card_no as string | null) ?? null,
      entries: (e as LoyaltyEntry[] | null) ?? [],
    }
  } catch {
    return null
  }
}

// ---------- Davra ----------

/** Мои круги (RLS отдаёт только те, где я участница), новые сверху. Демо → [] (круг в localStorage). */
export async function getMyCircles(): Promise<Circle[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('circles')
      .select(CIRCLE_WITH_ALL)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []).map(normalizeCircle)
  } catch {
    return []
  }
}

/** Состояния моих кругов (прогресс к порогу с учётом уже оформленных заказов). */
export async function getCircleStates(ids: string[]): Promise<Record<string, CircleState>> {
  if (!isSupabaseConfigured() || ids.length === 0) return {}
  try {
    const supabase = await createClient()
    const entries = await Promise.all(
      ids.map(async (id) => {
        const { data, error } = await supabase.rpc('circle_state', { p_circle: id })
        return [id, error || !data ? null : (data as CircleState)] as const
      }),
    )
    return Object.fromEntries(entries.filter((e): e is readonly [string, CircleState] => e[1] !== null))
  } catch {
    return {}
  }
}

/** Превью круга по коду приглашения (страница /davra/join/<code>). */
export async function getCirclePreview(code: string): Promise<CirclePreview | null> {
  if (!isSupabaseConfigured()) return null
  if (!/^[a-z0-9]{8,32}$/i.test(code)) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('circle_preview', { p_code: code.toLowerCase() })
    if (error || !data) return null
    return data as CirclePreview
  } catch {
    return null
  }
}

// ---------- Ассистент ----------

/** Категории, которые ассистент не рекомендует: никаких советов про лекарства и БАД. */
const ASSISTANT_EXCLUDED = new Set(['pharmacy'])

/**
 * Каталог для заземления Севили. В боевом режиме — только активные товары из базы
 * (без тихого фолбэка на демо: пустая база = пустой каталог, а не выдуманные товары).
 */
export async function getAssistantCatalog(limit = 150): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return demoProducts.filter((p) => !ASSISTANT_EXCLUDED.has(p.category_slug ?? ''))
  }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_WITH_SHOP)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as Product[]).filter((p) => !ASSISTANT_EXCLUDED.has(p.category_slug ?? ''))
  } catch {
    return []
  }
}

// ---------- Поиск ----------

export async function search(q: string): Promise<{ products: Product[]; shops: Shop[] }> {
  const term = q.trim().toLowerCase()
  if (!term) return { products: [], shops: [] }

  if (!isSupabaseConfigured()) {
    return {
      products: demoProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description ?? '').toLowerCase().includes(term),
      ),
      shops: demoShops.filter((s) => s.name.toLowerCase().includes(term)),
    }
  }

  try {
    const supabase = await createClient()
    // В .or() строка собирается вручную, поэтому спецсимволы синтаксиса
    // PostgREST (, ( ) : % * \) из пользовательского ввода вырезаем —
    // иначе запросом вида «x),is_active.eq.false,(…» можно менять фильтр.
    const safe = term.replace(/[,()%*:\\]/g, ' ').trim()
    const [{ data: products }, { data: shops }] = await Promise.all([
      supabase
        .from('products')
        .select(PRODUCT_WITH_SHOP)
        .or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
        .eq('is_active', true)
        .limit(24),
      supabase.from('shops').select('*').ilike('name', `%${safe}%`).limit(12),
    ])
    return { products: (products as Product[]) ?? [], shops: (shops as Shop[]) ?? [] }
  } catch {
    return { products: [], shops: [] }
  }
}
