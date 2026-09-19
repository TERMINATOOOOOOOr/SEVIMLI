import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Clock, Wallet, Store } from 'lucide-react'
import { getOrderForPayment } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { SITE_URL } from '@/lib/site'
import { payLinksFor } from '@/lib/payments'
import { formatPriceLang } from '@/lib/format'
import PayButtons from '@/components/pay/PayButtons'

export const metadata: Metadata = { title: 'Оплата заказа', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/**
 * Страница оплаты заказа. Ссылки на кассу собираются на сервере из реквизитов магазина
 * и актуальной суммы заказа: платформа деньги не принимает, платёж идёт магазину.
 */
export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { lang, t } = await getT()
  const order = await getOrderForPayment(id)

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900">{t.pay.notFound}</h1>
        <Link href="/profile" className="btn-primary mt-6">
          {t.cart.myOrders}
        </Link>
      </div>
    )
  }

  const paid = order.payment_status === 'paid'
  const links = paid ? [] : payLinksFor(order, order.shop, { lang, origin: SITE_URL })

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">{t.pay.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t.cart.orderNo} <span className="font-medium text-neutral-800">#{order.id.slice(0, 8)}</span>
      </p>

      <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-neutral-600">
            <Store size={16} className="text-primary" /> {order.shop?.name ?? '—'}
          </span>
          <span className="font-display text-xl font-bold text-neutral-900">
            {formatPriceLang(Number(order.total_price ?? 0), lang)}
          </span>
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-4">
          {paid ? (
            <p className="flex items-center gap-2 font-medium text-secondary">
              <CheckCircle2 size={18} /> {t.pay.paid}
            </p>
          ) : links.length > 0 ? (
            <>
              <p className="mb-3 flex items-center gap-2 text-sm text-neutral-600">
                <Wallet size={16} className="text-primary" /> {t.pay.chooseMethod}
              </p>
              <PayButtons orderId={order.id} links={links} />
              <p className="mt-3 text-xs text-neutral-400">{t.pay.directToShop}</p>
            </>
          ) : (
            <p className="flex items-start gap-2 text-sm text-neutral-600">
              <Clock size={16} className="mt-0.5 shrink-0 text-primary" /> {t.pay.onlineUnavailable}
            </p>
          )}
          {order.shop?.payment_note && <p className="mt-3 text-xs text-neutral-500">{order.shop.payment_note}</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/profile" className="btn-outline">
          {t.cart.myOrders}
        </Link>
        <Link href="/" className="btn-outline">
          {t.cart.toHome}
        </Link>
      </div>
    </div>
  )
}
