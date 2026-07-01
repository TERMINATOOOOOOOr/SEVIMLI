'use client'

import { useEffect, useState } from 'react'

/** true после монтирования на клиенте — для защиты от hydration mismatch (например, счётчик корзины). */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
