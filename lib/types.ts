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
