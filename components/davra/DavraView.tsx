'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Share2, Plus, Minus, Trash2, Truck, Sparkles, ShoppingBag, Check } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useDavra, DAVRA_THRESHOLD, DAVRA_ME, davraPrice } from '@/store/davra'
import { useCart } from '@/store/cart'
import { useHasMounted } from '@/lib/hooks'
import { formatPriceLang } from '@/lib/format'
import { personName } from '@/lib/community-i18n'
import { productName } from '@/lib/product-i18n'
import { categoryEmoji } from '@/lib/categories'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'
import Thumb from '@/components/ui/Thumb'
import Tilt3D from '@/components/ui/Tilt3D'

/** Пул демо-подруг для кнопки «+ Подруга (демо)». */
const DEMO_FRIENDS = ['Nigora', 'Kamila', 'Sevara', 'Dilnoza', 'Zarina']

/** Что каждая демо-подруга кладёт в корзину, присоединяясь (для живого демо). */
const FRIEND_PICKS: Record<string, string[]> = {
  Nigora: ['k2'],
  Kamila: ['p23'],
  Sevara: ['k1', 'k3'],
  Dilnoza: ['p16'],
  Zarina: ['p41'],
}

export default function DavraView({ products }: { products: Product[] }) {
  const mounted = useHasMounted()
  const router = useRouter()
  const { lang, t } = useLang()
  const { circle, items, createCircle, addMember, changeQty, removeItem, dissolve, addItem } =
    useDavra()
  const addToCart = useCart((s) => s.addItem)

  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const productById = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  if (!mounted) return <div className="h-72 animate-pulse rounded-3xl bg-neutral-100" />

  // ---------- Нет круга: создание ----------
  if (!circle) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl bg-gradient-to-br from-primary-light via-white to-secondary-light p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-neutral-900">{t.davra.createTitle}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createCircle(name)
            }}
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.davra.circleNamePlaceholder}
              className="input flex-1"
            />
            <button type="submit" className="btn-primary shrink-0">
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
    )
  }

  // ---------- Круг есть: общая корзина ----------
  const rows = items
    .map((i) => ({ ...i, product: productById.get(i.productId) }))
    .filter((i): i is typeof i & { product: Product } => Boolean(i.product))

  const total = rows.reduce((s, r) => s + r.product.price * r.qty, 0)
  const discountActive = total >= DAVRA_THRESHOLD
  const progress = Math.min(100, Math.round((total / DAVRA_THRESHOLD) * 100))

  // Разбивка по участницам
  const perMember = circle.members.map((m) => {
    const subtotal = rows
      .filter((r) => r.addedBy === m)
      .reduce((s, r) => s + davraPrice(r.product.price, discountActive) * r.qty, 0)
    return { member: m, subtotal }
  })

  async function share() {
    const url = `${window.location.origin}/davra`
    try {
      if (navigator.share) {
        await navigator.share({ title: `SEVIMLI Davra: ${circle!.name}`, url })
        return
      }
    } catch {
      /* закрыли шэринг */
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* клипборд недоступен */
    }
  }

  function addDemoFriend() {
    const next = DEMO_FRIENDS.find((f) => !circle!.members.includes(f))
    if (!next) return
    addMember(next)
    // Подруга приходит не с пустыми руками — кладёт свои товары в общую корзину
    for (const pid of FRIEND_PICKS[next] ?? []) {
      if (productById.has(pid)) addItem(pid, next)
    }
  }

  /** Мои позиции → обычная корзина (со скидкой круга, если активна) → оформление. */
  function checkoutMy() {
    const mine = rows.filter((r) => r.addedBy === DAVRA_ME)
    for (const r of mine) {
      addToCart({ ...r.product, price: davraPrice(r.product.price, discountActive) }, r.qty, false)
      removeItem(r.productId, r.addedBy)
    }
    router.push('/cart')
  }

  const myPart = perMember.find((p) => p.member === DAVRA_ME)?.subtotal ?? 0

  // Подборка «добавить ещё»: чего ещё нет в корзине круга
  const inCircle = new Set(items.map((i) => i.productId))
  const suggestions = products.filter((p) => !inCircle.has(p.id)).slice(0, 8)

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
      <div>
      {/* Шапка круга — с 3D-наклоном и глубиной слоёв */}
      <Tilt3D max={4} glare glareRadius="rounded-3xl">
      <div
        className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white sm:p-6"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          style={{ transform: 'translateZ(24px)' }}
        >
          <div>
            <p className="flex items-center gap-2 font-display text-xl font-bold">
              <Users size={20} /> {circle.name}
            </p>
            <p className="mt-0.5 text-sm text-white/75">
              {t.davra.members}: {circle.members.length}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={share}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25"
            >
              <Share2 size={15} /> {copied ? t.community.linkCopied : t.davra.invite}
            </button>
            {circle.members.length < 6 && (
              <button
                onClick={addDemoFriend}
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25"
              >
                {t.davra.demoFriend}
              </button>
            )}
          </div>
        </div>

        {/* Аватары участниц — парят над картой */}
        <div className="mt-4 flex items-center gap-2" style={{ transform: 'translateZ(40px)' }}>
          {circle.members.map((m) => (
            <div key={m} className="flex flex-col items-center gap-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur">
                {personName(m, lang).charAt(0)}
              </span>
              <span className="max-w-14 truncate text-[10px] text-white/75">
                {personName(m, lang)}
              </span>
            </div>
          ))}
        </div>
      </div>
      </Tilt3D>

      {/* Общая корзина */}
      <h2 className="mt-6 mb-3 font-semibold text-neutral-900">{t.davra.sharedCart}</h2>
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
          {rows.map((r) => (
            <div
              key={r.productId + r.addedBy}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3"
            >
              <Link
                href={`/product/${r.productId}`}
                className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100"
              >
                <Thumb
                  src={r.product.images?.[0]}
                  emoji={categoryEmoji(r.product.category_slug)}
                  alt={productName(r.product, lang)}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${r.productId}`}
                  className="line-clamp-1 text-sm font-medium text-neutral-900 hover:text-primary"
                >
                  {productName(r.product, lang)}
                </Link>
                <p className="text-xs text-neutral-400">
                  {personName(r.addedBy, lang)} {t.davra.addedBy}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      discountActive ? 'text-secondary' : 'text-primary',
                    )}
                  >
                    {formatPriceLang(davraPrice(r.product.price, discountActive), lang)}
                  </span>
                  {discountActive && (
                    <span className="text-xs text-neutral-400 line-through">
                      {formatPriceLang(r.product.price, lang)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center rounded-full border border-neutral-300">
                  <button
                    onClick={() => changeQty(r.productId, r.addedBy, -1)}
                    className="p-1.5 text-neutral-600 hover:text-primary"
                    aria-label="−"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center text-sm">{r.qty}</span>
                  <button
                    onClick={() => changeQty(r.productId, r.addedBy, 1)}
                    className="p-1.5 text-neutral-600 hover:text-primary"
                    aria-label="+"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(r.productId, r.addedBy)}
                  className="p-1.5 text-neutral-400 hover:text-red-500"
                  aria-label="✕"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Добавить ещё — товар одним тапом уходит в круг */}
      {suggestions.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 font-semibold text-neutral-900">{t.davra.addMore}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {suggestions.map((p) => (
              <div key={p.id} className="card overflow-hidden">
                <Link href={`/product/${p.id}`} className="block aspect-square overflow-hidden">
                  <Thumb
                    src={p.images?.[0]}
                    emoji={categoryEmoji(p.category_slug)}
                    alt={productName(p, lang)}
                  />
                </Link>
                <div className="p-3">
                  <Link
                    href={`/product/${p.id}`}
                    className="line-clamp-1 text-sm font-medium text-neutral-900 hover:text-primary"
                  >
                    {productName(p, lang)}
                  </Link>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-primary">
                      {formatPriceLang(p.price, lang)}
                    </span>
                    <button
                      onClick={() => {
                        addItem(p.id, DAVRA_ME)
                        setJustAdded(p.id)
                        setTimeout(() => setJustAdded(null), 1200)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105"
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

      {/* Правая колонка: прогресс + оплата, липнет при скролле */}
      <aside className="mt-6 space-y-4 lg:sticky lg:top-24 lg:mt-0">
      {/* Прогресс к скидке */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="font-medium text-neutral-800">
            {t.davra.total}:{' '}
            <span className="font-display text-lg font-bold text-neutral-900">
              {formatPriceLang(total, lang)}
            </span>
          </span>
          {discountActive ? (
            <span className="font-medium text-secondary">{t.davra.discountOn}</span>
          ) : (
            <span className="text-neutral-500">
              {t.davra.toDiscount}{' '}
              <b className="text-primary">{formatPriceLang(DAVRA_THRESHOLD - total, lang)}</b>
            </span>
          )}
        </div>
        <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              discountActive ? 'bg-secondary' : 'bg-primary',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
          <Truck size={14} className="text-primary" /> {t.davra.delivery}
        </p>
      </div>

      {/* Разбивка оплаты */}
      {rows.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-900">{t.davra.split}</h3>
          <div className="mt-3 space-y-2">
            {perMember.map(({ member, subtotal }) => (
              <div key={member} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-neutral-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                    {personName(member, lang).charAt(0)}
                  </span>
                  {personName(member, lang)}
                  {member === DAVRA_ME && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                      {t.davra.yourPart}
                    </span>
                  )}
                </span>
                <span className="font-semibold text-neutral-900">
                  {formatPriceLang(subtotal, lang)}
                </span>
              </div>
            ))}
          </div>

          {myPart > 0 && (
            <button onClick={checkoutMy} className="btn-primary mt-5 w-full">
              <Sparkles size={16} /> {t.davra.checkoutMy} · {formatPriceLang(myPart, lang)}
            </button>
          )}
        </div>
      )}

      <button
        onClick={dissolve}
        className="text-xs text-neutral-400 underline-offset-2 hover:underline"
      >
        {t.davra.dissolve}
      </button>
      </aside>
    </div>
  )
}
