import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/utils'
import { demoCategories, demoShops, demoProducts, demoReviews } from '@/lib/demo'
import type { Category, Shop, Product, Review } from '@/lib/types'

/**
 * Слой доступа к данным для серверных компонентов.
 * Если Supabase настроен — читаем из базы; иначе (заглушки) — из демо-данных.
 * Любая ошибка запроса тоже приводит к фолбэку на демо/пустые данные,
 * чтобы страница всегда рендерилась.
 */

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
  if (!isSupabaseConfigured()) return [...demoShops].sort((a, b) => b.rating - a.rating).slice(0, limit)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('rating', { ascending: false })
      .limit(limit)
    if (error || !data?.length) return demoShops.slice(0, limit)
    return data as Shop[]
  } catch {
    return demoShops.slice(0, limit)
  }
}

export async function getShopById(id: string): Promise<Shop | null> {
  if (!isSupabaseConfigured()) return demoShops.find((s) => s.id === id) ?? null
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('shops').select('*').eq('id', id).single()
    return (data as Shop) ?? null
  } catch {
    return demoShops.find((s) => s.id === id) ?? null
  }
}

// ---------- Товары ----------

export async function getNewProducts(limit = 8): Promise<Product[]> {
  if (!isSupabaseConfigured()) return demoProducts.slice(0, limit)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, shop:shops(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data?.length) return demoProducts.slice(0, limit)
    return data as Product[]
  } catch {
    return demoProducts.slice(0, limit)
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return demoProducts.find((p) => p.id === id) ?? null
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('products').select('*, shop:shops(*)').eq('id', id).single()
    return (data as Product) ?? null
  } catch {
    return demoProducts.find((p) => p.id === id) ?? null
  }
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getProductsByCategoryRaw(product.category_slug)
  return all.filter((p) => p.id !== product.id).slice(0, limit)
}

export async function getProductsByShop(shopId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) return demoProducts.filter((p) => p.shop_id === shopId)
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*, shop:shops(*)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
    return (data as Product[]) ?? []
  } catch {
    return demoProducts.filter((p) => p.shop_id === shopId)
  }
}

async function getProductsByCategoryRaw(slug: string | null): Promise<Product[]> {
  if (!slug) return []
  if (!isSupabaseConfigured()) return demoProducts.filter((p) => p.category_slug === slug)
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*, shop:shops(*)')
      .eq('category_slug', slug)
      .eq('is_active', true)
    return (data as Product[]) ?? []
  } catch {
    return demoProducts.filter((p) => p.category_slug === slug)
  }
}

/** Товары категории с фильтрами, сортировкой и пагинацией. */
export async function getCatalogProducts(
  slug: string,
  filters: CatalogFilters = {},
): Promise<{ items: Product[]; total: number }> {
  const { minPrice, maxPrice, city, sort = 'newest', page = 1, pageSize = 12 } = filters

  // Демо-режим или ошибка — фильтруем в памяти.
  const inMemory = async () => {
    let items = await getProductsByCategoryRaw(slug)
    if (minPrice != null) items = items.filter((p) => p.price >= minPrice)
    if (maxPrice != null) items = items.filter((p) => p.price <= maxPrice)
    if (city) items = items.filter((p) => p.shop?.city === city)
    items = sortProducts(items, sort)
    const total = items.length
    const start = (page - 1) * pageSize
    return { items: items.slice(start, start + pageSize), total }
  }

  if (!isSupabaseConfigured()) return inMemory()

  try {
    const supabase = await createClient()
    let query = supabase
      .from('products')
      .select('*, shop:shops(*)', { count: 'exact' })
      .eq('category_slug', slug)
      .eq('is_active', true)

    if (minPrice != null) query = query.gte('price', minPrice)
    if (maxPrice != null) query = query.lte('price', maxPrice)

    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    const { data, count, error } = await query
    if (error) return inMemory()
    // Фильтр по городу — по связанному магазину, поэтому пост-фильтрация.
    let items = (data as Product[]) ?? []
    if (city) items = items.filter((p) => p.shop?.city === city)
    return { items, total: count ?? items.length }
  } catch {
    return inMemory()
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
      .select('*, author:profiles(*)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    return (data as Review[]) ?? []
  } catch {
    return demoReviews.filter((r) => r.product_id === productId)
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
      .select('*, author:profiles(*)')
      .in('product_id', ids)
      .order('created_at', { ascending: false })
    return (data as Review[]) ?? []
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
    const [{ data: products }, { data: shops }] = await Promise.all([
      supabase
        .from('products')
        .select('*, shop:shops(*)')
        .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
        .eq('is_active', true)
        .limit(24),
      supabase.from('shops').select('*').ilike('name', `%${term}%`).limit(12),
    ])
    return { products: (products as Product[]) ?? [], shops: (shops as Shop[]) ?? [] }
  } catch {
    return { products: [], shops: [] }
  }
}
