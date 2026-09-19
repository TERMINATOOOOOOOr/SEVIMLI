import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/utils'
import type { CommunityPost, Shop } from '@/lib/types'

/** Серверные данные админки. Доступ — только profiles.role = 'admin' (RLS и RPC проверяют это же на стороне базы). */

export interface AdminStats {
  users: number
  sellers: number
  shops: number
  shops_demo: number
  shops_unverified: number
  products: number
  orders_pending: number
  orders_active: number
  orders_done: number
  gmv_done: number
  posts: number
  posts_hidden: number
  posts_reported: number
  waitlist: number
  circles: number
}

export interface WaitlistRow {
  id: string
  name: string | null
  contact: string
  city: string | null
  interests: string[] | null
  source: string | null
  created_at: string
}

export type ModerationPost = Pick<
  CommunityPost,
  'id' | 'author_id' | 'author_name' | 'text' | 'images' | 'kind' | 'created_at' | 'hidden' | 'is_ad' | 'reports_count'
> & { is_demo?: boolean }

export async function isAdminUser(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    return data?.role === 'admin'
  } catch {
    return false
  }
}

export async function getAdminData(): Promise<{
  stats: AdminStats | null
  posts: ModerationPost[]
  shops: Shop[]
  waitlist: WaitlistRow[]
}> {
  const supabase = await createClient()
  const [stats, posts, shops, waitlist] = await Promise.all([
    supabase.rpc('admin_stats'),
    supabase
      .from('community_posts')
      .select('id, author_id, author_name, text, images, kind, created_at, hidden, is_ad, reports_count, is_demo')
      .or('reports_count.gt.0,hidden.eq.true')
      .order('reports_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('shops').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('waitlist').select('*').order('created_at', { ascending: false }).limit(1000),
  ])
  return {
    stats: (stats.data as AdminStats | null) ?? null,
    posts: (posts.data as ModerationPost[] | null) ?? [],
    shops: (shops.data as Shop[] | null) ?? [],
    waitlist: (waitlist.data as WaitlistRow[] | null) ?? [],
  }
}
