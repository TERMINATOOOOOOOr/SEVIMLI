'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * «Davra» — постоянный круг подруг с общей корзиной (демо-режим).
 * Каждая участница добавляет свои товары; при общей сумме от порога
 * скидка достаётся каждой; доставка одна на всех. Оплата — каждая
 * платит свою часть (никаких «скинь мне на карту»).
 *
 * При подключении базы переедет в таблицы circles / circle_members /
 * circle_cart_items, а приглашение станет серверной ссылкой.
 */

/** Порог общей суммы, после которого скидка достаётся каждой. */
export const DAVRA_THRESHOLD = 500_000
/** Скидка каждой участнице при достижении порога. */
export const DAVRA_DISCOUNT = 0.1
/** Метка создательницы круга (локализуется через personName). */
export const DAVRA_ME = 'Вы'

export interface DavraItem {
  productId: string
  qty: number
  /** Имя участницы, добавившей позицию. */
  addedBy: string
}

interface Circle {
  id: string
  name: string
  createdAt: number
  /** Имена участниц; первая — создательница (DAVRA_ME). */
  members: string[]
}

interface DavraState {
  circle: Circle | null
  items: DavraItem[]

  createCircle: (name: string) => void
  addMember: (name: string) => void
  addItem: (productId: string, addedBy: string) => void
  changeQty: (productId: string, addedBy: string, delta: number) => void
  removeItem: (productId: string, addedBy: string) => void
  dissolve: () => void
}

export const useDavra = create<DavraState>()(
  persist(
    (set) => ({
      circle: null,
      items: [],

      createCircle: (name) =>
        set({
          circle: {
            id: 'd' + Date.now().toString(36),
            name: name.trim() || 'Davra',
            createdAt: Date.now(),
            members: [DAVRA_ME],
          },
          items: [],
        }),

      addMember: (name) =>
        set((s) => {
          if (!s.circle || s.circle.members.includes(name) || s.circle.members.length >= 6) return s
          return { circle: { ...s.circle, members: [...s.circle.members, name] } }
        }),

      addItem: (productId, addedBy) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === productId && i.addedBy === addedBy)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i === existing ? { ...i, qty: i.qty + 1 } : i,
              ),
            }
          }
          return { items: [...s.items, { productId, qty: 1, addedBy }] }
        }),

      changeQty: (productId, addedBy, delta) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.productId === productId && i.addedBy === addedBy
                ? { ...i, qty: Math.max(0, i.qty + delta) }
                : i,
            )
            .filter((i) => i.qty > 0),
        })),

      removeItem: (productId, addedBy) =>
        set((s) => ({
          items: s.items.filter((i) => !(i.productId === productId && i.addedBy === addedBy)),
        })),

      dissolve: () => set({ circle: null, items: [] }),
    }),
    { name: 'sevimli-davra', version: 1 },
  ),
)

/** Цена позиции с учётом скидки круга. */
export function davraPrice(price: number, discountActive: boolean): number {
  if (!discountActive) return price
  // как davra_price() в базе: скидка округляется вниз до 100 сум — цена не выше исходной и не 0
  return price - Math.floor((price * DAVRA_DISCOUNT) / 100) * 100
}
