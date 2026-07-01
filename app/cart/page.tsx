'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react'
import { useCart, selectTotalPrice } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/utils'
import { formatPrice } from '@/lib/format'
import { categoryEmoji } from '@/lib/categories'
import Thumb from '@/components/ui/Thumb'

const DELIVERY = 15000

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart } = useCart()
  const subtotal = useCart(selectTotalPrice)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  const total = subtotal + (items.length ? DELIVERY : 0)

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setError(null)
    setSubmitting(true)

    try {
      // Демо-режим: имитируем оформление без базы
      if (!isSupabaseConfigured()) {
        const num = Math.floor(100000 + Math.random() * 900000).toString()
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

      // Группируем товары по магазину — один заказ на магазин
      const byShop = new Map<string, typeof items>()
      for (const it of items) {
        const key = it.product.shop_id
        byShop.set(key, [...(byShop.get(key) ?? []), it])
      }

      let firstOrderId = ''
      for (const [shopId, group] of byShop) {
        const orderTotal = group.reduce((s, it) => s + it.product.price * it.quantity, 0)
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .insert({
            buyer_id: user.id,
            shop_id: shopId,
            status: 'pending',
            total_price: orderTotal + DELIVERY,
            address,
            comment,
          })
          .select('id')
          .single()
        if (orderErr) throw orderErr

        const orderId = (order as { id: string }).id
        if (!firstOrderId) firstOrderId = orderId

        const orderItems = group.map((it) => ({
          order_id: orderId,
          product_id: it.product.id,
          quantity: it.quantity,
          price_at_order: it.product.price,
        }))
        const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
        if (itemsErr) throw itemsErr
      }

      clearCart()
      setOrderNumber(firstOrderId.slice(0, 8))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось оформить заказ')
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
        <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900">Заказ оформлен!</h1>
        <p className="mt-2 text-neutral-500">
          Номер вашего заказа: <span className="font-semibold text-neutral-800">#{orderNumber}</span>
        </p>
        <p className="mt-1 text-sm text-neutral-400">Мы свяжемся с вами для подтверждения.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="btn-outline">
            На главную
          </Link>
          <Link href="/profile" className="btn-primary">
            Мои заказы
          </Link>
        </div>
      </div>
    )
  }

  // Пустая корзина
  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <ShoppingBag size={56} className="text-neutral-300" />
        <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900">Корзина пуста</h1>
        <p className="mt-2 text-neutral-500">Добавьте товары, чтобы оформить заказ.</p>
        <Link href="/catalog/clothes" className="btn-primary mt-6">
          За покупками
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold text-neutral-900">Оформление заказа</h1>

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
                    {product.name}
                  </Link>
                  <span className="text-sm font-semibold text-primary">{formatPrice(product.price)}</span>
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
                  {formatPrice(product.price * quantity)}
                </div>
              </div>
            ))}
          </div>

          <form id="checkout" onSubmit={placeOrder} className="space-y-4 rounded-2xl border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">Данные доставки</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Имя *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Телефон *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+998 …" className="input" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Адрес доставки *</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Комментарий</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="input resize-none" />
            </div>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          </form>
        </div>

        {/* Итог */}
        <aside className="h-fit rounded-2xl border border-neutral-200 p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 font-semibold text-neutral-900">Ваш заказ</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Товары ({items.length})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Доставка</span>
              <span>{formatPrice(DELIVERY)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-lg">
              <span className="font-medium">Итого</span>
              <span className="font-display font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>
          <button type="submit" form="checkout" disabled={submitting} className="btn-primary mt-5 w-full">
            {submitting ? 'Оформляем…' : 'Оформить заказ'}
          </button>
        </aside>
      </div>
    </div>
  )
}
