'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrderStatus } from '@/lib/types'

/**
 * Действия курьера в демо-режиме: переопределяем статусы демо-заказов.
 * Эти же статусы видит покупательница в профиле («Доставляется» → «Выполнен»).
 */

interface CourierState {
  /** id заказа → статус, выставленный курьером. */
  overrides: Record<string, OrderStatus>
  /** id заказов, доставленных за текущую демо-смену. */
  deliveredToday: string[]

  pickUp: (orderId: string) => void
  deliver: (orderId: string) => void
  resetShift: () => void
}

export const useCourier = create<CourierState>()(
  persist(
    (set) => ({
      overrides: {},
      deliveredToday: [],

      pickUp: (orderId) =>
        set((s) => ({ overrides: { ...s.overrides, [orderId]: 'delivering' } })),

      deliver: (orderId) =>
        set((s) => ({
          overrides: { ...s.overrides, [orderId]: 'done' },
          deliveredToday: s.deliveredToday.includes(orderId)
            ? s.deliveredToday
            : [...s.deliveredToday, orderId],
        })),

      resetShift: () => set({ overrides: {}, deliveredToday: [] }),
    }),
    { name: 'sevimli-courier', version: 1 },
  ),
)
