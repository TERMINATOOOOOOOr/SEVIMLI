import type { OrderStatus } from '@/lib/types'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждён',
  delivering: 'Доставляется',
  done: 'Выполнен',
  cancelled: 'Отменён',
}

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  delivering: 'bg-violet-100 text-violet-700',
  done: 'bg-secondary-light text-secondary',
  cancelled: 'bg-red-100 text-red-600',
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'delivering',
  'done',
  'cancelled',
]
