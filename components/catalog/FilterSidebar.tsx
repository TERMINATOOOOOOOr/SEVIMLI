'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'

/** Значения городов совпадают с demo-данными (по-русски), подписи локализуются. */
const CITIES = [
  { value: 'Ташкент', uz: 'Toshkent' },
  { value: 'Самарканд', uz: 'Samarqand' },
  { value: 'Бухара', uz: 'Buxoro' },
]

export default function FilterSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const { lang, t } = useLang()

  const [minPrice, setMinPrice] = useState(sp.get('min_price') ?? '')
  const [maxPrice, setMaxPrice] = useState(sp.get('max_price') ?? '')
  const [city, setCity] = useState(sp.get('city') ?? '')
  const [sort, setSort] = useState(sp.get('sort') ?? 'newest')
  // На мобильных фильтры свёрнуты (иначе занимают весь первый экран);
  // если фильтры уже применены — раскрываем, чтобы их было видно.
  const hasActive = Boolean(sp.get('min_price') || sp.get('max_price') || sp.get('city') || sp.get('sort'))
  const [open, setOpen] = useState(hasActive)
  const activeCount = [sp.get('min_price') || sp.get('max_price'), sp.get('city'), sp.get('sort')].filter(Boolean).length

  const sorts = [
    { value: 'newest', label: t.catalog.sortNew },
    { value: 'price_asc', label: t.catalog.sortCheap },
    { value: 'price_desc', label: t.catalog.sortExpensive },
  ]

  function apply() {
    const params = new URLSearchParams()
    if (minPrice) params.set('min_price', minPrice)
    if (maxPrice) params.set('max_price', maxPrice)
    if (city) params.set('city', city)
    if (sort && sort !== 'newest') params.set('sort', sort)
    router.push(`${pathname}?${params.toString()}`)
  }

  function reset() {
    setMinPrice('')
    setMaxPrice('')
    setCity('')
    setSort('newest')
    router.push(pathname)
  }

  return (
    <aside className="rounded-2xl border border-neutral-200 p-4 lg:sticky lg:top-24 lg:p-5">
      {/* Мобильный тумблер; на десктопе — просто заголовок */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 font-semibold text-neutral-900 lg:pointer-events-none"
      >
        <SlidersHorizontal size={18} className="text-primary" />
        {t.catalog.filters}
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={18}
          className={cn('ml-auto text-neutral-400 transition-transform lg:hidden', open && 'rotate-180')}
        />
      </button>

      <div className={cn('mt-4 space-y-5', !open && 'hidden lg:block')}>
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">{t.catalog.price}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder={t.catalog.from}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input !py-2"
            />
            <span className="text-neutral-400">—</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={t.catalog.to}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input !py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">{t.catalog.city}</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="input !py-2">
            <option value="">{t.catalog.allCities}</option>
            {CITIES.map((c) => (
              <option key={c.value} value={c.value}>
                {lang === 'uz' ? c.uz : c.value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">{t.catalog.sort}</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input !py-2">
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={apply} className="btn-primary flex-1 !py-2.5 text-sm">
            {t.catalog.apply}
          </button>
          <button onClick={reset} className="btn-outline !px-4 !py-2.5 text-sm">
            {t.catalog.reset}
          </button>
        </div>
      </div>
    </aside>
  )
}
