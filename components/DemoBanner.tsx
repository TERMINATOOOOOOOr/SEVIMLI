'use client'

import { Sparkles } from 'lucide-react'
import { useLang } from '@/components/LangProvider'

/**
 * Глобальная пометка демо-витрины: магазины, отзывы и цифры — примеры.
 * Показывается, пока база не подключена (или принудительно через
 * NEXT_PUBLIC_DEMO_MODE=1), чтобы витрину нельзя было принять за живую.
 */
export default function DemoBanner() {
  const { t } = useLang()
  return (
    <div className="bg-amber-50 text-amber-900">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs sm:px-6 sm:text-sm">
        <Sparkles size={14} className="shrink-0 text-amber-600" />
        <span>{t.demo.banner}</span>
      </div>
    </div>
  )
}
