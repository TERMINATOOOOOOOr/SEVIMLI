import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PackageOpen } from 'lucide-react'
import { getCategoryBySlug, getCatalogProducts, type ProductSort } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { categoryName } from '@/lib/i18n'
import ProductCard from '@/components/cards/ProductCard'
import FilterSidebar from '@/components/catalog/FilterSidebar'
import Pagination from '@/components/catalog/Pagination'
import SoftGlow from '@/components/ui/SoftGlow'
import WeightlessBg from '@/components/ui/Weightless'

const PAGE_SIZE = 12

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v)
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  return { title: category?.name_ru ?? 'Каталог' }
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const sp = await searchParams
  const { lang, t } = await getT()

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const page = num(sp.page) ?? 1
  const sort = (str(sp.sort) as ProductSort) ?? 'newest'
  const minPrice = num(sp.min_price)
  const maxPrice = num(sp.max_price)
  const city = str(sp.city)

  const { items, total } = await getCatalogProducts(slug, {
    minPrice,
    maxPrice,
    city,
    sort,
    page,
    pageSize: PAGE_SIZE,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Параметры для ссылок пагинации (без page)
  const baseParams: Record<string, string> = {}
  if (minPrice != null) baseParams.min_price = String(minPrice)
  if (maxPrice != null) baseParams.max_price = String(maxPrice)
  if (city) baseParams.city = city
  if (sort && sort !== 'newest') baseParams.sort = sort

  return (
    <div className="relative isolate mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SoftGlow variant="rose" />
      <WeightlessBg seed={4} />
      <div className="mb-8">
        <p className="text-sm text-neutral-400">{t.catalog.breadcrumb}</p>
        <h1 className="font-display text-3xl font-bold text-neutral-900">
          {category.icon} {categoryName(category, lang)}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t.catalog.found} {total}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <FilterSidebar />

        <div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-20 text-center">
              <PackageOpen size={48} className="text-neutral-300" />
              <p className="mt-4 text-lg font-medium text-neutral-700">{t.catalog.notFound}</p>
              <p className="mt-1 text-sm text-neutral-400">{t.catalog.tryChange}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                baseParams={baseParams}
                basePath={`/catalog/${slug}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
