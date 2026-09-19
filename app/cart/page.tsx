'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShoppingBag, Trash2, Plus, Minus, Truck, Gift, Store, MapPin } from 'lucide-react'
import { useCart, selectTotalPrice, type CartItem } from '@/store/cart'
import { useLoyalty } from '@/store/loyalty'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured, cn } from '@/lib/utils'
import { formatPriceLang, formatPointsLang } from '@/lib/format'
import { pointsForOrder } from '@/lib/loyalty'
import { categoryEmoji } from '@/lib/categories'
import { productName } from '@/lib/product-i18n'
import type { Shop } from '@/lib/types'
import { useLang } from '@/components/LangProvider'
import Thumb from '@/components/ui/Thumb'
import SoftGlow from '@/components/ui/SoftGlow'
import WeightlessBg from '@/components/ui/Weightless'

type DeliveryMethod = 'seller' | 'pickup'

/** Тариф магазина по умолчанию, если продавец ещё не заполнил доставку. */
const DEFAULT_FEE = 15000
const DEFAULT_FREE_FROM = 200000

interface ShopGroup {
  shopId: string
  shop: Shop | null | undefined
  items: CartItem[]
  subtotal: number
}

/** Стоимость доставки по тарифу магазина: бесплатно от порога, самовывоз — 0. */
function deliveryFee(group: ShopGroup, method: DeliveryMethod): number {
  if (method === 'pickup') return 0
  const fee = group.shop?.delivery_fee ?? DEFAULT_FEE
  const freeFrom = group.shop?.free_delivery_from ?? DEFAULT_FREE_FROM
  return group.subtotal >= freeFrom ? 0 : fee
}

