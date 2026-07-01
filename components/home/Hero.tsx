'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

export default function Hero() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/catalog/clothes')
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-light via-primary-light/40 to-white">
      {/* Декоративные blob'ы */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-16 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">
        <span className="mb-4 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
          💗 Маркетплейс для женщин Узбекистана
        </span>
        <h1 className="font-display text-4xl font-extrabold leading-tight text-neutral-900 sm:text-6xl">
          Всё для тебя — в одном месте
        </h1>
        <p className="mt-5 max-w-xl text-lg text-neutral-600">
          Одежда, красота, дети, дом — лучшие магазины Ташкента.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Что ищешь? Например, платье…"
              className="input h-14 rounded-full pl-12 text-base shadow-sm"
            />
          </div>
          <button type="submit" className="btn-primary h-14 shrink-0 px-8 shadow-sm">
            Найти
          </button>
        </form>
      </div>
    </section>
  )
}
