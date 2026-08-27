'use client'

import { useRouter } from 'next/navigation'
import { LANG_COOKIE, type Lang } from '@/lib/i18n'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'

const OPTIONS: { id: Lang; label: string }[] = [
  { id: 'ru', label: 'РУ' },
  { id: 'uz', label: "O'Z" },
]

export default function LangSwitcher({ className }: { className?: string }) {
  const router = useRouter()
  const { lang } = useLang()

  function switchTo(next: Lang) {
    if (next === lang) return
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  return (
    <div className={cn('flex items-center rounded-full bg-neutral-100 p-0.5 text-xs font-semibold', className)}>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => switchTo(o.id)}
          className={cn(
            'rounded-full px-2.5 py-1.5 transition-colors',
            lang === o.id ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-800',
          )}
          aria-pressed={lang === o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
