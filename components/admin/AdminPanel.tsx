'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Flag, Store, ListChecks, Eye, EyeOff, Trash2, Download, BadgeCheck, ShieldCheck } from 'lucide-react'
import type { Shop, ShopPlan } from '@/lib/types'
import type { AdminStats, ModerationPost, WaitlistRow } from '@/lib/admin'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

type Tab = 'stats' | 'moderation' | 'shops' | 'waitlist'

const PLANS: ShopPlan[] = ['free', 'pro', 'premium', 'salon_pro']

function csv(rows: string[][]): string {
  const esc = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n')
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-neutral-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  )
}

/** Админка SEVIMLI: сводка, модерация сообщества, магазины, лист ожидания. Права проверяет база (RLS + is_admin()). */
export default function AdminPanel({
  stats,
  posts: initialPosts,
  shops: initialShops,
  waitlist,
}: {
  stats: AdminStats | null
  posts: ModerationPost[]
  shops: Shop[]
  waitlist: WaitlistRow[]
}) {
  const [tab, setTab] = useState<Tab>('stats')
  const [posts, setPosts] = useState(initialPosts)
  const [shops, setShops] = useState(initialShops)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tabs: { id: Tab; label: string; icon: typeof Flag; badge?: number }[] = [
    { id: 'stats', label: 'Сводка', icon: LayoutDashboard },
    { id: 'moderation', label: 'Модерация', icon: Flag, badge: posts.filter((p) => !p.hidden).length },
    { id: 'shops', label: 'Магазины', icon: Store, badge: shops.filter((s) => !s.is_demo && !s.is_verified).length },
    { id: 'waitlist', label: 'Лист ожидания', icon: ListChecks, badge: waitlist.length },
  ]

  async function act(key: string, fn: () => PromiseLike<{ error: { message: string } | null }>, onOk: () => void) {
    setBusy(key)
    setError(null)
    const { error: e } = await fn()
    if (e) setError(e.message)
    else onOk()
    setBusy(null)
  }

  const setHidden = (p: ModerationPost, hidden: boolean) =>
    act(
      'post:' + p.id,
      () => createClient().from('community_posts').update({ hidden }).eq('id', p.id),
      () => setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, hidden } : x))),
    )

  const deletePost = (p: ModerationPost) => {
    if (!window.confirm('Удалить пост навсегда вместе с комментариями?')) return
    void act(
      'post:' + p.id,
      () => createClient().from('community_posts').delete().eq('id', p.id),
      () => setPosts((prev) => prev.filter((x) => x.id !== p.id)),
    )
  }

  const patchShop = (s: Shop, patch: Partial<Shop>) =>
    act(
      'shop:' + s.id,
      () => createClient().from('shops').update(patch).eq('id', s.id),
      () => setShops((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...patch } : x))),
    )

  function exportWaitlist() {
    const content = csv([
      ['Дата', 'Имя', 'Контакт', 'Город', 'Интересы', 'Источник'],
      ...waitlist.map((w) => [w.created_at.slice(0, 16).replace('T', ' '), w.name ?? '', w.contact, w.city ?? '', (w.interests ?? []).join(', '), w.source ?? '']),
    ])
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'sevimli-waitlist.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-neutral-900">Админка SEVIMLI</h1>
      <p className="mt-1 text-sm text-neutral-500">Модерация сообщества, проверка магазинов и заявки из листа ожидания.</p>

      <div className="no-scrollbar mt-6 flex gap-1.5 overflow-x-auto">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              tab === tb.id ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            )}
          >
            <tb.icon size={15} /> {tb.label}
            {tb.badge ? (
              <span className={cn('rounded-full px-1.5 text-xs', tab === tb.id ? 'bg-white/25' : 'bg-white text-neutral-700')}>{tb.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* Сводка */}
      {tab === 'stats' && (
        <div className="mt-6">
          {stats ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Stat label="Пользователи" value={stats.users} hint={`продавцов: ${stats.sellers}`} />
              <Stat label="Магазины" value={stats.shops} hint={`ждут проверки: ${stats.shops_unverified} · демо: ${stats.shops_demo}`} />
              <Stat label="Товары (не демо)" value={stats.products} />
              <Stat label="Заказы: новые" value={stats.orders_pending} hint={`в работе: ${stats.orders_active}`} />
              <Stat label="Заказы: закрыты" value={stats.orders_done} hint={`оборот: ${formatPrice(stats.gmv_done)}`} />
              <Stat label="Посты (не демо)" value={stats.posts} hint={`скрыто: ${stats.posts_hidden} · с жалобами: ${stats.posts_reported}`} />
              <Stat label="Круги Davra" value={stats.circles} />
              <Stat label="Лист ожидания" value={stats.waitlist} />
            </div>
          ) : (
            <p className="text-neutral-400">Сводка недоступна.</p>
          )}
        </div>
      )}

      {/* Модерация */}
      {tab === 'moderation' && (
        <div className="mt-6 space-y-3">
          {posts.length === 0 && (
            <p className="rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-neutral-400">
              Жалоб и скрытых постов нет.
            </p>
          )}
          {posts.map((p) => (
            <div key={p.id} className={cn('rounded-2xl border p-4', p.hidden ? 'border-amber-200 bg-amber-50/40' : 'border-neutral-200')}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-neutral-900">{p.author_name}</span>
                <span className="text-neutral-400">{formatDate(p.created_at)}</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">жалоб: {p.reports_count ?? 0}</span>
                {p.hidden && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">скрыт</span>}
                {p.is_ad && <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">реклама</span>}
                {p.is_demo && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">демо</span>}
                <Link href={`/community/${p.id}`} className="ml-auto text-primary hover:underline" target="_blank">
                  Открыть
                </Link>
              </div>
              <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-neutral-700">{p.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.hidden ? (
                  <button onClick={() => setHidden(p, false)} disabled={busy === 'post:' + p.id} className="btn-outline !py-1.5 text-xs">
                    <Eye size={14} /> Вернуть в ленту
                  </button>
                ) : (
                  <button onClick={() => setHidden(p, true)} disabled={busy === 'post:' + p.id} className="btn-outline !py-1.5 text-xs">
                    <EyeOff size={14} /> Скрыть
                  </button>
                )}
                <button
                  onClick={() => deletePost(p)}
                  disabled={busy === 'post:' + p.id}
                  className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Магазины */}
      {tab === 'shops' && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Магазин</th>
                <th className="px-4 py-3">Город</th>
                <th className="px-4 py-3">Проверен</th>
                <th className="px-4 py-3">Импорт (оригинал)</th>
                <th className="px-4 py-3">Тариф</th>
                <th className="px-4 py-3">Создан</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/shop/${s.id}`} target="_blank" className="font-medium text-neutral-900 hover:text-primary">
                      {s.name}
                    </Link>
                    {s.is_demo && <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">демо</span>}
                    {s.davra_enabled && <span className="ml-2 rounded-full bg-secondary-light px-2 py-0.5 text-xs text-secondary">Davra</span>}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">{s.city}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => patchShop(s, { is_verified: !s.is_verified })}
                      disabled={busy === 'shop:' + s.id}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                        s.is_verified ? 'bg-secondary-light text-secondary' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
                      )}
                    >
                      <BadgeCheck size={13} /> {s.is_verified ? 'да' : 'нет'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => patchShop(s, { is_original_verified: !s.is_original_verified })}
                      disabled={busy === 'shop:' + s.id}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                        s.is_original_verified ? 'bg-primary-light text-primary' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
                      )}
                    >
                      <ShieldCheck size={13} /> {s.is_original_verified ? 'подтверждён' : 'нет'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={s.plan ?? 'free'}
                      onChange={(e) => patchShop(s, { plan: e.target.value as ShopPlan })}
                      disabled={busy === 'shop:' + s.id}
                      className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
                    >
                      {PLANS.map((pl) => (
                        <option key={pl} value={pl}>
                          {pl}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-400">{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Лист ожидания */}
      {tab === 'waitlist' && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">Заявок: {waitlist.length}</p>
            {waitlist.length > 0 && (
              <button onClick={exportWaitlist} className="btn-outline !py-2 text-sm">
                <Download size={15} /> Скачать CSV
              </button>
            )}
          </div>
          {waitlist.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-neutral-400">Пока пусто.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3">Имя</th>
                    <th className="px-4 py-3">Контакт</th>
                    <th className="px-4 py-3">Город</th>
                    <th className="px-4 py-3">Интересы</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((w) => (
                    <tr key={w.id} className="border-t border-neutral-100">
                      <td className="px-4 py-2.5 text-neutral-400">{formatDate(w.created_at)}</td>
                      <td className="px-4 py-2.5 text-neutral-800">{w.name ?? '—'}</td>
                      <td className="px-4 py-2.5 font-medium text-neutral-900">{w.contact}</td>
                      <td className="px-4 py-2.5 text-neutral-600">{w.city ?? '—'}</td>
                      <td className="px-4 py-2.5 text-neutral-600">{(w.interests ?? []).join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
