'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart, selectTotalPrice } from '@/store/cart'
import { formatPriceLang } from '@/lib/format'
import { categoryEmoji } from '@/lib/categories'
import { productName } from '@/lib/product-i18n'
import { useLang } from '@/components/LangProvider'
import Thumb from '@/components/ui/Thumb'
import { cn } from '@/lib/utils'

export default function CartDrawer() {
  const { lang, t } = useLang()
  const { items, isOpen, close, updateQuantity, removeItem } = useCart()
  const total = useCart(selectTotalPrice)
  const pathname = usePathname()

  // На странице оформления боковая корзина не нужна — иначе она перекрывает форму заказа.
  useEffect(() => {
    if (pathname === '/cart' && isOpen) close()
  }, [pathname, isOpen, close])

  return (
    <>
      {/* Затемнение */}
      <div
        onClick={close}
        className={cn(
          'fixed inset-0 z-50 bg-black/40 transition-opacity',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Панель */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="font-display text-xl font-bold">{t.cart.drawerTitle}</h2>
          <button onClick={close} className="rounded-full p-2 hover:bg-neutral-100" aria-label="Закрыть">
            <X size={22} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-neutral-500">
            <ShoppingBag size={48} className="text-neutral-300" />
            <p>{t.cart.empty}</p>
            <button onClick={close} className="btn-outline mt-2">
              {t.cart.goShopping}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200">
                    <Thumb src={product.images?.[0]} emoji={categoryEmoji(product.category_slug)} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/product/${product.id}`}
                      onClick={close}
                      className="line-clamp-2 text-sm font-medium hover:text-primary"
                    >
                      {productName(product, lang)}
                    </Link>
                    <span className="mt-0.5 text-sm font-semibold text-primary">
                      {formatPriceLang(product.price, lang)}
                    </span>
                    <div className="mt-auto flex items-center gap-2">
                      <div className="flex items-center rounded-full border border-neutral-300">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1.5 text-neutral-600 hover:text-primary"
                          aria-label="Меньше"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center text-sm">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="p-1.5 text-neutral-600 hover:text-primary"
                          aria-label="Больше"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="ml-auto p-1.5 text-neutral-400 hover:text-red-500"
                        aria-label="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="border-t border-neutral-200 p-5">
              <div className="mb-4 flex items-center justify-between text-lg">
                <span className="text-neutral-600">{t.cart.total}</span>
                <span className="font-display font-bold">{formatPriceLang(total, lang)}</span>
              </div>
              <Link href="/cart" onClick={close} className="btn-primary w-full">
                {t.cart.submit}
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
