import Link from 'next/link'
import { ShieldCheck, Truck, Tag, ArrowRight } from 'lucide-react'
import { getOriginalProducts } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import ProductCard from '@/components/cards/ProductCard'

export default async function KoreanBeauty() {
  const products = await getOriginalProducts(4)
  const { t } = await getT()
  if (products.length === 0) return null

  const perks = [
    { icon: ShieldCheck, title: t.home.kbPerk1Title, text: t.home.kbPerk1Text },
    { icon: Tag, title: t.home.kbPerk2Title, text: t.home.kbPerk2Text },
    { icon: Truck, title: t.home.kbPerk3Title, text: t.home.kbPerk3Text },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-light px-4 py-1.5 text-sm font-medium text-secondary">
            🇰🇷 K-Beauty
          </span>
          <h2 className="section-title mt-3">{t.home.kbTitle}</h2>
          <p className="mt-2 max-w-2xl text-neutral-600">{t.home.kbSubtitle}</p>
        </div>
        <Link href="/korean" className="btn-outline shrink-0">
          {t.home.kbAll} <ArrowRight size={16} />
        </Link>
      </div>

      {/* Преимущества */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {perks.map((p) => (
          <div key={p.title} className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-light text-secondary">
              <p.icon size={20} />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">{p.title}</p>
              <p className="mt-0.5 text-sm text-neutral-500">{p.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Товары */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
