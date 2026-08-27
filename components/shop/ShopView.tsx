'use client'

import { useState } from 'react'
import { BadgeCheck, MapPin, AtSign, CalendarPlus } from 'lucide-react'
import type { Shop, Product, Review } from '@/lib/types'
import { categoryEmoji, categoryLabel } from '@/lib/categories'
import { shopDesc } from '@/lib/product-i18n'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'
import Thumb from '@/components/ui/Thumb'
import StarRating from '@/components/ui/StarRating'
import ProductCard from '@/components/cards/ProductCard'
import ReviewCard from '@/components/cards/ReviewCard'
import BookingModal from '@/components/BookingModal'

type Tab = 'products' | 'reviews' | 'about'

export default function ShopView({
  shop,
  products,
  reviews,
}: {
  shop: Shop
  products: Product[]
  reviews: Review[]
}) {
  const { lang, t } = useLang()
  const [tab, setTab] = useState<Tab>('products')
  const [bookingOpen, setBookingOpen] = useState(false)
  const isSalon = shop.category_slug === 'salons'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'products', label: isSalon ? t.shopPage.services : t.shopPage.products },
    { id: 'reviews', label: `${t.shopPage.reviews} (${reviews.length})` },
    { id: 'about', label: t.shopPage.about },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Шапка */}
      <div className="flex flex-col gap-5 rounded-3xl border border-neutral-200 p-6 sm:flex-row sm:items-center">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-neutral-200">
          <Thumb src={shop.logo_url} emoji={categoryEmoji(shop.category_slug)} alt={shop.name} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold text-neutral-900">{shop.name}</h1>
            {shop.is_verified && <BadgeCheck size={22} className="text-secondary" />}
          </div>
          <p className="mt-1 text-sm text-neutral-400">{categoryLabel(shop.category_slug, lang)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <StarRating value={shop.rating} count={shop.reviews_count} />
            <span className="flex items-center gap-1 text-sm text-neutral-500">
              <MapPin size={14} /> {shop.city}
            </span>
            {shop.instagram && (
              <a
                // Хендл нормализуем: пользовательское значение не должно ломать URL
                href={`https://instagram.com/${shop.instagram.replace(/^@/, '').replace(/[^A-Za-z0-9._].*$/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <AtSign size={14} /> {shop.instagram}
              </a>
            )}
          </div>
        </div>
        {isSalon && (
          <button onClick={() => setBookingOpen(true)} className="btn-primary shrink-0">
            <CalendarPlus size={18} /> {t.shopPage.book}
          </button>
        )}
      </div>

      {/* Вкладки */}
      <div className="mt-8 flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'products' &&
          (products.length === 0 ? (
            <Empty text={t.shopPage.noProducts} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ))}

        {tab === 'reviews' &&
          (reviews.length === 0 ? (
            <Empty text={t.shopPage.noReviews} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          ))}

        {tab === 'about' && (
          <div className="max-w-2xl space-y-3 text-neutral-700">
            <p>{shopDesc(shop, lang) || t.shopPage.noDescription}</p>
            {shop.phone && (
              <p className="text-sm text-neutral-500">
                {t.shopPage.phone} <span className="text-neutral-800">{shop.phone}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {bookingOpen && (
        <BookingModal shopId={shop.id} shopName={shop.name} onClose={() => setBookingOpen(false)} />
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
      {text}
    </p>
  )
}
