import type { Metadata } from 'next'
import { Eye, ShoppingCart, Wallet, Percent, Receipt, Repeat } from 'lucide-react'
import { getSellerContext } from '@/lib/seller'
import { getOrdersByShop, getProductsByShop } from '@/lib/data'
import { getSellerAnalytics } from '@/lib/insights'
import { formatPrice } from '@/lib/format'
import NoShop from '@/components/seller/NoShop'
import TrendChart from '@/components/charts/TrendChart'
import Thumb from '@/components/ui/Thumb'

export const metadata: Metadata = { title: 'Аналитика' }

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

export default async function AnalyticsPage() {
  const { shop } = await getSellerContext()
  if (!shop) return <NoShop />

  const [orders, products] = await Promise.all([
    getOrdersByShop(shop.id),
    getProductsByShop(shop.id),
  ])
  const a = getSellerAnalytics(shop.id, orders, products)

  const stats = [
    { label: 'Выручка за 30 дней', value: formatPrice(a.totals.revenue), icon: Wallet },
    { label: 'Заказы', value: String(a.totals.orders), icon: ShoppingCart },
    { label: 'Просмотры товаров', value: a.totals.views.toLocaleString('ru-RU'), icon: Eye },
    { label: 'Конверсия в заказ', value: `${(a.totals.conversion * 100).toFixed(1)}%`, icon: Percent },
    { label: 'Средний чек', value: formatPrice(a.totals.avgCheck), icon: Receipt },
    { label: 'Повторные покупки', value: `${Math.round(a.totals.repeatShare * 100)}%`, icon: Repeat },
  ]

  const revenueData = a.days.map((d) => ({ label: fmtDay(d.date), value: d.revenue }))
  const viewsData = a.days.map((d) => ({ label: fmtDay(d.date), value: d.views }))
  const maxFunnel = Math.max(...a.funnel.map((f) => f.value))

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-neutral-900">Аналитика</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Последние 30 дней · обновляется ежедневно
      </p>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <s.icon size={20} />
            </div>
            <p className="mt-3 font-display text-xl font-bold text-neutral-900 lg:text-2xl">
              {s.value}
            </p>
            <p className="text-sm text-neutral-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Выручка и просмотры — два отдельных графика, никаких двойных осей */}
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-5">
          <h2 className="mb-4 font-semibold text-neutral-900">Выручка по дням</h2>
          <TrendChart data={revenueData} mode="area" color="#c4507a" format="price" />
        </div>
        <div className="rounded-2xl border border-neutral-200 p-5">
          <h2 className="mb-4 font-semibold text-neutral-900">Просмотры товаров по дням</h2>
          <TrendChart data={viewsData} mode="area" color="#1d9e75" format="int" />
        </div>
      </div>

      {/* Воронка продаж */}
      <div className="mt-8 rounded-2xl border border-neutral-200 p-5">
        <h2 className="mb-5 font-semibold text-neutral-900">Воронка продаж</h2>
        <div className="space-y-4">
          {a.funnel.map((f, i) => {
            const prev = i > 0 ? a.funnel[i - 1].value : null
            return (
              <div key={i}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-neutral-700">{f.stage.ru}</span>
                  <span className="font-semibold text-neutral-900">
                    {f.value.toLocaleString('ru-RU')}
                    {prev !== null && (
                      <span className="ml-2 text-xs font-normal text-neutral-400">
                        {((f.value / prev) * 100).toFixed(0)}% от шага выше
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1.5 h-4 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${Math.max(2, (f.value / maxFunnel) * 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* Топ товаров */}
        <div className="rounded-2xl border border-neutral-200 p-5">
          <h2 className="mb-4 font-semibold text-neutral-900">
            Топ товаров по выручке <span className="text-sm font-normal text-neutral-400">за всё время</span>
          </h2>
          <div className="space-y-3">
            {a.topProducts.map(({ product, sold, revenue }) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                  <Thumb src={product.images?.[0]} emoji="🧴" alt={product.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{product.name}</p>
                  <p className="text-xs text-neutral-400">{sold} шт.</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-neutral-900">
                  {formatPrice(revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* География заказов */}
        <div className="rounded-2xl border border-neutral-200 p-5">
          <h2 className="mb-4 font-semibold text-neutral-900">География заказов</h2>
          <div className="space-y-3.5">
            {a.citySplit.map((c) => (
              <div key={c.city}>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-700">{c.city}</span>
                  <span className="font-medium text-neutral-900">{Math.round(c.share * 100)}%</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-400"
                    style={{ width: `${c.share * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-400">
            Данные аналитики в демо-режиме смоделированы; при подключении базы считаются по
            реальным событиям просмотров и заказов.
          </p>
        </div>
      </div>
    </div>
  )
}
