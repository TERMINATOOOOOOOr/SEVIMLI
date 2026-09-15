import type { Metadata } from 'next'
import { getSellerContext } from '@/lib/seller'
import { getOrdersByShop } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/utils'
import NoShop from '@/components/seller/NoShop'
import OrdersManager from '@/components/seller/OrdersManager'

export const metadata: Metadata = { title: 'Заказы' }

export default async function SellerOrdersPage() {
  const { shop } = await getSellerContext()
  if (!shop) return <NoShop />

  const orders = await getOrdersByShop(shop.id)
  return <OrdersManager initialOrders={orders} demo={!isSupabaseConfigured()} />
}
