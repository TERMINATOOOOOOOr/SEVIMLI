'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Универсальный 3D-наклон за курсором (как у карты лояльности, но легче):
 * без rAF-цикла — прямая запись CSS-переменных + transition, поэтому его
 * можно вешать на десятки карточек сразу. На таче и при reduced-motion
 * полностью инертен. Блик включается пропом glare.
 */
export default function Tilt3D({
  children,
  className,
  max = 7,
  glare = false,
  glareRadius = 'rounded-2xl',
}: {
  children: React.ReactNode
  className?: string
  /** Максимальный наклон в градусах. */
  max?: number
  /** Блик-прожектор за курсором. */
  glare?: boolean
  /** Скругление блика — под скругление содержимого. */
  glareRadius?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    let rect: DOMRect | null = null

    const onEnter = () => {
      rect = el.getBoundingClientRect()
      el.style.setProperty('--t', '0.12s')
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!rect) rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      el.style.setProperty('--try', ((px - 0.5) * 2 * max).toFixed(2) + 'deg')
      el.style.setProperty('--trx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg')
      el.style.setProperty('--gx', (px * 100).toFixed(1) + '%')
      el.style.setProperty('--gy', (py * 100).toFixed(1) + '%')
    }
    const onLeave = () => {
      rect = null
      el.style.setProperty('--t', '0.5s')
      el.style.setProperty('--try', '0deg')
      el.style.setProperty('--trx', '0deg')
    }
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [max])

  return (
    <div ref={ref} className={cn('group/tilt', className)} style={{ perspective: '900px' }}>
      <div
        className="relative h-full"
        style={{
          transform: 'rotateX(var(--trx,0deg)) rotateY(var(--try,0deg))',
          transition: 'transform var(--t,0.3s) ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
        {glare && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100',
              glareRadius,
            )}
            style={{
              background:
                'radial-gradient(320px circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,.4), transparent 65%)',
            }}
          />
        )}
      </div>
    </div>
  )
}
