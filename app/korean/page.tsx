import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Truck, Tag, Sparkles, MessagesSquare, ArrowRight } from 'lucide-react'
import { getOriginalProducts } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { formatPriceLang } from '@/lib/format'
import ProductCard from '@/components/cards/ProductCard'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = {
  title: 'Корейская косметика — 100% оригинал',
  description:
    'Оригинальная корейская косметика в Узбекистане: проверенные магазины с официальным импортом, честные отзывы сообщества и цены ниже офлайн-бутиков.',
}

export default async function KoreanPage() {
  const { lang, t } = await getT()
  const products = await getOriginalProducts(24)

  const totalSaving = products.reduce((sum, p) => {
    if (!p.market_price) return sum
    return sum + Math.max(0, p.market_price - p.price)
  }, 0)

  const guarantees = [
    { icon: ShieldCheck, title: t.korean.g1t, text: t.korean.g1x },
    { icon: Tag, title: t.korean.g2t, text: t.korean.g2x },
    { icon: Truck, title: t.korean.g3t, text: t.korean.g3x },
    { icon: MessagesSquare, title: t.korean.g4t, text: t.korean.g4x },
  ]

  return (
    <div className="relative isolate">
      {/* Тюбики в невесомости по всей странице */}
      <WeightlessBg seed={2} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary-light via-secondary-light/30 to-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-secondary shadow-sm">
            {t.korean.badge}
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight text-neutral-900 sm:text-5xl">
            {t.korean.title1}
            <br />
            {t.korean.title2}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 sm:mt-5 sm:text-lg">{t.korean.subtitle}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="#catalog" className="btn-primary">
              {t.korean.viewCatalog} <ArrowRight size={16} />
            </Link>
            <Link href="/community" className="btn-outline">
              <MessagesSquare size={16} /> {t.korean.communityReviews}
            </Link>
          </div>

          {totalSaving > 0 && (
            <p className="mt-6 text-sm text-neutral-500">
              {t.korean.savingsPrefix}{' '}
              <span className="font-semibold text-secondary">{formatPriceLang(totalSaving, lang)}</span>{' '}
              {t.korean.savingsSuffix}
            </p>
          )}
        </div>
      </section>

      {/* Гарантии */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="section-title mb-8 text-center">{t.korean.whyTrust}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {guarantees.map((g) => (
            <div key={g.title} className="flex items-start gap-4 rounded-2xl border border-neutral-200 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-light text-secondary">
                <g.icon size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{g.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{g.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Каталог */}
      <section id="catalog" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles size={22} className="text-primary" />
          <h2 className="section-title !text-2xl">
            {t.korean.catalogTitle} ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
            {t.korean.soon}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Лояльность */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-primary-light via-white to-secondary-light p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold text-neutral-900 sm:text-3xl">
            {t.korean.loyaltyTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-600">{t.korean.loyaltySubtitle}</p>
          <Link href="/loyalty" className="btn-primary mt-6">
            {t.korean.loyaltyCta} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
