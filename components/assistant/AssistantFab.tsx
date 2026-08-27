'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useLang } from '@/components/LangProvider'

/** Плавающая кнопка ИИ-помощницы — на всех страницах, кроме самого чата. */
export default function AssistantFab() {
  const pathname = usePathname()
  const { t } = useLang()
  if (pathname.startsWith('/assistant') || pathname.startsWith('/seller') || pathname.startsWith('/courier')) return null

  return (
    <Link
      href="/assistant"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary py-3 pl-4 pr-5 font-medium text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 md:bottom-5 md:right-5"
    >
      <Sparkles size={18} />
      <span className="hidden text-sm sm:inline">{t.assistant.fabLabel}</span>
    </Link>
  )
}