export default function CartPage() {
  const router = useRouter()
  const { lang, t } = useLang()
  const { items, updateQuantity, removeItem, clearCart } = useCart()
  const subtotal = useCart(selectTotalPrice)
  const points = useLoyalty((s) => s.points)
  const addPoints = useLoyalty((s) => s.addPoints)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [method, setMethod] = useState<DeliveryMethod>('seller')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [earned, setEarned] = useState(0)

  // Корзина дробится по магазинам: один заказ — один магазин, доставка считается на каждый.
  const groups = useMemo<ShopGroup[]>(() => {
    const map = new Map<string, ShopGroup>()
    for (const it of items) {
      const key = it.product.shop_id
      const g = map.get(key) ?? { shopId: key, shop: it.product.shop, items: [], subtotal: 0 }
      g.items.push(it)
      g.subtotal += it.product.price * it.quantity
      map.set(key, g)
    }
    return [...map.values()]
  }, [items])

  const pickupAvailable = groups.length > 0 && groups.every((g) => g.shop?.pickup_enabled)
  const effectiveMethod: DeliveryMethod = method === 'pickup' && pickupAvailable ? 'pickup' : 'seller'
  const deliveryTotal = groups.reduce((s, g) => s + deliveryFee(g, effectiveMethod), 0)
  const total = subtotal + deliveryTotal
  const willEarn = pointsForOrder(subtotal, points)

  /** Демо: начисляем баллы локально. В боевом режиме баллы приходят после выкупа заказа (сервер). */
  function awardPointsDemo() {
    const gained = pointsForOrder(subtotal, points)
    if (gained > 0) addPoints(gained, t.cart.pointsReason)
    setEarned(gained)
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    if (!consent) return
    setError(null)
    setSubmitting(true)

    try {
      // Демо-режим: имитируем оформление без базы
      if (!isSupabaseConfigured()) {
        const num = Math.floor(100000 + Math.random() * 900000).toString()
        awardPointsDemo()
        clearCart()
        setOrderNumber(num)
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/cart')
        return
      }

      // Цены, сток и итог считает сервер (create_order) — клиент шлёт только id и количество.
      const { data, error: rpcErr } = await supabase.rpc('create_order', {
        p_items: items.map((it) => ({ product_id: it.product.id, quantity: it.quantity })),
        p_recipient_name: name.trim(),
        p_recipient_phone: phone.trim(),
        p_address: effectiveMethod === 'pickup' ? address.trim() || t.cart.methodPickup : address.trim(),
        p_comment: comment.trim() || null,
        p_delivery_method: effectiveMethod,
        p_source: 'web',
      })
      if (rpcErr) throw rpcErr
      const created = (data as { order_id?: string }[] | null) ?? []
      const firstId = created[0]?.order_id ?? ''
      clearCart()
      setOrderNumber(firstId ? firstId.slice(0, 8) : '—')
    } catch (err) {
      setError(err instanceof Error ? err.message : t.cart.orderFail)
    } finally {
      setSubmitting(false)
    }
  }

  // Экран подтверждения
  if (orderNumber) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-light text-secondary">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900">{t.cart.done}</h1>
        <p className="mt-2 text-neutral-500">
          {t.cart.orderNo} <span className="font-semibold text-neutral-800">#{orderNumber}</span>
        </p>
        <p className="mt-1 text-sm text-neutral-400">{t.cart.contact}</p>

        {earned > 0 && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-primary-light px-4 py-3 text-sm font-medium text-primary">
            <Gift size={18} />
            {t.cart.earned} {formatPointsLang(earned, lang)} {t.cart.earnedSuffix}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-outline">
            {t.cart.toHome}
          </Link>
          <Link href="/loyalty" className="btn-outline">
            {t.cart.myCard}
          </Link>
          <Link href="/profile" className="btn-primary">
            {t.cart.myOrders}
          </Link>
        </div>
      </div>
    )
  }

  // Пустая корзина
  if (items.length === 0) {
    return (
      <div className="relative isolate mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <SoftGlow variant="rose" />
        <WeightlessBg seed={3} />
        <ShoppingBag size={56} className="text-neutral-300" />
        <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900">{t.cart.empty}</h1>
        <p className="mt-2 text-neutral-500">{t.cart.emptyText}</p>
        <Link href="/catalog/clothes" className="btn-primary mt-6">
          {t.cart.goShopping}
        </Link>
      </div>
    )
  }

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SoftGlow variant="rose" />
      <WeightlessBg seed={3} />
      <h1 className="mb-8 font-display text-3xl font-bold text-neutral-900">{t.cart.title}</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Товары + форма */}
        <div className="space-y-8">
          <div className="space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 rounded-2xl border border-neutral-200 p-3">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200">
                  <Thumb src={product.images?.[0]} emoji={categoryEmoji(product.category_slug)} />
                </div>
                <div className="flex flex-1 flex-col">
                  <Link href={`/product/${product.id}`} className="font-medium hover:text-primary">
                    {productName(product, lang)}
                  </Link>
                  <span className="text-sm font-semibold text-primary">{formatPriceLang(product.price, lang)}</span>
                  <span className="text-xs text-neutral-400">{product.shop?.name ?? ''}</span>
                  <div className="mt-auto flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-neutral-300">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1.5 hover:text-primary">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)} className="p-1.5 hover:text-primary">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(product.id)} className="text-neutral-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="hidden shrink-0 self-center font-semibold sm:block">
                  {formatPriceLang(product.price * quantity, lang)}
                </div>
              </div>
            ))}
          </div>

          <form id="checkout" onSubmit={placeOrder} className="space-y-4 rounded-2xl border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">{t.cart.deliveryData}</h2>

            {/* Способ получения: доставка магазином / самовывоз (если все магазины его дают) */}
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors',
                  effectiveMethod === 'seller' ? 'border-primary bg-primary-light/40' : 'border-neutral-200',
                )}
              >
                <input
                  type="radio"
                  name="method"
                  checked={effectiveMethod === 'seller'}
                  onChange={() => setMethod('seller')}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="flex items-center gap-1.5 font-medium text-neutral-900">
                    <Truck size={15} className="text-primary" /> {t.cart.methodSeller}
                  </span>
                  <span className="block text-xs text-neutral-500">{t.cart.methodSellerHint}</span>
                </span>
              </label>
              <label
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3 text-sm transition-colors',
                  pickupAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                  effectiveMethod === 'pickup' ? 'border-primary bg-primary-light/40' : 'border-neutral-200',
                )}
              >
                <input
                  type="radio"
                  name="method"
                  disabled={!pickupAvailable}
                  checked={effectiveMethod === 'pickup'}
                  onChange={() => setMethod('pickup')}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="flex items-center gap-1.5 font-medium text-neutral-900">
                    <Store size={15} className="text-primary" /> {t.cart.methodPickup}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {pickupAvailable ? t.cart.methodPickupHint : t.cart.methodPickupNA}
                  </span>
                </span>
              </label>
            </div>

            {effectiveMethod === 'pickup' && (
              <ul className="space-y-1 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
                {groups.map((g) => (
                  <li key={g.shopId} className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>
                      <b className="text-neutral-800">{g.shop?.name ?? t.cart.shop}</b>
                      {g.shop?.pickup_address ? ` — ${g.shop.pickup_address}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t.cart.nameLabel}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t.cart.phoneLabel}</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  placeholder="+998 …"
                  className="input"
                />
              </div>
            </div>
            {effectiveMethod === 'seller' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t.cart.addressLabel}</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  autoComplete="street-address"
                  placeholder={t.cart.addressPlaceholder}
                  className="input"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t.cart.commentLabel}</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="input resize-none" />
            </div>
            <p className="text-xs text-neutral-500">{t.cart.deliveryNote}</p>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                {t.cart.consent}{' '}
                <Link href="/terms" className="text-primary hover:underline" target="_blank">
                  {t.footer.terms}
                </Link>
                {' · '}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  {t.footer.privacy}
                </Link>
              </span>
            </label>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          </form>
        </div>

        {/* Итог */}
        <aside className="h-fit rounded-2xl border border-neutral-200 p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 font-semibold text-neutral-900">{t.cart.yourOrder}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">
                {t.cart.itemsLabel} ({items.length})
              </span>
              <span>{formatPriceLang(subtotal, lang)}</span>
            </div>

            {/* Доставка — по каждому магазину отдельной строкой */}
            {groups.map((g) => {
              const fee = deliveryFee(g, effectiveMethod)
              return (
                <div key={g.shopId} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-neutral-500">
                    <Truck size={15} className="shrink-0" />
                    <span className="truncate">
                      {t.cart.delivery}
                      {groups.length > 1 && g.shop?.name ? ` · ${g.shop.name}` : ''}
                    </span>
                  </span>
                  <span className={cn('shrink-0', fee === 0 ? 'font-semibold text-secondary' : 'text-neutral-700')}>
                    {fee === 0 ? t.cart.free : formatPriceLang(fee, lang)}
                  </span>
                </div>
              )
            })}
            <p className="text-xs text-neutral-400">{t.cart.deliveryEstimate}</p>

            <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-lg">
              <span className="font-medium">{t.cart.total}</span>
              <span className="font-display font-bold text-primary">{formatPriceLang(total, lang)}</span>
            </div>
          </div>

          {willEarn > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-light px-3 py-2.5 text-sm text-primary">
              <Gift size={16} className="shrink-0" />
              {t.cart.willReturn} {formatPointsLang(willEarn, lang)} {t.cart.toCard}
            </div>
          )}

          <button
            type="submit"
            form="checkout"
            disabled={submitting || !consent}
            className="btn-primary mt-5 w-full"
          >
            {submitting ? t.cart.submitting : t.cart.submit}
          </button>
          {!consent && (
            <p className="mt-2 text-xs text-neutral-400">{t.cart.consentHint}</p>
          )}
        </aside>
      </div>
    </div>
  )
}
