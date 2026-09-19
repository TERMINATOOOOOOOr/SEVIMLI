'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Minus, ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useCart } from '@/store/cart'
import { useLang } from '@/components/LangProvider'

export default function AddToCart({ product }: { product: Product }) {
  const router = useRouter()
  const { t } = useLang()
  const addItem = useCart((s) => s.addItem)
  const [qty, setQty] = useState(1)

  const outOfStock = product.stock <= 0

  function buyNow() {
    // Тихо: иначе боковая корзина откроется поверх страницы оформления
    addItem(product, qty, false)
    router.push('/cart')
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600">{t.product.qty}</span>
        <div className="flex items-center rounded-full border border-neutral-300">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="p-2.5 text-neutral-600 hover:text-primary"
            aria-label="−"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="p-2.5 text-neutral-600 hover:text-primary"
            aria-label="+"
          >
            <Plus size={16} />
          </button>
        </div>
        {outOfStock ? (
          <span className="text-sm font-medium text-red-500">{t.product.outOfStock}</span>
        ) : (
          <span className="text-sm text-neutral-400">
            {t.product.inStock} {product.stock}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => addItem(product, qty)}
          disabled={outOfStock}
          className="btn-primary flex-1"
        >
          <ShoppingBag size={18} />
          {t.common.addToCart}
        </button>
        <button onClick={buyNow} disabled={outOfStock} className="btn-outline flex-1">
          {t.product.buyNow}
        </button>
      </div>
    </div>
  )
}
