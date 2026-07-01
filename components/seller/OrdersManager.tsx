'use client'

import { useState } from 'react'
import type { Order, OrderStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDate } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, ORDER_STATUSES } from '@/lib/orders'
import { cn } from '@/lib/utils'

const NEXT_ACTIONS: { from: OrderStatus; to: OrderStatus; label: string }[] = [
  { from: 'pending', to: 'confirmed', label: 'Подтвердить' },
  { from: 'confirmed', to: 'delivering', label: 'Отправить' },
  { from: 'delivering', to: 'done', label: 'Завершить' },
]

export default function OrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  async function setStatus(order: Order, status: OrderStatus) {
    await supabase.from('orders').update({ status }).eq('id', order.id)
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
  }

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-neutral-900">Заказы</h1>

      {/* Фильтр по статусу */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Все" />
        {ORDER_STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={ORDER_STATUS_LABEL[s]} />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
          Заказов нет
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => {
            const action = NEXT_ACTIONS.find((a) => a.from === o.status)
            return (
              <div key={o.id} className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900">Заказ #{o.id.slice(0, 8)}</p>
                    <p className="text-sm text-neutral-400">
                      {formatDate(o.created_at)} · {o.address || 'без адреса'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatPrice(o.total_price ?? 0)}</span>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-medium', ORDER_STATUS_STYLE[o.status])}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </div>
                </div>
                {o.status !== 'done' && o.status !== 'cancelled' && (
                  <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
                    {action && (
                      <button onClick={() => setStatus(o, action.to)} className="btn-primary !px-4 !py-2 text-sm">
                        {action.label}
                      </button>
                    )}
                    <button
                      onClick={() => setStatus(o, 'cancelled')}
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
