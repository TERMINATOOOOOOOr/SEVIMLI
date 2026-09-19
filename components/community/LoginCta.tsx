'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'

/**
 * Плашка «Войдите, чтобы …» для гостя в боевом режиме — вместо формы.
 * Решается по серверному viewer, поэтому не мигает при гидрации.
 */
export default function LoginCta({ text, compact = false }: { text: string; compact?: boolean }) {
  const { t } = useLang()
  const pathname = usePathname()
  const href = `/auth?redirect=${encodeURIComponent(pathname)}`

  if (compact) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        {text}
        <Link href={href} className="font-medium text-primary hover:underline">
          {t.community.loginCta} →
        </Link>
      </p>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white p-5 sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      <p className="text-neutral-600">{text}</p>
      <Link href={href} className="btn-primary !py-2.5 text-sm">
        <LogIn size={16} /> {t.community.loginCta}
      </Link>
    </div>
  )
}
