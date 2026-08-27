'use client'

import { useMemo } from 'react'
import { Scale, BadgeCheck } from 'lucide-react'
import type { MarketOffer } from '@/lib/insights'
import { formatPriceLang, formatDateLang } from '@/lib/format'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'

/**
 * Сравнение цены с рынком: горизонтальные полосы (наша — брендовая,
 * остальные — нейтральные), у каждой строки источник и дата проверки.
 */
export default function MarketCompare({ offers }: { offers: MarketOffer[] }) {
  const { lang, t } = useLang()

  const { maxPrice, saving } = useMemo(() => {
    const max = Math.max(...offers.map((o) => o.price))
    const ours = offers.find((o) => o.isSevimli)?.price ?? max
    return { maxPrice: max, saving: Math.round(((max - ours) / max) * 100) }
  }, [offers])

  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-neutral-900">
        <Scale size={18} className="text-primary" />
        {t.insights.marketTitle}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">{t.insights.marketSubtitle}</p>

      <div className="mt-5 space-y-4">
        {offers.map((o, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span
                className={cn(
                  'flex items-center gap-1.5 font-medium',
                  o.isSevimli ? 'text-primary' : 'text-neutral-700',
                )}
              >
                {o.isSevimli && <BadgeCheck size={15} />}
                {o.source[lang]}
              </span>
              <span className={cn('font-semibold', o.isSevimli ? 'text-primary' : 'text-neutral-800')}>
                {formatPriceLang(o.price, lang)}
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn('h-full rounded-full', o.isSevimli ? 'bg-primary' : 'bg-neutral-300')}
                style={{ width: `${(o.price / maxPrice) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {o.note[lang]} · {t.insights.checked} {formatDateLang(o.checked, lang)}
            </p>
          </div>
        ))}
      </div>

      {saving > 0 && (
        <p className="mt-4 inline-flex rounded-full bg-secondary-light px-3 py-1 text-sm font-medium text-secondary">
          {t.insights.youSave} {saving}%
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-neutral-400">{t.insights.marketDisclaimer}</p>
    </div>
  )
}
