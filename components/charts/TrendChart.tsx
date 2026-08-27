'use client'

import { useRef, useState } from 'react'
import { formatPriceLang } from '@/lib/format'
import { useLang } from '@/components/LangProvider'

export interface TrendPoint {
  /** Подпись точки (дата/день). */
  label: string
  value: number
}

interface Props {
  data: TrendPoint[]
  /** step — ступенчатая линия (история цены), area — плавная с заливкой. */
  mode?: 'step' | 'area'
  color?: string
  height?: number
  /** Строковый пресет (страница может быть серверной — функции не сериализуются). */
  format?: 'price' | 'int'
}

/**
 * Лёгкий SVG-график одной серии: тонкая линия 2px, рецессивная сетка,
 * ховер-перекрестие с тултипом. Без внешних библиотек.
 */
export default function TrendChart({
  data,
  mode = 'area',
  color = '#c4507a',
  height = 180,
  format = 'int',
}: Props) {
  const { lang } = useLang()
  const formatValue = (v: number) =>
    format === 'price' ? formatPriceLang(v, lang) : v.toLocaleString('ru-RU')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  if (data.length < 2) return null

  const W = 600
  const H = height
  const PAD_T = 12
  const PAD_B = 20
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  // Немного воздуха сверху и снизу, чтобы линия не липла к краям
  const y = (v: number) => PAD_T + (1 - (v - min) / span) * (H - PAD_T - PAD_B)
  const x = (i: number) => (i / (data.length - 1)) * W

  let path = `M ${x(0)} ${y(values[0])}`
  for (let i = 1; i < data.length; i++) {
    path +=
      mode === 'step'
        ? ` H ${x(i)} V ${y(values[i])}`
        : ` L ${x(i)} ${y(values[i])}`
  }
  const areaPath = `${path} V ${H - PAD_B} H 0 Z`

  // 3 горизонтальные линии сетки
  const grid = [0.25, 0.5, 0.75].map((f) => PAD_T + f * (H - PAD_T - PAD_B))

  function onMove(e: React.PointerEvent) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const fx = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round((fx / W) * (data.length - 1))
    setHover(Math.min(data.length - 1, Math.max(0, idx)))
  }

  const h = hover !== null ? data[hover] : null

  return (
    <div
      ref={wrapRef}
      className="relative"
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" preserveAspectRatio="none" role="img">
        {grid.map((gy) => (
          <line key={gy} x1={0} x2={W} y1={gy} y2={gy} stroke="#f1f1f1" strokeWidth={1} />
        ))}
        {mode === 'area' && <path d={areaPath} fill={color} opacity={0.08} />}
        <path d={path} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {h && (
          <>
            <line
              x1={x(hover!)}
              x2={x(hover!)}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="#d4d4d4"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={x(hover!)} cy={y(h.value)} r={4} fill={color} stroke="#fff" strokeWidth={2} />
          </>
        )}
      </svg>

      {/* Подписи краёв оси X */}
      <div className="mt-1 flex justify-between text-xs text-neutral-400">
        <span>{data[0].label}</span>
        <span>{data[Math.floor(data.length / 2)].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>

      {/* Тултип */}
      {h && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(hover! / (data.length - 1)) * 100}%` }}
        >
          <span className="font-semibold">{formatValue(h.value)}</span>
          <span className="ml-1.5 text-neutral-400">{h.label}</span>
        </div>
      )}
    </div>
  )
}
