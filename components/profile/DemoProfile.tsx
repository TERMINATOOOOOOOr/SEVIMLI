'use client'

import { useMemo } from 'react'
import { useSession } from '@/store/session'
import { useHasMounted } from '@/lib/hooks'
import { demoOrders, demoBookings } from '@/lib/demo'
import type { Profile } from '@/lib/types'
import AuthRequired from '@/components/auth/AuthRequired'
import ProfileView from '@/components/profile/ProfileView'

/**
 * Профиль в демо-режиме (Supabase на заглушках): данные берём из демо-сессии
 * (store/session.ts) и демо-заказов. Реальный профиль — в app/profile/page.tsx.
 */
export default function DemoProfile() {
  const mounted = useHasMounted()
  const user = useSession((s) => s.user)

  const profile: Profile | null = useMemo(
    () =>
      user
        ? {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            avatar_url: null,
            city: user.city,
            created_at: '2026-07-01T10:00:00Z',
          }
        : null,
    [user],
  )

  const orders = useMemo(() => demoOrders.filter((o) => o.buyer_id === 'demo-user'), [])
  const bookings = useMemo(() => demoBookings.filter((b) => b.user_id === 'demo-user'), [])

  if (!mounted) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    )
  }

  if (!profile) return <AuthRequired />

  return (
    <ProfileView demo profile={profile} email={user!.email} orders={orders} bookings={bookings} />
  )
}
