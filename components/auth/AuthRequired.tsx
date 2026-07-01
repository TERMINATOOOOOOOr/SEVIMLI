import Link from 'next/link'
import { Lock } from 'lucide-react'

/** Заглушка для приватных страниц, когда пользователь не авторизован. */
export default function AuthRequired({ demo = false }: { demo?: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
        <Lock size={28} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900">Нужен вход</h1>
      <p className="mt-2 text-neutral-500">
        {demo
          ? 'Приложение работает в демо-режиме на заглушках. Подключите Supabase (см. DEPLOY.md), чтобы включить авторизацию.'
          : 'Войдите в аккаунт, чтобы просматривать эту страницу.'}
      </p>
      <Link href="/auth" className="btn-primary mt-6">
        Войти или зарегистрироваться
      </Link>
    </div>
  )
}
