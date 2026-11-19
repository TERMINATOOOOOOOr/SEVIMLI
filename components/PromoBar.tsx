'use client'

import { Truck } from 'lucide-react'
import { useLang } from '@/components/LangProvider'

/** Тонкая промо-полоса над шапкой: как устроена доставка. */
export default function PromoBar() {
  const { t } = useLang()
  return (
    <div className="bg-neutral-900 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Truck size={14} className="text-primary" />
          {t.promo.delivery}
        </span>
      </div>
    </div>
  )
}
