'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

const CITIES = ['Ташкент', 'Самарканд', 'Бухара']
const SORTS = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
]

export default function FilterSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const [minPrice, setMinPrice] = useState(sp.get('min_price') ?? '')
  const [maxPrice, setMaxPrice] = useState(sp.get('max_price') ?? '')
  const [city, setCity] = useState(sp.get('city') ?? '')
  const [sort, setSort] = useState(sp.get('sort') ?? 'newest')

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
    <aside className="rounded-2xl border border-neutral-200 p-5 lg:sticky lg:top-24">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-neutral-900">
        <SlidersHorizontal size={18} className="text-primary" />
        Фильтры
      </h3>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Цена, сум</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="от"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input !py-2"
            />
            <span className="text-neutral-400">—</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="до"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input !py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Город</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="input !py-2">
            <option value="">Все города</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Сортировка</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input !py-2">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={apply} className="btn-primary flex-1 !py-2.5 text-sm">
            Применить
          </button>
          <button onClick={reset} className="btn-outline !px-4 !py-2.5 text-sm">
            Сброс
          </button>
        </div>
      </div>
    </aside>
  )
}
