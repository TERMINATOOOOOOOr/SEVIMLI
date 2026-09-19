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
  /** Серверные баллы и карта лояльности (меняет только сервер). */
  loyalty_points?: number
  loyalty_tier?: LoyaltyTier
  loyalty_card_no?: string | null
}

/** Публичная часть профиля (view public_profiles) — без телефона и роли. */
export interface PublicProfile {
  id: string
  name: string | null
  avatar_url: string | null
  city: string | null
  loyalty_tier?: LoyaltyTier | null
  created_at: string
}

/** Текущий пользователь для клиентских компонентов сообщества (гейт, «мой лайк»). */
export interface Viewer {
  id: string
  name: string | null
}

export type ShopPlan = 'free' | 'pro' | 'premium' | 'salon_pro'

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
  /** Доставка выполняется магазином: тариф по Ташкенту и порог бесплатной доставки (сум). */
  delivery_fee?: number | null
  free_delivery_from?: number | null
  delivery_days_text?: string | null
  pickup_enabled?: boolean
  pickup_address?: string | null
  ships_to_regions?: boolean
  /** Тариф продавца и его срок. */
  plan?: ShopPlan
  plan_until?: string | null
  featured_until?: string | null
  /** Админ подтвердил документы импорта — можно ставить метку «оригинал». */
  is_original_verified?: boolean
  /** Демо-магазин из сида (удаляется перед боевым запуском). */
  is_demo?: boolean
  /** Магазин участвует в Davra: даёт −10% кругам при сумме круга от 500 000 сум. */
  davra_enabled?: boolean
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

export type DeliveryMethod = 'seller' | 'pickup' | 'partner' | 'point'

export interface Order {
  id: string
  buyer_id: string | null
  shop_id: string | null
  status: OrderStatus
  total_price: number | null
  address: string | null
  comment: string | null
  created_at: string
  delivery_method?: DeliveryMethod
  delivery_fee?: number | null
  recipient_name?: string | null
  recipient_phone?: string | null
  /** 4-значный код получения (покупательница называет его при выдаче). */
  pickup_code?: string | null
  tracking_url?: string | null
  delivered_at?: string | null
  dispute_status?: 'none' | 'open' | 'resolved'
  dispute_note?: string | null
  /** Заказ из круга Davra: скидка круга уже в price_at_order, сумма скидки — discount_total. */
  circle_id?: string | null
  discount_total?: number | null
  /** Подгружается через join order_items. */
  items?: OrderItem[]
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
  author?: PublicProfile | null
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
  author_id?: string | null
  author?: PublicProfile | null
  author_name: string
  text: string
  created_at: string
  /** Ключ демо-контента (cp1/cc1…) для UZ-переводов; у живого UGC нет. */
  demo_key?: string | null
}

export interface CommunityPost {
  id: string
  author_id?: string | null
  author?: PublicProfile | null
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
  /** Скрыт по жалобам (видит только автор/админ). */
  hidden?: boolean
  /** Пост продавца или с промокодом — помечается «Реклама». */
  is_ad?: boolean
  reports_count?: number
  demo_key?: string | null
}

// ---------- Вопросы о товаре (Q&A) ----------

export interface ProductAnswer {
  id: string
  question_id: string
  author_id?: string | null
  author?: PublicProfile | null
  author_name: string
  /** Ответ от магазина/эксперта — выделяется бейджем. */
  is_seller: boolean
  text: string
  created_at: string
  demo_key?: string | null
}

export interface ProductQuestion {
  id: string
  product_id: string
  author_id?: string | null
  author?: PublicProfile | null
  author_name: string
  text: string
  created_at: string
  answers: ProductAnswer[]
  demo_key?: string | null
}

// ---------- Davra (круг подруг, боевой режим) ----------

export interface CircleMember {
  circle_id: string
  user_id: string
  joined_at: string
  profile?: PublicProfile | null
}

export interface CircleItem {
  id: string
  circle_id: string
  user_id: string
  product_id: string
  qty: number
  created_at: string
  product?: Product | null
}

export interface Circle {
  id: string
  name: string
  owner_id: string
  invite_code: string
  created_at: string
  members: CircleMember[]
  items: CircleItem[]
}

/** Состояние круга (RPC circle_state): корзина + уже оформленное → прогресс к порогу. */
export interface CircleState {
  items_total: number
  ordered_total: number
  threshold: number
  discount_on: boolean
}

/** Превью круга по коду приглашения (RPC circle_preview). */
export interface CirclePreview {
  id: string
  name: string
  owner_name: string
  members: number
  is_full: boolean
  is_member: boolean
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
