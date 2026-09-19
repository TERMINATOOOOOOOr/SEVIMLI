'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, CalendarClock, Store, BarChart3, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/seller/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/seller/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/seller/products', label: 'Мои товары', icon: Package },
  { href: '/seller/orders', label: 'Заказы', icon: ShoppingCart },
  { href: '/seller/bookings', label: 'Записи', icon: CalendarClock },
  { href: '/seller/codes', label: 'Коды подлинности', icon: ShieldCheck },
  { href: '/seller/shop', label: 'Настройки магазина', icon: Store },
]

export default function SellerSidebar() {
  const pathname = usePathname()
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-neutral-200 p-2 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
      {links.map((l) => {
        const active = pathname === l.href
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-100',
            )}
          >
            <l.icon size={18} />
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
