'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react'
import { useCart, selectTotalCount } from '@/store/cart'
import { useHasMounted } from '@/lib/hooks'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/catalog/clothes', label: 'Одежда' },
  { href: '/catalog/beauty', label: 'Косметика' },
  { href: '/catalog/salons', label: 'Салоны' },
  { href: '/catalog/kids', label: 'Детям' },
]

export default function Navbar() {
  const router = useRouter()
  const mounted = useHasMounted()
  const count = useCart(selectTotalCount)
  const openCart = useCart((s) => s.open)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

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
          aria-label="Меню"
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
        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Искать товары и магазины…"
            className="input pl-11"
          />
        </form>

        {/* Навигация (десктоп) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="btn-ghost text-sm">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {/* Корзина */}
          <button
            onClick={openCart}
            className="relative rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-neutral-100"
            aria-label="Корзина"
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
            aria-label="Профиль"
          >
            <User size={22} />
          </Link>
        </div>
      </div>

      {/* Поиск (моб.) */}
      <form onSubmit={submitSearch} className="relative px-4 pb-3 md:hidden">
        <Search
          size={18}
          className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Искать…"
          className="input pl-11"
        />
      </form>

      {/* Мобильное меню */}
      <div
        className={cn(
          'overflow-hidden border-t border-neutral-100 bg-white transition-all md:hidden',
          menuOpen ? 'max-h-72' : 'max-h-0',
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
        </nav>
      </div>
    </header>
  )
}
