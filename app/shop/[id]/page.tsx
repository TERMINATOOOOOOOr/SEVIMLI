import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getShopById, getProductsByShop, getShopReviews } from '@/lib/data'
import ShopView from '@/components/shop/ShopView'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const shop = await getShopById(id)
  return { title: shop?.name ?? 'Магазин' }
}

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shop = await getShopById(id)
  if (!shop) notFound()

  const [products, reviews] = await Promise.all([getProductsByShop(shop.id), getShopReviews(shop.id)])

  return <ShopView shop={shop} products={products} reviews={reviews} />
}
