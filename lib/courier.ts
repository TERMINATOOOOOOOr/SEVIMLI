import type { Order, OrderStatus } from '@/lib/types'

/**
 * Демо-логика курьерского кабинета. При подключении базы переедет в таблицы
 * couriers / order_events, а код получения будет генерироваться при сборке заказа.
 */

/** Детерминированный 4-значный код получения заказа (показывается покупательнице). */
export function orderPickupCode(orderId: string): string {
  let h = 2166136261
  for (let i = 0; i < orderId.length; i++) {
    h ^= orderId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return String(1000 + (Math.abs(h) % 9000))
}

/** Эффективный статус заказа с учётом действий курьера (override из стора). */
export function effectiveStatus(
  order: Pick<Order, 'id' | 'status'>,
  overrides: Record<string, OrderStatus>,
): OrderStatus {
  return overrides[order.id] ?? order.status
}

/** Ставка курьера за доставку в демо (для счётчика «заработано сегодня»). */
export const COURIER_FEE = 15000
