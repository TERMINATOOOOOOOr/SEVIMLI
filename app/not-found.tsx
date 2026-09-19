import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { getT } from '@/lib/lang-server'

/** Страница 404 — на языке пользователя, с путями обратно в каталог и сообщество. */
export default async function NotFound() {
  const { t } = await getT()
  return (
    <div className="mx-auto max-w-xl px-4 py-24 sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <SearchX size={28} />
      </span>
      <p className="mt-6 font-display text-6xl font-bold text-primary">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-neutral-900">{t.errors.notFoundTitle}</h1>
      <p className="mt-3 text-neutral-600">{t.errors.notFoundText}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          {t.errors.toHome}
        </Link>
        <Link href="/korean" className="btn-outline">
          {t.errors.toCatalog}
        </Link>
        <Link href="/community" className="btn-outline">
          {t.errors.toCommunity}
        </Link>
      </div>
    </div>
  )
}
