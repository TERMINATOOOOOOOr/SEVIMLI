import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Store, ArrowRight } from 'lucide-react'
import { getProductById, getReviewsForProduct, getRelatedProducts } from '@/lib/data'
import { formatPrice, discountPercent } from '@/lib/format'
import { categoryEmoji, CATEGORY_LABEL } from '@/lib/categories'
import ProductGallery from '@/components/product/ProductGallery'
import AddToCart from '@/components/product/AddToCart'
import ProductCard from '@/components/cards/ProductCard'
import ReviewCard from '@/components/cards/ReviewCard'
import StarRating from '@/components/ui/StarRating'
import Thumb from '@/components/ui/Thumb'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)
  return { title: product?.name ?? 'Товар' }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()

  const [reviews, related] = await Promise.all([
    getReviewsForProduct(product.id),
    getRelatedProducts(product, 4),
  ])

  const discount = discountPercent(product.price, product.old_price)
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : (product.shop?.rating ?? 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-neutral-400">
        <Link href="/" className="hover:text-primary">
          Главная
        </Link>
        <span>/</span>
        {product.category_slug && (
          <>
            <Link href={`/catalog/${product.category_slug}`} className="hover:text-primary">
              {CATEGORY_LABEL[product.category_slug] ?? 'Каталог'}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-neutral-600">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images ?? []}
          emoji={categoryEmoji(product.category_slug)}
          name={product.name}
        />

        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">{product.name}</h1>

          {reviews.length > 0 && (
            <div className="mt-3">
              <StarRating value={avgRating} count={reviews.length} />
            </div>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.old_price && (
              <span className="text-xl text-neutral-400 line-through">
                {formatPrice(product.old_price)}
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-primary-light px-2.5 py-1 text-sm font-semibold text-primary">
                −{discount}%
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-5 leading-relaxed text-neutral-600">{product.description}</p>
          )}

          <AddToCart product={product} />

          {/* Блок магазина */}
          {product.shop && (
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-neutral-200 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200">
                <Thumb src={product.shop.logo_url} emoji="🏬" alt={product.shop.name} />
              </div>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 font-semibold text-neutral-900">
                  <Store size={16} className="text-primary" />
                  {product.shop.name}
                </p>
                <p className="text-sm text-neutral-400">{product.shop.city}</p>
              </div>
              <Link
                href={`/shop/${product.shop.id}`}
                className="btn-outline !px-4 !py-2 text-sm"
              >
                В магазин <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Отзывы */}
      <section className="mt-16">
        <h2 className="section-title mb-6">Отзывы {reviews.length > 0 && `(${reviews.length})`}</h2>
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-neutral-400">
            Пока нет отзывов. Будьте первым!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </section>

      {/* Похожие товары */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">Похожие товары</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
