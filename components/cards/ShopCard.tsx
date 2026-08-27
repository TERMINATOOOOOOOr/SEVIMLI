'use client'

import Link from 'next/link'
import { BadgeCheck, MapPin } from 'lucide-react'
import type { Shop } from '@/lib/types'
import { categoryEmoji, categoryLabel } from '@/lib/categories'
import { useLang } from '@/components/LangProvider'
import StarRating from '@/components/ui/StarRating'
import Thumb from '@/components/ui/Thumb'

const CITY_UZ: Record<string, string> = {
  Ташкент: 'Toshkent',
  Самарканд: 'Samarqand',
  Бухара: 'Buxoro',
}

export default function ShopCard({ shop }: { shop: Shop }) {
  const { lang } = useLang()
  return (
    <Link
      href={`/shop/${shop.id}`}
      className="card flex w-64 shrink-0 flex-col overflow-hidden sm:w-auto"
    >
      <div className="aspect-[16/9] overflow-hidden">
        <Thumb src={shop.logo_url} emoji={categoryEmoji(shop.category_slug)} alt={shop.name} />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-semibold text-neutral-900">{shop.name}</h3>
          {shop.is_verified && <BadgeCheck size={16} className="shrink-0 text-secondary" />}
        </div>
        <p className="mt-0.5 text-xs text-neutral-400">{categoryLabel(shop.category_slug, lang)}</p>
        <div className="mt-2 flex items-center justify-between">
          <StarRating value={shop.rating} count={shop.reviews_count} size={14} />
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <MapPin size={12} />
            {lang === 'uz' ? (CITY_UZ[shop.city] ?? shop.city) : shop.city}
          </span>
        </div>
      </div>
    </Link>
  )
}
