import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Store, ArrowRight, Truck, ShieldCheck } from 'lucide-react'
import {
  getProductById,
  getReviewsForProduct,
  getRelatedProducts,
  getQuestionsForProduct,
  getPostsByProduct,
  getViewer,
  getMyLikedPostIds,
} from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { isSupabaseConfigured } from '@/lib/utils'
import { productName, productDesc, cityName } from '@/lib/product-i18n'
import { formatPriceLang, discountPercent } from '@/lib/format'
import { categoryEmoji, categoryLabel } from '@/lib/categories'
import ProductGallery from '@/components/product/ProductGallery'
import AddToCart from '@/components/product/AddToCart'
import DavraButton from '@/components/davra/DavraButton'
import ProductQA from '@/components/product/ProductQA'
import ProductPosts from '@/components/product/ProductPosts'
import ProductCard from '@/components/cards/ProductCard'
import ReviewCard from '@/components/cards/ReviewCard'
import StarRating from '@/components/ui/StarRating'
import OriginalBadge from '@/components/ui/OriginalBadge'
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
  const { lang, t } = await getT()
  const product = await getProductById(id)
  if (!product) notFound()

  const name = productName(product, lang)
  const description = productDesc(product, lang)

  const [reviews, related, questions, productPosts, viewer] = await Promise.all([
    getReviewsForProduct(product.id),
    getRelatedProducts(product, 4),
    getQuestionsForProduct(product.id),
    getPostsByProduct(product.id),
    getViewer(),
  ])
  const likedIds = viewer ? await getMyLikedPostIds(viewer.id, productPosts.map((p) => p.id)) : []
  const live = isSupabaseConfigured() // демо: Q&A и обсуждения из localStorage, пропсы пустые

  const discount = discountPercent(product.price, product.old_price)
  const marketSaving = discountPercent(product.price, product.market_price)
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : (product.shop?.rating ?? 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-neutral-400">
        <Link href="/" className="hover:text-primary">
          {t.product.home}
        </Link>
        <span>/</span>
        {product.category_slug && (
          <>
            <Link href={`/catalog/${product.category_slug}`} className="hover:text-primary">
              {categoryLabel(product.category_slug, lang)}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-neutral-600">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images ?? []}
          emoji={categoryEmoji(product.category_slug)}
          name={name}
        />

        <div>
          {(product.brand || product.is_original) && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.brand && (
                <span className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
                  {product.brand}
                </span>
              )}
              {product.country && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
                  {product.country}
                </span>
              )}
              {product.is_original && <OriginalBadge />}
            </div>
          )}

          <h1 className="font-display text-3xl font-bold text-neutral-900">{name}</h1>

          {reviews.length > 0 && (
            <div className="mt-3">
              <StarRating value={avgRating} count={reviews.length} />
            </div>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold text-primary sm:text-4xl">
              {formatPriceLang(product.price, lang)}
            </span>
            {product.old_price && (
              <span className="text-xl text-neutral-400 line-through">
                {formatPriceLang(product.old_price, lang)}
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-primary-light px-2.5 py-1 text-sm font-semibold text-primary">
                −{discount}%
              </span>
            )}
          </div>

          {marketSaving && product.market_price && (
            <p className="mt-2 text-sm text-secondary">
              {t.product.marketPrefix} {formatPriceLang(product.market_price, lang)} {t.product.marketSuffix}{' '}
              {marketSaving}%
            </p>
          )}

          {description && <p className="mt-5 leading-relaxed text-neutral-600">{description}</p>}

          {/* Обещания платформы */}
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
              <Truck size={14} className="text-primary" /> {t.promo.delivery}
            </span>
            {product.is_original && (
              <Link
                href="/verify"
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary-light px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-secondary hover:text-white"
              >
                <ShieldCheck size={14} /> {t.product.authenticity} →
              </Link>
            )}
          </div>

          <AddToCart product={product} />
          <DavraButton product={product} />

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
                <p className="text-sm text-neutral-400">{cityName(product.shop.city, lang)}</p>
              </div>
              <Link
                href={`/shop/${product.shop.id}`}
                className="btn-outline !px-4 !py-2 text-sm"
              >
                {t.product.toShop} <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Вопросы о товаре — спросить у продавца и сообщества */}
      <ProductQA productId={product.id} initialQuestions={live ? questions : []} viewer={viewer} />

      {/* Живые обсуждения из встроенного сообщества */}
      <ProductPosts product={product} initialPosts={live ? productPosts : []} initialLikedIds={likedIds} viewer={viewer} />

      {/* Отзывы */}
      <section className="mt-16">
        <h2 className="section-title mb-6">
          {t.product.reviews} {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-neutral-400">
            {t.product.noReviews}
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
          <h2 className="section-title mb-6">{t.product.related}</h2>
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
