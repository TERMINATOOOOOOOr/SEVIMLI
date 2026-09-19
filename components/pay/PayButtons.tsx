'use client'

import { useState } from 'react'
import { CreditCard, ExternalLink } from 'lucide-react'
import type { PayLink } from '@/lib/payments'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/components/LangProvider'

/**
 * Кнопки оплаты заказа. Ведут в кассу магазина: деньги идут магазину напрямую.
 * Перед переходом помечаем в заказе выбранный способ, чтобы продавец видел намерение
 * («ждёт оплату картой»); сам факт оплаты подтверждает вебхук провайдера или продавец.
 */
export default function PayButtons({ orderId, links }: { orderId: string; links: PayLink[] }) {
  const { t } = useLang()
  const [busy, setBusy] = useState<string | null>(null)

  const label: Record<PayLink['provider'], string> = {
    payme: t.pay.payWithPayme,
    click: t.pay.payWithClick,
    link: t.pay.payOnShopPage,
  }

  async function go(link: PayLink) {
    setBusy(link.provider)
    try {
      await createClient().rpc('set_payment_intent', { p_order: orderId, p_provider: link.provider })
    } catch {
      /* намерение не критично — главное довести до кассы */
    }
    // Переход к внешней кассе магазина (не внутренний роут Next)
    window.location.assign(link.url)
  }

  return (
    <div className="flex flex-wrap gap-3">
      {links.map((l) => (
        <button key={l.provider} onClick={() => go(l)} disabled={busy !== null} className="btn-primary">
          {l.provider === 'link' ? <ExternalLink size={16} /> : <CreditCard size={16} />}
          {busy === l.provider ? t.pay.opening : label[l.provider]}
        </button>
      ))}
    </div>
  )
}
