'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatPriceLang, discountPercent } from '@/lib/format'
import { categoryEmoji } from '@/lib/categories'
import { productName } from '@/lib/product-i18n'
import { useCart } from '@/store/cart'
import { useLang } from '@/components/LangProvider'
import Thumb from '@/components/ui/Thumb'
import OriginalBadge from '@/components/ui/OriginalBadge'
import Tilt3D from '@/components/ui/Tilt3D'

const NEW_DAYS = 14
/** Момент загрузки модуля: «новинка» считается от него, а не от каждого рендера. */
const NOW = Date.now()

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem)
  const { lang, t } = useLang()
  const discount = discountPercent(product.price, product.old_price)
  const marketSaving = discountPercent(product.price, product.market_price)
  const isNew =
    !discount && NOW - new Date(product.created_at).getTime() < NEW_DAYS * 86400000
  const name = productName(product, lang)

  return (
    <Tilt3D glare className="h-full">
      <div className="card group flex h-full flex-col overflow-hidden">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
          <Thumb src={product.images?.[0]} emoji={categoryEmoji(product.category_slug)} alt={name} />
        </div>
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
            −{discount}%
          </span>
        )}
        {isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-white">
            {t.common.newBadge}
          </span>
        )}
        {product.is_original && <OriginalBadge size="sm" className="absolute right-3 top-3 shadow-sm" />}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {/* Бренд: строка резервируется всегда, чтобы карточки в ряду были одинаковыми */}
        <span className="mb-1 min-h-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {product.brand ?? ''}
        </span>

        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 min-h-10 text-sm font-medium text-neutral-800 hover:text-primary"
        >
          {name}
        </Link>

        <span className="mt-1 min-h-4 text-xs text-neutral-400">{product.shop?.name ?? ''}</span>

        {/* Цена и кнопка прижаты к низу — во всех карточках на одной линии */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-neutral-900">
              {formatPriceLang(product.price, lang)}
            </span>
            {product.old_price && (
              <span className="text-sm text-neutral-400 line-through">
                {formatPriceLang(product.old_price, lang)}
              </span>
            )}
          </div>

          <span className="mt-1 block min-h-4 text-xs font-medium text-secondary">
            {marketSaving ? `${t.common.cheaperPrefix} ${marketSaving}%` : ''}
          </span>

          <button
            onClick={() => addItem(product)}
            className="btn-primary mt-2 w-full !py-2.5 text-sm"
          >
            <ShoppingBag size={16} />
            {t.common.addToCart}
          </button>
          </div>
        </div>
      </div>
    </Tilt3D>
  )
}
