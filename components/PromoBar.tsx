'use client'

import Link from 'next/link'
import { Truck, ShieldCheck, Gift } from 'lucide-react'
import { useLang } from '@/components/LangProvider'

/** Тонкая промо-полоса над шапкой: ключевые обещания платформы. */
export default function PromoBar() {
  const { t } = useLang()
  return (
    <div className="bg-neutral-900 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Truck size={14} className="text-primary" />
          {t.promo.delivery}
        </span>
        <span className="hidden items-center gap-1.5 text-neutral-300 sm:flex">
          <ShieldCheck size={14} className="text-secondary" />
          {t.promo.original}
        </span>
        <Link
          href="/loyalty"
          className="hidden items-center gap-1.5 text-neutral-300 transition-colors hover:text-primary md:flex"
        >
          <Gift size={14} />
          {t.promo.loyalty}
        </Link>
      </div>
    </div>
  )
}
