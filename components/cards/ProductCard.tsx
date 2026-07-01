'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatPrice, discountPercent } from '@/lib/format'
import { categoryEmoji } from '@/lib/categories'
import { useCart } from '@/store/cart'
import Thumb from '@/components/ui/Thumb'

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem)
  const discount = discountPercent(product.price, product.old_price)

  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
          <Thumb src={product.images?.[0]} emoji={categoryEmoji(product.category_slug)} alt={product.name} />
        </div>
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
            −{discount}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-medium text-neutral-800 hover:text-primary"
        >
          {product.name}
        </Link>

        {product.shop && (
          <span className="mt-1 text-xs text-neutral-400">{product.shop.name}</span>
        )}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-lg font-bold text-neutral-900">
            {formatPrice(product.price)}
          </span>
          {product.old_price && (
            <span className="text-sm text-neutral-400 line-through">
              {formatPrice(product.old_price)}
            </span>
          )}
        </div>

        <button
          onClick={() => addItem(product)}
          className="btn-primary mt-3 w-full !py-2.5 text-sm"
        >
          <ShoppingBag size={16} />В корзину
        </button>
      </div>
    </div>
  )
}
