'use client'

import { useEffect } from 'react'

/** Регистрирует service worker (только в проде — в dev мешает hot reload). */
export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* офлайн-кэш — прогрессивное улучшение, падение не критично */
    })
  }, [])

  return null
}
