'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/types'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: Product, qty?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  open: () => void
  close: () => void
  toggle: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
              ),
              isOpen: true,
            }
          }
          return { items: [...state.items, { product, quantity: qty }], isOpen: true }
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.product.id !== id) })),

      updateQuantity: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.product.id !== id)
              : state.items.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i)),
        })),

      clearCart: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: 'sevimli-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

/** Селекторы-помощники (реактивны при использовании через useCart). */
export const selectTotalCount = (s: CartState) =>
  s.items.reduce((n, i) => n + i.quantity, 0)

export const selectTotalPrice = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
