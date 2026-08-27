'use client'

import { useMemo, useState } from 'react'
import {
  Bike,
  Package,
  Phone,
  MapPin,
  CheckCircle2,
  KeyRound,
  Wallet,
  RotateCcw,
  MessageSquareText,
} from 'lucide-react'
import { demoOrders, demoShops } from '@/lib/demo'
import { orderPickupCode, effectiveStatus, COURIER_FEE } from '@/lib/courier'
import { useCourier } from '@/store/courier'
import { useHasMounted } from '@/lib/hooks'
import { formatPriceLang } from '@/lib/format'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'

export default function CourierApp() {
  const mounted = useHasMounted()
  const { lang, t } = useLang()
  const overrides = useCourier((s) => s.overrides)
  const deliveredToday = useCourier((s) => s.deliveredToday)
  const pickUp = useCourier((s) => s.pickUp)
  const deliver = useCourier((s) => s.deliver)
  const resetShift = useCourier((s) => s.resetShift)

  const [codeFor, setCodeFor] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [justDone, setJustDone] = useState<string | null>(null)

  const shopName = useMemo(() => {
    const map = new Map(demoShops.map((s) => [s.id, s.name]))
    return (id: string | null) => (id ? (map.get(id) ?? '') : '')
  }, [])

  const { active, doneList } = useMemo(() => {
    const withStatus = demoOrders.map((o) => ({ ...o, eff: effectiveStatus(o, overrides) }))
    return {
      // Сначала «в пути», затем «забрать» — как в курьерских приложениях
      active: withStatus
        .filter((o) => o.eff === 'confirmed' || o.eff === 'delivering')
        .sort((a, b) => (a.eff === 'delivering' ? -1 : 1) - (b.eff === 'delivering' ? -1 : 1)),
      doneList: withStatus.filter((o) => deliveredToday.includes(o.id)),
    }
  }, [overrides, deliveredToday])

  if (!mounted) {
    return <div className="h-96 animate-pulse rounded-3xl bg-neutral-100" />
  }

  function submitCode(orderId: string) {
    if (code.trim() === orderPickupCode(orderId)) {
      deliver(orderId)
      setCodeFor(null)
      setCode('')
      setError(false)
      setJustDone(orderId)
      setTimeout(() => setJustDone(null), 3000)
    } else {
      setError(true)
    }
  }

  return (
    <div>
      {/* Шапка смены */}
      <div className="rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-700 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
            <Bike size={26} />
          </div>
          <div className="flex-1">
            <p className="font-display text-xl font-bold">Aziz K.</p>
            <p className="flex items-center gap-1.5 text-sm text-white/70">
              <span className="h-2 w-2 rounded-full bg-secondary" /> {t.courier.shift}
            </p>
          </div>
          <button
            onClick={resetShift}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20"
          >
            <RotateCcw size={13} /> {t.courier.resetShift}
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <Package size={18} className="opacity-70" />
            <p className="mt-1 font-display text-2xl font-bold">{deliveredToday.length}</p>
            <p className="text-xs text-white/60">{t.courier.todayDeliveries}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <Wallet size={18} className="opacity-70" />
            <p className="mt-1 font-display text-2xl font-bold">
              {formatPriceLang(deliveredToday.length * COURIER_FEE, lang)}
            </p>
            <p className="text-xs text-white/60">{t.courier.earned}</p>
          </div>
        </div>
      </div>

      {/* Активные доставки */}
      <h2 className="mb-3 mt-8 font-semibold text-neutral-900">{t.courier.active}</h2>
      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-14 text-center text-neutral-400">
          <CheckCircle2 size={40} className="text-secondary" />
          <p>{t.courier.noOrders}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((o) => (
            <div key={o.id} className="rounded-2xl border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-neutral-900">
                  {t.courier.order} #{o.id.slice(1, 8)}
                  <span className="ml-2 text-sm font-normal text-neutral-400">
                    {shopName(o.shop_id)}
                  </span>
                </p>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    o.eff === 'delivering'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-blue-100 text-blue-700',
                  )}
                >
                  {o.eff === 'delivering' ? t.courier.inTransit : t.courier.toPickup}
                </span>
              </div>

              <p className="mt-2 flex items-start gap-1.5 text-sm text-neutral-600">
                <MapPin size={15} className="mt-0.5 shrink-0 text-neutral-400" />
                {o.address}
              </p>
              {o.comment && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-amber-700">
                  <MessageSquareText size={15} className="mt-0.5 shrink-0" />
                  {o.comment}
                </p>
              )}
              <p className="mt-2 font-display text-lg font-bold text-neutral-900">
                {formatPriceLang(o.total_price ?? 0, lang)}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <a href="tel:+998901234567" className="btn-outline !px-4 !py-2 text-sm">
                  <Phone size={15} /> {t.courier.call}
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(o.address ?? 'Tashkent')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline !px-4 !py-2 text-sm"
                >
                  <MapPin size={15} /> {t.courier.route}
                </a>
                {o.eff === 'confirmed' ? (
                  <button onClick={() => pickUp(o.id)} className="btn-primary !px-4 !py-2 text-sm">
                    <Package size={15} /> {t.courier.pickedUp}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCodeFor(codeFor === o.id ? null : o.id)
                      setCode('')
                      setError(false)
                    }}
                    className="btn-primary !px-4 !py-2 text-sm"
                  >
                    <KeyRound size={15} /> {t.courier.handOver}
                  </button>
                )}
              </div>

              {/* Ввод кода получения */}
              {codeFor === o.id && (
                <div className="mt-4 rounded-xl bg-primary-light/50 p-4">
                  <p className="text-sm font-medium text-neutral-800">{t.courier.enterCode}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{t.courier.codeHint}</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
                        setError(false)
                      }}
                      inputMode="numeric"
                      placeholder="••••"
                      className="input w-32 text-center font-mono text-xl tracking-[0.4em]"
                    />
                    <button
                      onClick={() => submitCode(o.id)}
                      disabled={code.length !== 4}
                      className="btn-primary flex-1 !py-2.5 text-sm"
                    >
                      {t.courier.confirm}
                    </button>
                  </div>
                  {error && <p className="mt-2 text-sm text-red-600">{t.courier.wrongCode}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Успех */}
      {justDone && (
        <div className="fixed inset-x-4 bottom-20 z-50 flex items-center gap-2 rounded-2xl bg-secondary p-4 font-medium text-white shadow-xl md:bottom-6 md:left-auto md:right-6 md:w-96">
          <CheckCircle2 size={20} /> {t.courier.deliveredOk}
        </div>
      )}

      {/* Доставлено сегодня */}
      {doneList.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-semibold text-neutral-900">{t.courier.historyToday}</h2>
          <div className="space-y-2">
            {doneList.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <p className="text-sm font-medium text-neutral-700">
                  {t.courier.order} #{o.id.slice(1, 8)} · {shopName(o.shop_id)}
                </p>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-secondary">
                  <CheckCircle2 size={16} /> +{formatPriceLang(COURIER_FEE, lang)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
