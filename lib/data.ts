import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/utils'
import {
  demoCategories,
  demoShops,
  demoProducts,
  demoReviews,
  demoPosts,
  demoOrders,
  demoBookings,
} from '@/lib/demo'
import type { Category, Shop, Product, Review, CommunityPost, Order, Booking } from '@/lib/types'

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
export async function getCommunityPosts(limit = 3): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured()) return demoPosts.slice(0, limit)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return ((data as CommunityPost[]) ?? []).map((p) => ({ ...p, comments: p.comments ?? [] }))
  } catch {
    return []
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
