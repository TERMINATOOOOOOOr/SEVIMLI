import type { Metadata } from 'next'
import { getSellerContext } from '@/lib/seller'
import ShopForm from '@/components/seller/ShopForm'

export const metadata: Metadata = { title: 'Настройки магазина' }

export default async function SellerShopPage() {
  const { userId, shop } = await getSellerContext()
  if (!userId) return null
  return <ShopForm userId={userId} shop={shop} />
}
