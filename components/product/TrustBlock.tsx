import Link from 'next/link'
import { CalendarCheck, ShieldCheck } from 'lucide-react'
import type { Product } from '@/lib/types'
import type { Dict } from '@/lib/i18n'
import { expiryMode } from '@/lib/categories'
import { expiryState, formatExpiry } from '@/lib/expiry'

/** «Проверяйте сами»: срок годности и метка «оригинал» — то, что покупательница видит до заказа. */
export default function TrustBlock({ product, t, today }: { product: Product; t: Dict; today: string }) {
  const p = t.product
  const showExpiry = expiryMode(product.category_slug) !== 'hidden' || Boolean(product.expires_on || product.made_on)
  const state = expiryState(product, today)

  let expiryLine: string | null = null
  let expiryDanger = false
  if (showExpiry) {
    if (state === 'expired') {
      expiryLine = p.expiredOwner
      expiryDanger = true
    } else if (state === 'ok' || state === 'mfg') {
      expiryLine = `${formatExpiry(product, p)} · ${p.expiryBy}`
    } else if (state === 'soon') {
      expiryLine = `${formatExpiry(product, p)} · ${p.expiryBy}. ${p.expirySoon}`
    } else if (state === 'none') {
      expiryLine = p.expiryNone
    } else {
      expiryLine = p.expiryUnknown
    }
  }

  if (!expiryLine && !product.is_original) return null

  return (
    <div className="mt-5 rounded-2xl border border-neutral-200 p-4">
      <p className="text-sm font-semibold text-neutral-900">{p.trustTitle}</p>
      <ul className="mt-3 space-y-2.5 text-sm text-neutral-700">
        {expiryLine && (
          <li className="flex gap-2.5">
            <CalendarCheck size={18} className={`mt-0.5 shrink-0 ${expiryDanger ? 'text-red-500' : 'text-primary'}`} />
            <span className={expiryDanger ? 'font-medium text-red-600' : ''}>{expiryLine}</span>
          </li>
        )}
        {product.is_original && (
          <li className="flex gap-2.5">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-secondary" />
            <span>{p.trustOriginal}</span>
          </li>
        )}
      </ul>
      <Link href="/trust" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
        {p.trustMore} →
      </Link>
    </div>
  )
}
