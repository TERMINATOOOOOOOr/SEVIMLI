import type { Metadata } from 'next'
import { getSellerContext } from '@/lib/seller'
import { getProductsByShop } from '@/lib/data'
import NoShop from '@/components/seller/NoShop'
import ProductsManager from '@/components/seller/ProductsManager'

export const metadata: Metadata = { title: 'Мои товары' }

export default async function SellerProductsPage() {
  const { shop } = await getSellerContext()
  if (!shop) return <NoShop />

  const products = await getProductsByShop(shop.id)
  return <ProductsManager shopId={shop.id} initialProducts={products} />
}
