'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Share2,
  Plus,
  Minus,
  Trash2,
  Truck,
  Sparkles,
  ShoppingBag,
  Check,
  Crown,
  LogOut,
  Pencil,
  RefreshCw,
  X,
} from 'lucide-react'
import type { Circle, CircleState, Product, Viewer } from '@/lib/types'
import { DAVRA_THRESHOLD, davraPrice } from '@/store/davra'
import { useCart } from '@/store/cart'
import * as live from '@/lib/davra-live'
import { formatPriceLang } from '@/lib/format'
import { productName } from '@/lib/product-i18n'
import { categoryEmoji } from '@/lib/categories'
import { useLang } from '@/components/LangProvider'
import { useHasMounted } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import Thumb from '@/components/ui/Thumb'
import Tilt3D from '@/components/ui/Tilt3D'

interface Props {
  circles: Circle[]
  /** Прогресс кругов с сервера: корзина + уже оформленные заказы круга. */
  states: Record<string, CircleState>
  viewer: Viewer
  products: Product[]
  initialActiveId?: string | null
}

const POLL_MS = 20_000

/**
 * Davra в боевом режиме: круги из Supabase. Создательница переименовывает, удаляет участниц и
 * распускает круг; участница выходит сама; у каждой свои позиции в общей корзине. Скидку −10%
 * считает сервер в заказе (create_order с p_circle): порог — корзина + уже оформленное кругом,
 * скидка — только на товары магазинов, включивших Davra. Здесь — честное отображение того же.
 */
