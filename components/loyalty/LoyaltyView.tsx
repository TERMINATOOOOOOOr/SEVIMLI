'use client'

import Link from 'next/link'
import { Check, History, Gift, ArrowRight } from 'lucide-react'
import { LogIn } from 'lucide-react'
import { useLoyalty } from '@/store/loyalty'
import type { MyLoyalty } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/utils'
import { useHasMounted } from '@/lib/hooks'
import { TIERS, tierOf } from '@/lib/loyalty'
import { formatRelativeLang, formatPointsLang } from '@/lib/format'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'
import LoyaltyCard from '@/components/loyalty/LoyaltyCard'
import SoftGlow from '@/components/ui/SoftGlow'
import WeightlessBg from '@/components/ui/Weightless'

/** server — баллы и история с сервера (боевой режим); null в live = гость. Демо — localStorage. */
export default function LoyaltyView({ server = null }: { server?: MyLoyalty | null }) {
  const hasMounted = useHasMounted()
  const { lang, t } = useLang()
  const storePoints = useLoyalty((s) => s.points)
  const storeEntries = useLoyalty((s) => s.entries)
  const live = isSupabaseConfigured()
  const guest = live && !server
  // В live данные приходят с сервера — рендерим сразу, без скелетона
  const mounted = live || hasMounted
  const points = live ? (server?.points ?? 0) : storePoints
  const entries = live ? (server?.entries ?? []) : storeEntries
  /** Серверная причина 'order:<uuid>' → «Заказ на SEVIMLI #ab12cd34». */
  const reasonLabel = (reason: string) =>
    reason.startsWith('order:') ? `${t.cart.pointsReason} #${reason.slice(6, 14)}` : reason

  const current = mounted ? tierOf(points) : null

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SoftGlow variant="gold" />
      <WeightlessBg seed={1} />
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
          <Gift size={16} /> {t.loyalty.badge}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
          {t.loyalty.title}
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-600">{t.loyalty.subtitle}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <LoyaltyCard server={server ? { points: server.points, cardNo: server.cardNo } : null} />

        {/* Уровни */}
        <div>
          <h2 className="mb-4 font-semibold text-neutral-900">{t.loyalty.tiersTitle}</h2>
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const active = current?.id === tier.id
              const reached = mounted && points >= tier.threshold
              const perks = t.loyalty.perks[tier.id] ?? []
              return (
                <div
                  key={tier.id}
                  className={cn(
                    'rounded-2xl border p-4 transition-colors',
                    active ? 'border-primary bg-primary-light/30' : 'border-neutral-200',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('h-3 w-3 rounded-full bg-gradient-to-br', tier.gradient)} />
                    <span className="font-semibold text-neutral-900">{tier.label}</span>
                    <span className="text-sm text-neutral-400">
                      {t.loyalty.from} {tier.threshold.toLocaleString('ru-RU')} {t.loyalty.pointsWord}
                    </span>
                    {active && (
                      <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                        {t.loyalty.yourTier}
                      </span>
                    )}
                    {!active && reached && (
                      <span className="ml-auto text-xs font-medium text-secondary">
                        {t.loyalty.passed}
                      </span>
                    )}
                  </div>
                  <ul className="mt-2.5 space-y-1">
                    {perks.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check size={14} className="shrink-0 text-secondary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* История */}
      <section className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <History size={20} className="text-primary" />
          <h2 className="font-semibold text-neutral-900">{t.loyalty.historyTitle}</h2>
        </div>

        {guest ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-neutral-300 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-neutral-600">{t.loyalty.loginToSee}</p>
            <Link href="/auth?redirect=%2Floyalty" className="btn-primary !py-2.5 text-sm">
              <LogIn size={16} /> {t.community.loginCta}
            </Link>
          </div>
        ) : !mounted ? (
          <div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-12 text-center">
            <Gift size={36} className="text-neutral-300" />
            <p className="text-neutral-400">{t.loyalty.empty}</p>
            <Link href="/korean" className="btn-primary !py-2 text-sm">
              {t.loyalty.goShopping} <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 p-4"
              >
                <div>
                  <p className="font-medium text-neutral-900">{reasonLabel(e.reason)}</p>
                  <p className="text-sm text-neutral-400">{formatRelativeLang(e.created_at, lang)}</p>
                </div>
                <span
                  className={cn(
                    'font-semibold',
                    e.points >= 0 ? 'text-secondary' : 'text-neutral-500',
                  )}
                >
                  {e.points >= 0 ? '+' : ''}
                  {formatPointsLang(e.points, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
