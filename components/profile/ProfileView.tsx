'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { LogOut, Store, Package, CalendarClock, Settings, ShoppingBag } from 'lucide-react'
import type { Profile, Order, Booking } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDate } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '@/lib/orders'
import { cn } from '@/lib/utils'

type Tab = 'orders' | 'bookings' | 'settings'

interface Props {
  profile: Profile
  email: string
  orders: Order[]
  bookings: Booking[]
}

export default function ProfileView({ profile, email, orders, bookings }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('orders')
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [becoming, setBecoming] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSavedMsg(null)
    await supabase.from('profiles').update({ name, phone, city }).eq('id', profile.id)
    setSaving(false)
    setSavedMsg('Сохранено')
    router.refresh()
  }

  async function becomeSeller() {
    setBecoming(true)
    await supabase.from('profiles').update({ role: 'seller' }).eq('id', profile.id)
    router.push('/seller/dashboard')
    router.refresh()
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'orders', label: 'Мои заказы', icon: Package },
    { id: 'bookings', label: 'Мои записи', icon: CalendarClock },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Шапка */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-xl font-bold text-primary">
            {(profile.name || email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-900">
              Привет, {profile.name || 'друг'}!
            </h1>
            <p className="text-sm text-neutral-500">{email}</p>
          </div>
        </div>
        <button onClick={signOut} className="btn-ghost text-neutral-600">
          <LogOut size={18} /> Выйти
        </button>
      </div>

      {/* Продавец */}
      <div className="mt-6">
        {profile.role === 'seller' || profile.role === 'admin' ? (
          <Link href="/seller/dashboard" className="btn-primary">
            <Store size={18} /> Кабинет продавца
          </Link>
        ) : (
          <button onClick={becomeSeller} disabled={becoming} className="btn-outline">
            <Store size={18} /> {becoming ? 'Открываем…' : 'Стать продавцом'}
          </button>
        )}
      </div>

      {/* Вкладки */}
      <div className="mt-8 flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800',
            )}
          >
            <t.icon size={16} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'orders' && <OrdersList orders={orders} />}
        {tab === 'bookings' && <BookingsList bookings={bookings} />}
        {tab === 'settings' && (
          <form onSubmit={saveSettings} className="max-w-md space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Имя</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Телефон</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Город</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
              {savedMsg && <span className="text-sm text-secondary">{savedMsg}</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function OrdersList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) return <Empty icon={<ShoppingBag size={40} />} text="У вас пока нет заказов" />
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4">
          <div>
            <p className="font-medium text-neutral-900">Заказ #{o.id.slice(0, 8)}</p>
            <p className="text-sm text-neutral-400">{formatDate(o.created_at)}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold">{formatPrice(o.total_price ?? 0)}</span>
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', ORDER_STATUS_STYLE[o.status])}>
              {ORDER_STATUS_LABEL[o.status]}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function BookingsList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) return <Empty icon={<CalendarClock size={40} />} text="У вас нет записей" />
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4">
          <div>
            <p className="font-medium text-neutral-900">{b.service_name || 'Услуга'}</p>
            <p className="text-sm text-neutral-400">
              {b.shop?.name} · {b.booking_date ? formatDate(b.booking_date) : ''} {b.time_slot}
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
