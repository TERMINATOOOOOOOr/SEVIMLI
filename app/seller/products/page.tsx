import type { Metadata } from 'next'
import { getSellerContext } from '@/lib/seller'
import { getProductsByShop } from '@/lib/data'
import NoShop from '@/components/seller/NoShop'
import ProductsManager from '@/components/seller/ProductsManager'

export const metadata: Metadata = { title: 'Мои товары' }

export default async function SellerProductsPage() {
  const { shop } = await getSellerContext()
  if (!shop) return <NoShop />

  // Скрытые товары остаются в кабинете: их можно вернуть на витрину или поправить
  const products = await getProductsByShop(shop.id, true)
  return (
    <ProductsManager
      shopId={shop.id}
      initialProducts={products}
      originalVerified={Boolean(shop.is_original_verified)}
    />
  )
}
