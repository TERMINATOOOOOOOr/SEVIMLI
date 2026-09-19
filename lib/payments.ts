import type { Order, Shop, ShopPayMode } from '@/lib/types'

/**
 * Оплата заказа: деньги идут МАГАЗИНУ напрямую, платформа их не держит.
 * Магазин вводит реквизиты своей кассы (Payme merchant id или Click service/merchant id),
 * платформа собирает по ним ссылку на оплату конкретного заказа. Подтверждает оплату
 * вебхук провайдера (app/api/pay/*) или сам магазин кнопкой в кабинете.
 */

export type PayProvider = 'payme' | 'click'
export type { ShopPayMode }

export interface PayLink {
  provider: PayProvider | 'link'
  /** Подпись кнопки подставляет компонент из словаря. */
  url: string
}

/** Сумма в тийинах: Payme принимает только целые тийины (1 сум = 100 тийин). */
export const toTiyin = (sum: number): number => Math.round(sum * 100)

/** Ссылка на кассу Payme магазина: base64 от «m=<касса>;ac.<поле>=<заказ>;a=<тийины>». */
export function paymeLink(opts: {
  merchantId: string
  accountField: string
  orderId: string
  amount: number
  lang?: 'ru' | 'uz'
  callback?: string
}): string {
  const field = (opts.accountField || 'order_id').trim()
  const parts = [
    `m=${opts.merchantId.trim()}`,
    `ac.${field}=${opts.orderId}`,
    `a=${toTiyin(opts.amount)}`,
    `l=${opts.lang ?? 'ru'}`,
    `cr=UZS`,
  ]
  if (opts.callback) parts.push(`c=${opts.callback}`)
  const payload = parts.join(';')
  const b64 = typeof window === 'undefined' ? Buffer.from(payload).toString('base64') : btoa(payload)
  return `https://checkout.paycom.uz/${b64}`
}

/** Ссылка на оплату через Click магазина (SHOP API: service_id + merchant_id + сумма + наш id заказа). */
export function clickLink(opts: {
  serviceId: string
  merchantId: string
  orderId: string
  amount: number
  returnUrl?: string
}): string {
  const q = new URLSearchParams({
    service_id: opts.serviceId.trim(),
    merchant_id: opts.merchantId.trim(),
    amount: String(opts.amount),
    transaction_param: opts.orderId,
  })
  if (opts.returnUrl) q.set('return_url', opts.returnUrl)
  return `https://my.click.uz/services/pay?${q.toString()}`
}

/** Настроена ли у магазина онлайн-оплата (по ней в корзине включается способ «картой»). */
export function shopAcceptsOnline(shop?: Shop | null): boolean {
  if (!shop) return false
  switch (shop.payment_provider) {
    case 'payme':
      return Boolean(shop.payme_merchant_id?.trim())
    case 'click':
      return Boolean(shop.click_service_id?.trim() && shop.click_merchant_id?.trim())
    case 'link':
      return Boolean(shop.payment_url?.trim())
    default:
      return false
  }
}

/** Ссылки на оплату конкретного заказа. Пусто — магазин онлайн-оплату не настроил. */
export function payLinksFor(order: Order, shop: Shop | null | undefined, opts: { lang?: 'ru' | 'uz'; origin?: string } = {}): PayLink[] {
  if (!shop || !order.total_price) return []
  const amount = Number(order.total_price)
  const back = opts.origin ? `${opts.origin}/profile` : undefined
  switch (shop.payment_provider) {
    case 'payme':
      return shop.payme_merchant_id?.trim()
        ? [
            {
              provider: 'payme',
              url: paymeLink({
                merchantId: shop.payme_merchant_id,
                accountField: shop.payme_account_field ?? 'order_id',
                orderId: order.id,
                amount,
                lang: opts.lang,
                callback: back,
              }),
            },
          ]
        : []
    case 'click':
      return shop.click_service_id?.trim() && shop.click_merchant_id?.trim()
        ? [
            {
              provider: 'click',
              url: clickLink({
                serviceId: shop.click_service_id,
                merchantId: shop.click_merchant_id,
                orderId: order.id,
                amount,
                returnUrl: back,
              }),
            },
          ]
        : []
    case 'link':
      return shop.payment_url?.trim() ? [{ provider: 'link', url: shop.payment_url.trim() }] : []
    default:
      return []
  }
}
