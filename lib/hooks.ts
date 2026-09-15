'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * true после монтирования на клиенте — для защиты от hydration mismatch
 * (например, счётчик корзины из localStorage). Реализовано через
 * useSyncExternalStore: серверный снимок false, клиентский true — без setState в эффекте.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}
