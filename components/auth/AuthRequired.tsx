'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useLang } from '@/components/LangProvider'

/** Заглушка для приватных страниц, когда пользователь не авторизован. */
export default function AuthRequired({ demo = false }: { demo?: boolean }) {
  const { lang } = useLang()
  const ru = {
    title: 'Нужен вход',
    demoText:
      'Приложение работает в демо-режиме на заглушках. Подключите Supabase (см. DEPLOY.md), чтобы включить авторизацию.',
    text: 'Войдите в аккаунт, чтобы просматривать эту страницу.',
    cta: 'Войти или зарегистрироваться',
  }
  const uz = {
    title: 'Kirish kerak',
    demoText:
      "Ilova demo-rejimda ishlayapti. Avtorizatsiyani yoqish uchun Supabase'ni ulang (DEPLOY.md ga qarang).",
    text: "Bu sahifani ko'rish uchun akkauntga kiring.",
    cta: "Kirish yoki ro'yxatdan o'tish",
  }
  const s = lang === 'uz' ? uz : ru

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
        <Lock size={28} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900">{s.title}</h1>
      <p className="mt-2 text-neutral-500">{demo ? s.demoText : s.text}</p>
      <Link href="/auth" className="btn-primary mt-6">
        {s.cta}
      </Link>
    </div>
  )
}
