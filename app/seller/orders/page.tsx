import type { Metadata } from 'next'
import { getSellerContext } from '@/lib/seller'
import { createClient } from '@/lib/supabase/server'
import NoShop from '@/components/seller/NoShop'
import OrdersManager from '@/components/seller/OrdersManager'
import type { Order } from '@/lib/types'

export const metadata: Metadata = { title: 'Заказы' }

export default async function SellerOrdersPage() {
  const { shop } = await getSellerContext()
  if (!shop) return <NoShop />

  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  return <OrdersManager initialOrders={(data as Order[]) ?? []} />
}
