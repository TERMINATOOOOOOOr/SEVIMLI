import type { Metadata } from 'next'
import { SearchX } from 'lucide-react'
import { search } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import ProductCard from '@/components/cards/ProductCard'
import ShopCard from '@/components/cards/ShopCard'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = { title: 'Поиск · Qidiruv' }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const { t } = await getT()
  const { products, shops } = await search(q)
  const nothing = q && products.length === 0 && shops.length === 0

  return (
    <div className="relative isolate mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <WeightlessBg seed={4} />
      <h1 className="font-display text-2xl font-bold text-neutral-900">
        {q ? (
          <>
            {t.searchPage.resultsPrefix}
            <span className="text-primary">{q}</span>
            {t.searchPage.resultsSuffix}
          </>
        ) : (
          t.searchPage.title
        )}
      </h1>

      {!q && <p className="mt-2 text-neutral-500">{t.searchPage.enterQuery}</p>}

      {nothing && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
          <SearchX size={44} />
          <p className="text-lg font-medium text-neutral-700">{t.searchPage.nothing}</p>
          <p className="text-sm">{t.searchPage.tryOther}</p>
        </div>
      )}

      {shops.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-semibold text-neutral-700">
            {t.searchPage.shops} ({shops.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-semibold text-neutral-700">
            {t.searchPage.products} ({products.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
