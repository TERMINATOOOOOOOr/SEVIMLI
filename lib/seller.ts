import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/utils'
import { demoShops, DEMO_SELLER_SHOP_ID } from '@/lib/demo'
import type { Profile, Shop } from '@/lib/types'

export interface SellerContext {
  userId: string | null
  profile: Profile | null
  shop: Shop | null
}

/** Профиль демо-продавца (используется, пока Supabase на заглушках). */
const demoSellerProfile: Profile = {
  id: 'demo-user',
  name: 'Демо',
  phone: '+998 90 123 45 67',
  role: 'seller',
  avatar_url: null,
  city: 'Ташкент',
  created_at: '2026-07-01T10:00:00Z',
}

/** Возвращает текущего пользователя-продавца, его профиль и первый магазин. */
export async function getSellerContext(): Promise<SellerContext> {
  // Демо-режим: отдаём демо-продавца с магазином Seoul Beauty.
  // Доступ к кабинету при этом гейтится на клиенте по демо-сессии (SellerDemoGate).
  if (!isSupabaseConfigured()) {
    return {
      userId: 'demo-user',
      profile: demoSellerProfile,
      shop: demoShops.find((s) => s.id === DEMO_SELLER_SHOP_ID) ?? null,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { userId: null, profile: null, shop: null }

  const [{ data: profile }, { data: shop }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('shops').select('*').eq('owner_id', user.id).limit(1).maybeSingle(),
  ])

  return {
    userId: user.id,
    profile: (profile as Profile) ?? null,
    shop: (shop as Shop) ?? null,
  }
}
