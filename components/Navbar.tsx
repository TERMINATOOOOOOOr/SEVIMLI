'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, ShoppingBag, User, Menu, X, Gift } from 'lucide-react'
import { useCart, selectTotalCount } from '@/store/cart'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'
import LangSwitcher from '@/components/LangSwitcher'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const mounted = useHasMounted()
  const { t } = useLang()
  const count = useCart(selectTotalCount)
  const openCart = useCart((s) => s.open)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks: { href: string; label: string; isNew?: boolean; xlOnly?: boolean }[] = [
    { href: '/korean', label: t.nav.kbeauty },
    { href: '/community', label: t.nav.community },
    { href: '/davra', label: 'Davra', isNew: true },
    { href: '/catalog/clothes', label: t.nav.clothes },
    { href: '/catalog/beauty', label: t.nav.beauty },
    { href: '/catalog/salons', label: t.nav.salons, xlOnly: true },
    { href: '/catalog/kids', label: t.nav.kids, xlOnly: true },
  ]

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Бургер (моб.) */}
        <button
          className="text-neutral-700 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t.nav.menu}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Логотип */}
        <Link href="/" className="shrink-0">
          <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
            SEVIMLI
          </span>
        </Link>

        {/* Поиск (десктоп) */}
        <form onSubmit={submitSearch} className="relative hidden min-w-0 flex-1 md:block">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.nav.searchPlaceholder}
            className="input pl-11"
          />
        </form>

        {/* Навигация (десктоп) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn('btn-ghost relative whitespace-nowrap !px-2.5 text-sm', l.xlOnly && 'hidden xl:block')}
            >
              {l.label}
              {l.isNew && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-secondary" />
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {/* Язык */}
          <LangSwitcher className="mr-1 hidden sm:flex" />

          {/* Карта лояльности */}
          <Link
            href="/loyalty"
            className="hidden rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-primary sm:block"
            aria-label={t.nav.loyalty}
          >
            <Gift size={22} />
          </Link>

          {/* Корзина */}
          <button
            onClick={openCart}
            className="relative rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-neutral-100"
            aria-label={t.nav.cart}
          >
            <ShoppingBag size={22} />
            {mounted && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </button>

          {/* Профиль */}
          <Link
            href="/profile"
            className="rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-neutral-100"
            aria-label={t.nav.profile}
          >
            <User size={22} />
          </Link>
        </div>
      </div>

      {/* Поиск (моб.); на главной прячем — там свой поиск в hero */}
      <form
        onSubmit={submitSearch}
        className={cn('relative px-4 pb-3 md:hidden', pathname === '/' && 'hidden')}
      >
        <Search
          size={18}
          className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.nav.searchShort}
          className="input pl-11"
        />
      </form>

      {/* Мобильное меню */}
      <div
        className={cn(
          'overflow-hidden border-t border-neutral-100 bg-white transition-all md:hidden',
          menuOpen ? 'max-h-[30rem]' : 'max-h-0',
        )}
      >
        <nav className="flex flex-col p-2">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-neutral-800 hover:bg-neutral-100"
            >
              {l.label}
            </Link>
          ))}
          <div className="px-4 py-3">
            <LangSwitcher className="w-fit" />
          </div>
        </nav>
      </div>
    </header>
  )
}
