import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/utils'
import AuthRequired from '@/components/auth/AuthRequired'
import ProfileView from '@/components/profile/ProfileView'
import type { Profile, Order, Booking } from '@/lib/types'

export const metadata: Metadata = { title: 'Профиль' }

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) return <AuthRequired demo />

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <AuthRequired />

  const [{ data: profile }, { data: orders }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('*, shop:shops(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const safeProfile: Profile =
    (profile as Profile) ?? {
      id: user.id,
      name: null,
      phone: null,
      role: 'buyer',
      avatar_url: null,
      city: null,
      created_at: new Date().toISOString(),
    }

  return (
    <ProfileView
      profile={safeProfile}
      email={user.email ?? ''}
      orders={(orders as Order[]) ?? []}
      bookings={(bookings as Booking[]) ?? []}
    />
  )
}
