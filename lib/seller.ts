import { createClient } from '@/lib/supabase/server'
import type { Profile, Shop } from '@/lib/types'

export interface SellerContext {
  userId: string | null
  profile: Profile | null
  shop: Shop | null
}

/** Возвращает текущего пользователя-продавца, его профиль и первый магазин. */
export async function getSellerContext(): Promise<SellerContext> {
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
