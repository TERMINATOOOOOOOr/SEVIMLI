'use client'

import Link from 'next/link'
import { Store } from 'lucide-react'
import { useSession } from '@/store/session'
import { useHasMounted } from '@/lib/hooks'
import AuthRequired from '@/components/auth/AuthRequired'

/**
 * Гейт кабинета продавца в демо-режиме: пускаем только с демо-сессией и ролью seller.
 * Роль включается кнопкой «Стать продавцом» в профиле.
 */
export default function SellerDemoGate({ children }: { children: React.ReactNode }) {
  const mounted = useHasMounted()
  const user = useSession((s) => s.user)

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    )
  }

  if (!user) return <AuthRequired />

  if (user.role !== 'seller' && user.role !== 'admin') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
          <Store size={28} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900">
          Вы ещё не продавец
        </h1>
        <p className="mt-2 text-neutral-500">
          Откройте кабинет продавца кнопкой «Стать продавцом» в профиле — это бесплатно.
        </p>
        <Link href="/profile" className="btn-primary mt-6">
          В профиль
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