export default function DavraLive({ circles: initial, states: initialStates, viewer, products, initialActiveId }: Props) {
  const router = useRouter()
  const { lang, t } = useLang()
  const mounted = useHasMounted()
  const setCircleItems = useCart((s) => s.setCircleItems)

  const [circles, setCircles] = useState<Circle[]>(initial)
  const [states, setStates] = useState<Record<string, CircleState>>(initialStates)
  const [activeId, setActiveId] = useState<string | null>(
    initial.find((c) => c.id === initialActiveId)?.id ?? initial[0]?.id ?? null,
  )
  const [creating, setCreating] = useState(initial.length === 0)
  const [name, setName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)

  const circle = circles.find((c) => c.id === activeId) ?? null
  const isOwner = Boolean(circle && circle.owner_id === viewer.id)
  const fallbackName = t.davra.memberFallback
  const memberName = (c: Circle, uid: string) =>
    c.members.find((x) => x.user_id === uid)?.profile?.name?.trim() || fallbackName

  const productById = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  /** Все позиции круга; недоступный товар (удалён/снят с продажи) показываем строкой, чтобы его можно было убрать. */
  const rows = useMemo(
    () =>
      (circle?.items ?? []).map((i) => {
        const product = i.product ?? productById.get(i.product_id) ?? null
        return { ...i, product, available: Boolean(product && product.is_active !== false) }
      }),
    [circle, productById],
  )
  const liveRows = rows.filter((r): r is typeof r & { product: Product } => r.available && Boolean(r.product))
  const itemsTotal = liveRows.reduce((s, r) => s + r.product.price * r.qty, 0)
  const state = circle ? states[circle.id] : undefined
  const orderedTotal = state?.ordered_total ?? 0
  const threshold = state?.threshold ?? DAVRA_THRESHOLD
  const progressSum = itemsTotal + orderedTotal
  const discountActive = progressSum >= threshold
  const progress = Math.min(100, Math.round((progressSum / threshold) * 100))
  /** Скидку даёт магазин: только товары магазинов с davra_enabled. */
  const discounted = (p: Product) => discountActive && Boolean(p.shop?.davra_enabled)
  const unitPrice = (p: Product) => davraPrice(p.price, discounted(p))
  const perMember = (circle?.members ?? []).map((m) => ({
    member: m,
    subtotal: liveRows.filter((r) => r.user_id === m.user_id).reduce((s, r) => s + unitPrice(r.product) * r.qty, 0),
  }))
  const myRows = liveRows.filter((r) => r.user_id === viewer.id)
  const myPart = perMember.find((p) => p.member.user_id === viewer.id)?.subtotal ?? 0
  const inCircle = new Set(rows.map((r) => r.product_id))
  const suggestions = products.filter((p) => !inCircle.has(p.id)).slice(0, 8)

  /** Свежие круги и состояния одним заходом (после мутаций, по таймеру и при возврате на вкладку). */
  const reload = useCallback(async () => {
    const list = await live.fetchMyCircles()
    const st = await live.fetchCircleStates(list.map((c) => c.id))
    setCircles(list)
    setStates(st)
    setActiveId((cur) => (cur && list.some((c) => c.id === cur) ? cur : (list[0]?.id ?? null)))
    if (list.length === 0) setCreating(true)
  }, [])

  function fail(e: unknown) {
    const err = live.mapDavraError(e)
    if (err.code === 'auth') {
      router.push(`/auth?redirect=${encodeURIComponent('/davra')}`)
      return
    }
    // Состояние протухло (удалили из круга, круг распущен, кто-то опередил) — показываем актуальное
    if (err.code === 'forbidden' || err.code === 'not_found') void reload().catch(() => {})
    setError(
      err.code === 'full'
        ? t.davra.joinFull
        : err.code === 'limit'
          ? t.davra.limitReached
          : err.code === 'forbidden' || err.code === 'not_found'
            ? t.davra.staleState
            : t.davra.actionFailed,
    )
  }

  async function run(fn: () => Promise<void>) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      fail(e)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  // Без realtime: тихое обновление раз в 20 с и при возврате на вкладку
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible' || busyRef.current) return
      void reload().catch(() => {})
    }
    const id = window.setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [reload])

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault()
    run(async () => {
      const id = await live.createCircle(name)
      await reload()
      setActiveId(id)
      setCreating(false)
      setName('')
    })
  }

  const onRename = (e: React.FormEvent) => {
    e.preventDefault()
    if (!circle || !newName.trim()) return
    const id = circle.id
    run(async () => {
      await live.renameCircle(id, newName)
      await reload()
      setRenaming(false)
    })
  }

  const onDissolve = () => {
    if (!circle || !window.confirm(t.davra.dissolveConfirm)) return
    const id = circle.id
    run(async () => {
      await live.dissolveCircle(id)
      await reload()
    })
  }

  const onLeave = () => {
    if (!circle || !window.confirm(t.davra.leaveConfirm)) return
    const id = circle.id
    run(async () => {
      await live.leaveCircle(id)
      await reload()
    })
  }

  const onRemoveMember = (uid: string) => {
    if (!circle || !window.confirm(t.davra.removeConfirm)) return
    const id = circle.id
    run(async () => {
      await live.removeMember(id, uid)
      await reload()
    })
  }

  const onAddItem = (productId: string) => {
    if (!circle) return
    const id = circle.id
    run(async () => {
      await live.addCircleItem(id, productId, viewer.id)
      await reload()
      setJustAdded(productId)
      setTimeout(() => setJustAdded(null), 1200)
    })
  }

  const onQty = (itemId: string, qty: number) => run(async () => {
    await live.setCircleItemQty(itemId, qty)
    await reload()
  })

  const onRemoveItem = (itemId: string) => run(async () => {
    await live.removeCircleItem(itemId)
    await reload()
  })

  async function share() {
    if (!circle) return
    const url = `${window.location.origin}/davra/join/${circle.invite_code}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `SEVIMLI Davra: ${circle.name}`, url })
        return
      } catch (e) {
        // Закрыли системное окно «Поделиться» — это не «скопировано»
        if ((e as { name?: string })?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* клипборд недоступен */
    }
  }

  /**
   * Мои позиции → обычная корзина → оформление с p_circle. Количество задаётся (повторный клик не удваивает),
   * цена товара не подменяется: скидку показывает корзина по тем же правилам, а считает сервер.
   */
  function checkoutMy() {
    if (!circle || myRows.length === 0) return
    const discountedQty: Record<string, number> = {}
    for (const r of myRows) if (discounted(r.product)) discountedQty[r.product.id] = r.qty
    setCircleItems(
      myRows.map((r) => ({ product: r.product, qty: r.qty })),
      {
        id: circle.id,
        name: circle.name,
        discount: discountActive,
        discounted: discountedQty,
        productIds: myRows.map((r) => r.product.id),
      },
    )
    router.push('/cart')
  }

  const inviteUrl = circle ? `/davra/join/${circle.invite_code}` : ''

  return (
    <div>
      {/* Мои круги */}
      {circles.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm font-medium text-neutral-700">{t.davra.myCircles}:</span>
          {circles.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveId(c.id)
                setCreating(false)
                setRenaming(false)
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                c.id === activeId && !creating ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              )}
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={() => setCreating((v) => !v)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              creating ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            )}
          >
            {t.davra.newCircle}
          </button>
        </div>
      )}

      {error && (
        <button type="button" className="mb-4 block w-full rounded-xl bg-red-50 px-3 py-2 text-left text-sm text-red-600" onClick={() => setError(null)}>
          {error}
        </button>
      )}

      {/* Создание */}
      {(creating || !circle) && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-gradient-to-br from-primary-light via-white to-secondary-light p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-neutral-900">{t.davra.createTitle}</h2>
            <form onSubmit={onCreate} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder={t.davra.circleNamePlaceholder}
                className="input flex-1"
              />
              <button type="submit" disabled={busy} className="btn-primary shrink-0">
                <Users size={18} /> {t.davra.create}
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
            <h3 className="font-semibold text-neutral-900">{t.davra.how}</h3>
            <ol className="mt-3 space-y-2.5">
              {[t.davra.how1, t.davra.how2, t.davra.how3, t.davra.how4].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-neutral-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {circle && !creating && (
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
          <div>
            {/* Шапка круга */}
            <Tilt3D max={4} glare glareRadius="rounded-3xl">
              <div
                className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white sm:p-6"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3" style={{ transform: 'translateZ(24px)' }}>
                  <div className="min-w-0">
                    {renaming ? (
                      <form onSubmit={onRename} className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          maxLength={60}
                          className="input !py-1.5 text-sm text-neutral-900"
                        />
                        <button type="submit" disabled={busy} className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium">
                          {t.davra.save}
                        </button>
                        <button type="button" onClick={() => setRenaming(false)} className="rounded-full bg-white/20 p-1.5" aria-label="✕">
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <p className="flex items-center gap-2 font-display text-xl font-bold">
                        <Users size={20} /> {circle.name}
                        {isOwner && (
                          <button
                            onClick={() => {
                              setNewName(circle.name)
                              setRenaming(true)
                            }}
                            className="rounded-full bg-white/15 p-1.5 hover:bg-white/25"
                            aria-label={t.davra.rename}
                            title={t.davra.rename}
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm text-white/75">
                      {t.davra.members}: {circle.members.length} / 6 · {t.davra.owner}: {memberName(circle, circle.owner_id)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={share}
                      className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25"
                    >
                      <Share2 size={15} /> {copied ? t.davra.linkCopied : t.davra.invite}
                    </button>
                    <button
                      onClick={() => run(reload)}
                      disabled={busy}
                      className="rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/25 disabled:opacity-50"
                      aria-label={t.davra.refresh}
                      title={t.davra.refresh}
                    >
                      <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Участницы */}
                <div className="mt-4 flex flex-wrap items-start gap-3" style={{ transform: 'translateZ(40px)' }}>
                  {circle.members.map((m) => {
                    const nm = m.profile?.name?.trim() || fallbackName
                    const owner = m.user_id === circle.owner_id
                    const me = m.user_id === viewer.id
                    return (
                      <div key={m.user_id} className="relative flex flex-col items-center gap-1">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur">
                          {owner ? <Crown size={16} /> : nm.charAt(0).toUpperCase()}
                        </span>
                        <span className="max-w-16 truncate text-[10px] text-white/80">{me ? t.davra.you : nm}</span>
                        {isOwner && !owner && (
                          <button
                            onClick={() => onRemoveMember(m.user_id)}
                            className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 text-primary shadow hover:bg-red-50 hover:text-red-600"
                            aria-label={t.davra.removeMember}
                            title={t.davra.removeMember}
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <p className="mt-4 truncate text-xs text-white/70">
                  {/* origin только после монтирования — иначе SSR/клиент разойдутся (hydration #418) */}
                  {t.davra.inviteLink}: <span className="font-mono">{mounted ? window.location.origin + inviteUrl : inviteUrl}</span>
                </p>
              </div>
            </Tilt3D>

            {/* Общая корзина */}
            <h2 className="mb-3 mt-6 font-semibold text-neutral-900">{t.davra.sharedCart}</h2>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-12 text-center text-neutral-400">
                <ShoppingBag size={36} />
                <p className="max-w-sm text-sm">{t.davra.empty}</p>
                <Link href="/catalog/beauty" className="btn-primary !py-2 text-sm">
                  {t.davra.toCatalog}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((r) => {
                  const mine = r.user_id === viewer.id
                  const who = mine ? t.davra.addedByYou : `${memberName(circle, r.user_id)} ${t.davra.addedBy}`
                  if (!r.available || !r.product) {
                    return (
                      <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-3 text-sm text-neutral-400">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                          <ShoppingBag size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-neutral-500">{t.davra.unavailable}</p>
                          <p className="text-xs">{who}</p>
                        </div>
                        {mine && (
                          <button onClick={() => onRemoveItem(r.id)} disabled={busy} className="p-1.5 text-neutral-400 hover:text-red-500" aria-label="✕">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )
                  }
                  const p = r.product
                  const off = discounted(p)
                  return (
                    <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
                      <Link href={`/product/${r.product_id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100">
                        <Thumb src={p.images?.[0]} emoji={categoryEmoji(p.category_slug)} alt={productName(p, lang)} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${r.product_id}`} className="line-clamp-1 text-sm font-medium text-neutral-900 hover:text-primary">
                          {productName(p, lang)}
                        </Link>
                        <p className="text-xs text-neutral-400">{who}</p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className={cn('text-sm font-bold', off ? 'text-secondary' : 'text-primary')}>
                            {formatPriceLang(unitPrice(p), lang)}
                          </span>
                          {off && <span className="text-xs text-neutral-400 line-through">{formatPriceLang(p.price, lang)}</span>}
                          {discountActive && !off && <span className="text-[11px] text-neutral-400">{t.davra.shopNoDavra}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex items-center rounded-full border border-neutral-300">
                          <button
                            onClick={() => onQty(r.id, r.qty - 1)}
                            disabled={!mine || busy}
                            className="p-1.5 text-neutral-600 hover:text-primary disabled:opacity-30"
                            aria-label="−"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-6 text-center text-sm">{r.qty}</span>
                          <button
                            onClick={() => onQty(r.id, r.qty + 1)}
                            disabled={!mine || busy}
                            className="p-1.5 text-neutral-600 hover:text-primary disabled:opacity-30"
                            aria-label="+"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        {mine && (
                          <button onClick={() => onRemoveItem(r.id)} disabled={busy} className="p-1.5 text-neutral-400 hover:text-red-500" aria-label="✕">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Добавить ещё */}
            {suggestions.length > 0 && (
              <>
                <h2 className="mb-3 mt-8 font-semibold text-neutral-900">{t.davra.addMore}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {suggestions.map((p) => (
                    <div key={p.id} className="card overflow-hidden">
                      <Link href={`/product/${p.id}`} className="block aspect-square overflow-hidden">
                        <Thumb src={p.images?.[0]} emoji={categoryEmoji(p.category_slug)} alt={productName(p, lang)} />
                      </Link>
                      <div className="p-3">
                        <Link href={`/product/${p.id}`} className="line-clamp-1 text-sm font-medium text-neutral-900 hover:text-primary">
                          {productName(p, lang)}
                        </Link>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-primary">{formatPriceLang(p.price, lang)}</span>
                          <button
                            onClick={() => onAddItem(p.id)}
                            disabled={busy}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 disabled:opacity-50"
                            aria-label="+"
                          >
                            {justAdded === p.id ? <Check size={15} /> : <Plus size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Правая колонка */}
          <aside className="mt-6 space-y-4 lg:sticky lg:top-24 lg:mt-0">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-neutral-800">
                  {t.davra.total}:{' '}
                  <span className="font-display text-lg font-bold text-neutral-900">{formatPriceLang(progressSum, lang)}</span>
                </span>
                {discountActive ? (
                  <span className="font-medium text-secondary">{t.davra.discountOn}</span>
                ) : (
                  <span className="text-neutral-500">
                    {t.davra.toDiscount} <b className="text-primary">{formatPriceLang(threshold - progressSum, lang)}</b>
                  </span>
                )}
              </div>
              <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-neutral-100">
                <div className={cn('h-full rounded-full transition-all', discountActive ? 'bg-secondary' : 'bg-primary')} style={{ width: `${progress}%` }} />
              </div>
              {orderedTotal > 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  {t.davra.orderedAlready}: <b>{formatPriceLang(orderedTotal, lang)}</b>
                </p>
              )}
              <p className="mt-2 flex items-start gap-1.5 text-xs text-neutral-500">
                <Truck size={14} className="mt-0.5 shrink-0 text-primary" /> {t.davra.deliveryNoteLive}
              </p>
            </div>

            {liveRows.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="font-semibold text-neutral-900">{t.davra.split}</h3>
                <div className="mt-3 space-y-2">
                  {perMember.map(({ member, subtotal }) => {
                    const nm = member.profile?.name?.trim() || fallbackName
                    const me = member.user_id === viewer.id
                    return (
                      <div key={member.user_id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-neutral-700">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                            {nm.charAt(0).toUpperCase()}
                          </span>
                          {me ? t.davra.you : nm}
                          {me && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">{t.davra.yourPart}</span>
                          )}
                        </span>
                        <span className="font-semibold text-neutral-900">{formatPriceLang(subtotal, lang)}</span>
                      </div>
                    )
                  })}
                </div>
                {myPart > 0 && (
                  <button onClick={checkoutMy} className="btn-primary mt-5 w-full">
                    <Sparkles size={16} /> {t.davra.checkoutMy} · {formatPriceLang(myPart, lang)}
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-xs">
              {isOwner ? (
                <button onClick={onDissolve} disabled={busy} className="flex items-center gap-1 text-neutral-400 underline-offset-2 hover:text-red-600 hover:underline">
                  <Trash2 size={12} /> {t.davra.dissolveLive}
                </button>
              ) : (
                <button onClick={onLeave} disabled={busy} className="flex items-center gap-1 text-neutral-400 underline-offset-2 hover:text-red-600 hover:underline">
                  <LogOut size={12} /> {t.davra.leave}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
