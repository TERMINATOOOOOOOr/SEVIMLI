/** Типы доменных сущностей — соответствуют таблицам из supabase/migrations/001_init.sql. */

export type UserRole = 'buyer' | 'seller' | 'admin'
export type OrderStatus = 'pending' | 'confirmed' | 'delivering' | 'done' | 'cancelled'

export interface Category {
  id: number
  name_ru: string
  name_uz: string | null
  icon: string | null
  slug: string
  parent_id: number | null
  sort_order: number
}

export interface Profile {
  id: string
  name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  city: string | null
  created_at: string
}

export interface Shop {
  id: string
  owner_id: string | null
  name: string
  description: string | null
  category_slug: string | null
  logo_url: string | null
  city: string
  phone: string | null
  instagram: string | null
  is_verified: boolean
  rating: number
  reviews_count: number
  created_at: string
}

export interface Product {
  id: string
  shop_id: string
  name: string
  description: string | null
  price: number
  old_price: number | null
  currency: string
  images: string[]
  category_slug: string | null
  stock: number
  is_active: boolean
  created_at: string
  /** Бренд (для косметики: COSRX, Anua…). Опционально. */
  brand?: string | null
  /** Страна происхождения (напр. «Корея»). Опционально. */
  country?: string | null
  /** Гарантия оригинала/официальный импорт. Опционально. */
  is_original?: boolean
  /** Цена официальных ритейлеров (для показа «дешевле оригинала»). */
  market_price?: number | null
  /** Подгружается через join при выборке. */
  shop?: Shop | null
}

export interface Order {
  id: string
  buyer_id: string | null
  shop_id: string | null
  status: OrderStatus
  total_price: number | null
  address: string | null
  comment: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  price_at_order: number
  product?: Product | null
}

export interface Review {
  id: string
  product_id: string | null
  user_id: string | null
  rating: number
  text: string | null
  created_at: string
  author?: Profile | null
}

export interface Booking {
  id: string
  shop_id: string | null
  user_id: string | null
  service_name: string | null
  booking_date: string | null
  time_slot: string | null
  status: string
  phone: string | null
  created_at: string
  shop?: Shop | null
}

// ---------- Сообщество (встроенная соц-медиа) ----------

export type PostKind = 'review' | 'question' | 'tip'

export interface PostComment {
  id: string
  post_id: string
  author_name: string
  text: string
  created_at: string
}

export interface CommunityPost {
  id: string
  author_name: string
  author_city: string | null
  /** Аватар автора (путь к фото). Нет — рисуем букву. */
  author_avatar?: string | null
  kind: PostKind
  text: string
  images: string[]
  /** Хэштеги/темы (напр. «уход», «корея», «отзыв»). */
  tags: string[]
  /** Привязка к товару — воронка «сообщество → покупка». */
  product_id: string | null
  likes: number
  created_at: string
  comments: PostComment[]
  product?: Product | null
}

// ---------- Вопросы о товаре (Q&A) ----------

export interface ProductAnswer {
  id: string
  question_id: string
  author_name: string
  /** Ответ от магазина/эксперта — выделяется бейджем. */
  is_seller: boolean
  text: string
  created_at: string
}

export interface ProductQuestion {
  id: string
  product_id: string
  author_name: string
  text: string
  created_at: string
  answers: ProductAnswer[]
}

// ---------- Лояльность ----------

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface LoyaltyEntry {
  id: string
  /** Положительное — начисление, отрицательное — списание. */
  points: number
  reason: string
  created_at: string
}
