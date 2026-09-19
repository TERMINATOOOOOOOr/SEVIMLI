'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/types'

export interface CartItem {
  product: Product
  quantity: number
}

/** Позиции пришли из круга Davra: id круга уходит в create_order (скидку считает сервер), discount — оценка для UI. */
export interface CartCircle {
  id: string
  name: string
  /** Оценка для UI: активна ли скидка круга (решает сервер при оформлении). */
  discount: boolean
  /** Товары, пришедшие из круга → сколько штук из них идёт со скидкой (магазин участвует в Davra). */
  discounted: Record<string, number>
  productIds: string[]
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  circle: CartCircle | null
  setCircle: (c: CartCircle | null) => void
  /** «Оформить свою часть»: количество ЗАДАЁТСЯ (повторный клик не удваивает), цена товара не подменяется. */
  setCircleItems: (items: { product: Product; qty: number }[], circle: CartCircle) => void
  /** openDrawer=false — тихо добавить (например, «Купить сейчас» сразу ведёт на оформление). */
  addItem: (product: Product, qty?: number, openDrawer?: boolean) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  open: () => void
  close: () => void
  toggle: () => void
}

/** Круг остаётся в корзине, пока в ней лежит хоть один товар из него — иначе следующий заказ ушёл бы с p_circle. */
function keepCircle(circle: CartCircle | null, items: CartItem[]): CartCircle | null {
  if (!circle) return null
  return items.some((i) => circle.productIds.includes(i.product.id)) ? circle : null
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      circle: null,
      setCircle: (circle) => set({ circle }),
      setCircleItems: (list, circle) =>
        set((state) => {
          const items = [...state.items]
          for (const { product, qty } of list) {
            const idx = items.findIndex((i) => i.product.id === product.id)
            if (idx >= 0) items[idx] = { product, quantity: qty }
            else items.push({ product, quantity: qty })
          }
          return { items, circle }
        }),

      addItem: (product, qty = 1, openDrawer = true) =>
        set((state) => {
          const isOpen = openDrawer ? true : state.isOpen
          const existing = state.items.find((i) => i.product.id === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
              ),
              isOpen,
            }
          }
          return { items: [...state.items, { product, quantity: qty }], isOpen }
        }),

      removeItem: (id) =>
        set((state) => {
          const items = state.items.filter((i) => i.product.id !== id)
          return { items, circle: keepCircle(state.circle, items) }
        }),

      updateQuantity: (id, qty) =>
        set((state) => {
          const items =
            qty <= 0
              ? state.items.filter((i) => i.product.id !== id)
              : state.items.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i))
          return { items, circle: keepCircle(state.circle, items) }
        }),

      clearCart: () => set({ items: [], circle: null }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: 'sevimli-cart',
      partialize: (state) => ({ items: state.items, circle: state.circle }),
    },
  ),
)

/** Селекторы-помощники (реактивны при использовании через useCart). */
export const selectTotalCount = (s: CartState) =>
  s.items.reduce((n, i) => n + i.quantity, 0)

export const selectTotalPrice = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
