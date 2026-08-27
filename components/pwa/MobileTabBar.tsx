'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, MessagesSquare, Users, ShoppingBag, User } from 'lucide-react'
import { useCart, selectTotalCount } from '@/store/cart'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'

/** Нижняя навигация в стиле нативного приложения (только мобильные). */
export default function MobileTabBar() {
  const pathname = usePathname()
  const mounted = useHasMounted()
  const { t } = useLang()
  const count = useCart(selectTotalCount)

  if (pathname.startsWith('/seller')) return null

  const tabs = [
    { href: '/', label: t.nav.home, icon: Home, active: pathname === '/' },
    {
      href: '/korean',
      label: 'K-beauty',
      icon: Sparkles,
      active: pathname.startsWith('/korean') || pathname.startsWith('/catalog') || pathname.startsWith('/product'),
    },
    {
      href: '/community',
      label: t.nav.community,
      icon: MessagesSquare,
      active: pathname.startsWith('/community'),
    },
    { href: '/davra', label: 'Davra', icon: Users, active: pathname.startsWith('/davra') },
    { href: '/cart', label: t.nav.cart, icon: ShoppingBag, active: pathname.startsWith('/cart'), badge: true },
    {
      href: '/profile',
      label: t.nav.profile,
      icon: User,
      active: pathname.startsWith('/profile') || pathname.startsWith('/loyalty') || pathname.startsWith('/auth'),
    },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-6">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'relative flex flex-col items-center gap-0.5 overflow-hidden py-2 text-[10px] font-medium transition-colors',
              tab.active ? 'text-primary' : 'text-neutral-500',
            )}
          >
            <span className="relative">
              <tab.icon size={22} strokeWidth={tab.active ? 2.4 : 2} />
              {tab.badge && mounted && count > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
