'use client'

import { useState } from 'react'
import { Phone, MapPin, Store, Truck, KeyRound } from 'lucide-react'
import type { Order, OrderStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDate } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, ORDER_STATUSES } from '@/lib/orders'
import { cn } from '@/lib/utils'

const NEXT_ACTIONS: { from: OrderStatus; to: OrderStatus; label: string }[] = [
  { from: 'pending', to: 'confirmed', label: 'Подтвердить' },
  { from: 'confirmed', to: 'delivering', label: 'Передать в доставку' },
]

const METHOD_LABEL: Record<string, string> = {
  seller: 'Доставка магазином',
  pickup: 'Самовывоз',
  partner: 'Партнёрская доставка',
  point: 'Пункт выдачи',
}

/**
 * Заказы магазина. Продавец видит состав заказа и контакты покупательницы,
 * подтверждает и передаёт в доставку; закрыть заказ можно только по 4-значному
 * коду, который покупательница видит в профиле (complete_order на сервере).
 */
export default function OrdersManager({
  initialOrders,
  demo = false,
}: {
  initialOrders: Order[]
  /** База не подключена — статусы меняются только локально. */
  demo?: boolean
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function patch(id: string, data: Partial<Order>) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)))
  }

  async function setStatus(order: Order, status: OrderStatus) {
    setError(null)
    if (demo) {
      patch(order.id, { status })
      return
    }
    setBusy(order.id)
    try {
      const { error: err } = await createClient().from('orders').update({ status }).eq('id', order.id)
      if (err) throw err
      patch(order.id, { status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить статус')
    } finally {
      setBusy(null)
    }
  }

  async function complete(order: Order) {
    setError(null)
    const code = (codes[order.id] ?? '').replace(/\D/g, '')
    if (code.length !== 4) {
      setError('Введите 4-значный код получения, который покупательница видит в профиле.')
      return
    }
    if (demo) {
      patch(order.id, { status: 'done', delivered_at: new Date().toISOString() })
      return
    }
    setBusy(order.id)
    try {
      const { data, error: err } = await createClient().rpc('complete_order', {
        p_order: order.id,
        p_code: code,
      })
      if (err) throw err
      if (data === true) {
        patch(order.id, { status: 'done', delivered_at: new Date().toISOString() })
      } else {
        setError('Код не совпал. Попросите покупательницу назвать код из профиля.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось закрыть заказ')
    } finally {
      setBusy(null)
    }
  }

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-neutral-900">Заказы</h1>

      {demo && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Демо-режим: заказы — примеры, изменения статусов не сохраняются.
        </p>
      )}

      {/* Фильтр по статусу */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Все" />
        {ORDER_STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={ORDER_STATUS_LABEL[s]} />
        ))}
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
          Заказов нет
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => {
            const action = NEXT_ACTIONS.find((a) => a.from === o.status)
            const open = o.status !== 'done' && o.status !== 'cancelled'
            const items = o.items ?? []
            return (
              <div key={o.id} className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900">Заказ #{o.id.slice(0, 8)}</p>
                    <p className="text-sm text-neutral-400">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {o.circle_id && (
                      <span
                        className="rounded-full bg-secondary-light px-2.5 py-1 text-xs font-semibold text-secondary"
                        title="Заказ из круга Davra: цены уже со скидкой круга −10%"
                      >
                        Davra{o.discount_total ? ` · −${formatPrice(o.discount_total)}` : ''}
                      </span>
                    )}
                    <span className="font-semibold">{formatPrice(o.total_price ?? 0)}</span>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-medium', ORDER_STATUS_STYLE[o.status])}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </div>
                </div>

                {/* Контакты и доставка */}
                <div className="mt-3 grid gap-1.5 text-sm text-neutral-600 sm:grid-cols-2">
                  <p className="flex items-center gap-1.5">
                    <Phone size={14} className="shrink-0 text-primary" />
                    {o.recipient_name || '—'}
                    {o.recipient_phone ? (
                      <a href={`tel:${o.recipient_phone.replace(/\s/g, '')}`} className="text-primary hover:underline">
                        {o.recipient_phone}
                      </a>
                    ) : (
                      <span className="text-neutral-400">телефон не указан</span>
                    )}
                  </p>
                  <p className="flex items-center gap-1.5">
                    {o.delivery_method === 'pickup' ? (
                      <Store size={14} className="shrink-0 text-primary" />
                    ) : (
                      <Truck size={14} className="shrink-0 text-primary" />
                    )}
                    {METHOD_LABEL[o.delivery_method ?? 'seller']}
                    {o.delivery_fee ? ` · ${formatPrice(o.delivery_fee)}` : ' · бесплатно'}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <MapPin size={14} className="shrink-0 text-primary" />
                    {o.address || 'без адреса'}
                  </p>
                  {o.comment && <p className="sm:col-span-2 text-neutral-500">«{o.comment}»</p>}
                </div>

                {/* Состав заказа */}
                {items.length > 0 && (
                  <ul className="mt-3 divide-y divide-neutral-100 rounded-xl bg-neutral-50 text-sm">
                    {items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="min-w-0 truncate text-neutral-800">
                          {it.product?.name ?? 'Товар'} <span className="text-neutral-400">× {it.quantity}</span>
                        </span>
                        <span className="shrink-0 font-medium">{formatPrice(it.price_at_order * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {open && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                    {action && (
                      <button
                        onClick={() => setStatus(o, action.to)}
                        disabled={busy === o.id}
                        className="btn-primary !px-4 !py-2 text-sm"
                      >
                        {action.label}
                      </button>
                    )}
                    {o.status === 'delivering' && (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <KeyRound size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input
                            value={codes[o.id] ?? ''}
                            onChange={(e) => setCodes((c) => ({ ...c, [o.id]: e.target.value }))}
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="Код"
                            className="input !w-28 !py-2 pl-9 font-mono tracking-[0.3em]"
                          />
                        </div>
                        <button onClick={() => complete(o)} disabled={busy === o.id} className="btn-primary !px-4 !py-2 text-sm">
                          Завершить по коду
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setStatus(o, 'cancelled')}
                      disabled={busy === o.id}
                      className="btn-outline !px-4 !py-2 text-sm hover:!border-red-400 hover:!text-red-500"
                    >
                      Отменить
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active ? 'border-primary bg-primary text-white' : 'border-neutral-200 text-neutral-600 hover:border-primary',
      )}
    >
      {label}
    </button>
  )
}
