'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { LogOut, Store, Package, CalendarClock, Settings, ShoppingBag, Gift, ChevronRight, CreditCard } from 'lucide-react'
import type { Profile, Order, Booking } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { orderPickupCode, effectiveStatus } from '@/lib/courier'
import { useCourier } from '@/store/courier'
import { useSession } from '@/store/session'
import { useLoyalty } from '@/store/loyalty'
import { useHasMounted } from '@/lib/hooks'
import { formatPriceLang, formatDateLang, formatPointsLang } from '@/lib/format'
import { orderStatusLabel, ORDER_STATUS_STYLE } from '@/lib/orders'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'
import LoyaltyCard from '@/components/loyalty/LoyaltyCard'

type Tab = 'orders' | 'bookings' | 'loyalty' | 'settings'

interface Props {
  profile: Profile
  email: string
  orders: Order[]
  bookings: Booking[]
  /** true — демо-режим без базы: действия идут в локальную сессию, а не в Supabase. */
  demo?: boolean
}

export default function ProfileView({ profile, email, orders, bookings, demo = false }: Props) {
  const router = useRouter()
  const mounted = useHasMounted()
  const { lang, t: tr } = useLang()
  const demoLogout = useSession((s) => s.logout)
  const demoBecomeSeller = useSession((s) => s.becomeSeller)
  const demoUpdateProfile = useSession((s) => s.updateProfile)
  const storePoints = useLoyalty((s) => s.points)
  // Демо — баллы из localStorage; боевой режим — с сервера (profiles.loyalty_points)
  const points = demo ? storePoints : Number(profile.loyalty_points ?? 0)

  const [tab, setTab] = useState<Tab>('orders')
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [becoming, setBecoming] = useState(false)

  // ВАЖНО: клиент Supabase создаём только внутри обработчиков и только
  // вне демо-режима — создание при рендере роняло страницу на проде.
  const [deleteOk, setDeleteOk] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState<string | null>(null)

  /** Удаление аккаунта: серверная функция delete_my_account (RLS-безопасно), затем выход. */
  async function deleteAccount() {
    if (!deleteOk || deleting) return
    setDeleting(true)
    setDeleteErr(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('delete_my_account')
      if (error) {
        const msg = error.message ?? ''
        setDeleteErr(
          /stand_account/.test(msg)
            ? tr.profile.deleteStand
            : /seller_has_open_orders/.test(msg)
              ? tr.profile.deleteOpenOrders
              : tr.profile.deleteFailed,
        )
        return
      }
      await supabase.auth.signOut().catch(() => {})
      // Жёсткая навигация намеренно: после удаления аккаунта сбрасываем всё клиентское состояние
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/')
    } catch {
      setDeleteErr(tr.profile.deleteFailed)
    } finally {
      setDeleting(false)
    }
  }

  async function signOut() {
    if (demo) {
      demoLogout()
    } else {
      await createClient().auth.signOut()
    }
    router.push('/')
    router.refresh()
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSavedMsg(null)
    if (demo) {
      demoUpdateProfile({ name, phone, city })
    } else {
      await createClient().from('profiles').update({ name, phone, city }).eq('id', profile.id)
    }
    setSaving(false)
    setSavedMsg(tr.profile.saved)
    router.refresh()
  }

  async function becomeSeller() {
    setBecoming(true)
    if (demo) {
      demoBecomeSeller()
    } else {
      // Роль меняется только серверной функцией — прямой update колонки role запрещён триггером
      const { error } = await createClient().rpc('become_seller')
      if (error) {
        setBecoming(false)
        return
      }
    }
    router.push('/seller/dashboard')
    router.refresh()
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'orders', label: tr.profile.myOrders, icon: Package },
    { id: 'bookings', label: tr.profile.myBookings, icon: CalendarClock },
    { id: 'loyalty', label: tr.profile.loyaltyCard, icon: Gift },
    { id: 'settings', label: tr.profile.settings, icon: Settings },
  ]

  const stats = [
    { value: orders.length, label: tr.profile.myOrders, icon: Package, go: 'orders' as Tab },
    { value: bookings.length, label: tr.profile.myBookings, icon: CalendarClock, go: 'bookings' as Tab },
    {
      value: mounted ? formatPointsLang(points, lang) : '…',
      label: tr.loyalty.balance,
      icon: Gift,
      go: 'loyalty' as Tab,
    },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Шапка-карточка */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur">
            {(profile.name || email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold">
              {tr.profile.hi} {profile.name || tr.profile.friend}!
            </h1>
            <p className="truncate text-sm text-white/80">{email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
          >
            <LogOut size={16} /> {tr.profile.signOut}
          </button>
        </div>

        {/* Быстрая статистика */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => setTab(s.go)}
              className="rounded-2xl bg-white/12 p-3 text-left backdrop-blur transition-colors hover:bg-white/20"
            >
              <s.icon size={18} className="opacity-80" />
              <p className="mt-1.5 truncate font-display text-lg font-bold">{s.value}</p>
              <p className="truncate text-xs text-white/75">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Продавец */}
      <div className="mt-5">
        {profile.role === 'seller' || profile.role === 'admin' ? (
          <Link
            href="/seller/dashboard"
            className="flex items-center justify-between rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-3 font-medium text-neutral-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Store size={20} />
              </span>
              {tr.profile.sellerCabinet}
            </span>
            <ChevronRight size={18} className="text-neutral-400" />
          </Link>
        ) : (
          <button
            onClick={becomeSeller}
            disabled={becoming}
            className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-primary disabled:opacity-60"
          >
            <span className="flex items-center gap-3 font-medium text-neutral-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Store size={20} />
              </span>
              {becoming ? tr.profile.opening : tr.profile.becomeSeller}
            </span>
            <ChevronRight size={18} className="text-neutral-400" />
          </button>
        )}
      </div>

      {/* Вкладки */}
      <div className="no-scrollbar mt-6 flex gap-1.5 overflow-x-auto">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              tab === tb.id
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            )}
          >
            <tb.icon size={15} />
            {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'orders' && <OrdersList orders={orders} />}
        {tab === 'bookings' && <BookingsList bookings={bookings} />}
        {tab === 'loyalty' && (
          <div className="max-w-md">
            <LoyaltyCard server={demo ? undefined : { points, cardNo: profile.loyalty_card_no ?? null }} />
            <Link href="/loyalty" className="btn-outline mt-4 w-full !py-2.5 text-sm">
              {tr.profile.tiersHistory}
            </Link>
          </div>
        )}
        {tab === 'settings' && (
          <form onSubmit={saveSettings} className="max-w-md space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                {tr.profile.name}
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                {tr.profile.phone}
              </label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                {tr.profile.city}
              </label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? tr.profile.saving : tr.profile.save}
              </button>
              {savedMsg && <span className="text-sm text-secondary">{savedMsg}</span>}
            </div>

            {/* Удаление аккаунта (в демо-сессии удалять нечего) */}
            <div className={cn('mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-5', demo && 'hidden')}>
              <h3 className="font-semibold text-neutral-900">{tr.profile.dangerZone}</h3>
              <p className="mt-1.5 text-sm text-neutral-600">{tr.profile.deleteText}</p>
              <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={deleteOk}
                  onChange={(e) => setDeleteOk(e.target.checked)}
                  className="h-4 w-4 accent-red-600"
                />
                {tr.profile.deleteConfirm}
              </label>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={!deleteOk || deleting}
                className="mt-3 rounded-full border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? tr.profile.deleting : tr.profile.deleteAccount}
              </button>
              {deleteErr && <p className="mt-2 text-sm text-red-600">{deleteErr}</p>}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function OrdersList({ orders }: { orders: Order[] }) {
  const { lang, t } = useLang()
  const overrides = useCourier((s) => s.overrides)
  if (orders.length === 0)
    return <Empty icon={<ShoppingBag size={40} />} text={t.profile.noOrders} />
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const eff = effectiveStatus(o, overrides)
        return (
          <div key={o.id} className="rounded-2xl border border-neutral-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">
                  {t.profile.order} #{o.id.slice(0, 8)}
                </p>
                <p className="text-sm text-neutral-400">{formatDateLang(o.created_at, lang)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {Number(o.discount_total ?? 0) > 0 && (
                  <span className="rounded-full bg-secondary-light px-2.5 py-1 text-xs font-semibold text-secondary">
                    Davra −{formatPriceLang(Number(o.discount_total), lang)}
                  </span>
                )}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    o.payment_status === 'paid'
                      ? 'bg-secondary-light text-secondary'
                      : o.payment_status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-neutral-100 text-neutral-500',
                  )}
                >
                  {o.payment_status === 'paid'
                    ? t.pay.statusPaid
                    : o.payment_status === 'pending'
                      ? t.pay.statusPending
                      : o.payment_status === 'refunded'
                        ? t.pay.statusRefunded
                        : t.pay.statusUnpaid}
                </span>
                <span className="font-semibold">{formatPriceLang(o.total_price ?? 0, lang)}</span>
                <span
                  className={cn('rounded-full px-3 py-1 text-xs font-medium', ORDER_STATUS_STYLE[eff])}
                >
                  {orderStatusLabel(eff, lang)}
                </span>
              </div>
            </div>

            {/* Оплата: пока не оплачен и заказ жив — даём путь в кассу магазина */}
            {o.payment_status !== 'paid' && eff !== 'cancelled' && (
              <Link href={`/pay/${o.id}`} className="btn-outline mt-3 !py-2 text-sm">
                <CreditCard size={15} /> {t.pay.payNow}
              </Link>
            )}

            {/* Код получения — покупательница называет его курьеру */}
            {eff === 'delivering' && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-primary-light/60 px-4 py-3">
                <span className="font-mono text-xl font-bold tracking-[0.3em] text-primary">
                  {o.pickup_code ?? orderPickupCode(o.id)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800">{t.profile.pickupCode}</p>
                  <p className="text-xs text-neutral-500">{t.profile.pickupHint}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function BookingsList({ bookings }: { bookings: Booking[] }) {
  const { lang, t } = useLang()
  if (bookings.length === 0)
    return <Empty icon={<CalendarClock size={40} />} text={t.profile.noBookings} />
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div
          key={b.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4"
        >
          <div>
            <p className="font-medium text-neutral-900">{b.service_name || t.profile.service}</p>
            <p className="text-sm text-neutral-400">
              {b.shop?.name} · {b.booking_date ? formatDateLang(b.booking_date, lang) : ''}{' '}
              {b.time_slot}
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {b.status}
          </span>
        </div>
      ))}
    </div>
  )
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
      {icon}
      <p>{text}</p>
    </div>
  )
}
