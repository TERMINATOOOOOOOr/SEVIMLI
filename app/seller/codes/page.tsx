import type { Metadata } from 'next'
import { getSellerContext } from '@/lib/seller'
import { getProductsByShop, getShopCodes } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/utils'
import NoShop from '@/components/seller/NoShop'
import CodesManager from '@/components/seller/CodesManager'

export const metadata: Metadata = { title: 'Коды подлинности' }

export default async function SellerCodesPage() {
  const { shop } = await getSellerContext()
  if (!shop) return <NoShop />

  const [products, codes] = await Promise.all([getProductsByShop(shop.id, true), getShopCodes(shop.id)])
  return (
    <CodesManager
      shopId={shop.id}
      verified={Boolean(shop.is_original_verified)}
      products={products}
      initialCodes={codes}
      demo={!isSupabaseConfigured()}
    />
  )
}
