import type { Metadata } from 'next'
import { Package, ShoppingCart, Wallet, Star } from 'lucide-react'
import { getSellerContext } from '@/lib/seller'
import { getOrdersByShop, getProductsByShop } from '@/lib/data'
import NoShop from '@/components/seller/NoShop'
import { formatPrice, formatDate } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '@/lib/orders'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Дашборд' }

export default async function DashboardPage() {
  const { shop } = await getSellerContext()
  if (!shop) return <NoShop />

  const [products, orders] = await Promise.all([
    getProductsByShop(shop.id),
    getOrdersByShop(shop.id),
  ])
  const productsCount = products.length

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const ordersThisMonth = orders.filter((o) => new Date(o.created_at) >= monthStart).length
  const revenue = orders
    .filter((o) => o.status === 'done')
    .reduce((sum, o) => sum + (o.total_price ?? 0), 0)

  // График: заказы по дням за последние 30 дней
  const days: { label: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toDateString()
    const count = orders.filter((o) => new Date(o.created_at).toDateString() === key).length
    days.push({ label: `${d.getDate()}`, count })
  }
  const maxCount = Math.max(1, ...days.map((d) => d.count))

  const stats = [
    { label: 'Товаров', value: String(productsCount), icon: Package },
    { label: 'Заказов за месяц', value: String(ordersThisMonth), icon: ShoppingCart },
    { label: 'Выручка', value: formatPrice(revenue), icon: Wallet },
    { label: 'Рейтинг', value: shop.rating.toFixed(1), icon: Star },
  ]

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-neutral-900">Дашборд</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <s.icon size={20} />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-neutral-900">{s.value}</p>
            <p className="text-sm text-neutral-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* График заказов */}
      <div className="mt-8 rounded-2xl border border-neutral-200 p-5">
        <h2 className="mb-5 font-semibold text-neutral-900">Заказы за 30 дней</h2>
        <div className="flex h-40 items-end gap-1">
          {days.map((d, i) => (
            <div key={i} className="group flex flex-1 flex-col items-center justify-end">
              <div
                className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count ? 4 : 2 }}
                title={`${d.count} заказ(ов)`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Последние заказы */}
      <div className="mt-8">
        <h2 className="mb-4 font-semibold text-neutral-900">Последние заказы</h2>
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-neutral-400">
            Пока нет заказов
          </p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4">
                <div>
                  <p className="font-medium text-neutral-900">Заказ #{o.id.slice(0, 8)}</p>
                  <p className="text-sm text-neutral-400">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatPrice(o.total_price ?? 0)}</span>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-medium', ORDER_STATUS_STYLE[o.status])}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
