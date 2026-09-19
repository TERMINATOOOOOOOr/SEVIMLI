'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { useLang } from '@/components/LangProvider'

/** Ошибка рендера страницы: понятное сообщение, «Попробовать снова» и путь на главную. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLang()

  useEffect(() => {
    // В консоль — для диагностики; пользователю технические детали не показываем
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-xl px-4 py-24 sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <TriangleAlert size={28} />
      </span>
      <h1 className="mt-6 font-display text-2xl font-bold text-neutral-900">{t.errors.errorTitle}</h1>
      <p className="mt-3 text-neutral-600">{t.errors.errorText}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-neutral-400">#{error.digest}</p>}
      <div className="mt-7 flex flex-wrap gap-3">
        <button onClick={reset} className="btn-primary">
          {t.errors.retry}
        </button>
        <Link href="/" className="btn-outline">
          {t.errors.toHome}
        </Link>
      </div>
    </div>
  )
}
