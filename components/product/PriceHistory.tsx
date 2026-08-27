'use client'

import { useMemo } from 'react'
import { LineChart } from 'lucide-react'
import type { PricePoint } from '@/lib/insights'
import { formatPriceLang, formatDayMonth } from '@/lib/format'
import { useLang } from '@/components/LangProvider'
import TrendChart from '@/components/charts/TrendChart'

/** История цены товара: ступенчатый график + мин/макс. */
export default function PriceHistory({ points }: { points: PricePoint[] }) {
  const { lang, t } = useLang()

  const { data, min, max, isBest } = useMemo(() => {
    const values = points.map((p) => p.price)
    const minV = Math.min(...values)
    return {
      data: points.map((p) => ({ label: formatDayMonth(p.date, lang), value: p.price })),
      min: minV,
      max: Math.max(...values),
      isBest: values[values.length - 1] <= minV,
    }
  }, [points, lang])

  if (points.length < 2) return null

  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-neutral-900">
          <LineChart size={18} className="text-primary" />
          {t.insights.priceTitle}
          <span className="text-sm font-normal text-neutral-400">{t.insights.priceDays}</span>
        </h3>
        <div className="flex gap-4 text-sm">
          <span className="text-neutral-500">
            {t.insights.priceMin}: <b className="text-secondary">{formatPriceLang(min, lang)}</b>
          </span>
          <span className="text-neutral-500">
            {t.insights.priceMax}: <b className="text-neutral-700">{formatPriceLang(max, lang)}</b>
          </span>
        </div>
      </div>

      <div className="mt-4">
        <TrendChart data={data} mode="step" format="price" />
      </div>

      {isBest && (
        <p className="mt-3 inline-flex rounded-full bg-secondary-light px-3 py-1 text-sm font-medium text-secondary">
          👍 {t.insights.priceBest}
        </p>
      )}
    </div>
  )
}
