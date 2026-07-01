'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured, cn } from '@/lib/utils'

type Tab = 'login' | 'register'

export default function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/profile'

  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const configured = isSupabaseConfigured()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!configured) {
      setError('Демо-режим: подключите Supabase (см. DEPLOY.md), чтобы включить вход.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(redirect)
        router.refresh()
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, phone } },
        })
        if (error) throw error
        if (data.session) {
          router.push(redirect)
          router.refresh()
        } else {
          setNotice('Мы отправили письмо для подтверждения на вашу почту.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить действие')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-center font-display text-3xl font-bold text-neutral-900">
        Добро пожаловать
      </h1>
      <p className="mb-8 text-center text-neutral-500">Войдите или создайте аккаунт SEVIMLI</p>

      {/* Вкладки */}
      <div className="mb-6 grid grid-cols-2 rounded-full bg-neutral-100 p-1">
        {(['login', 'register'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setError(null)
              setNotice(null)
            }}
            className={cn(
              'rounded-full py-2.5 text-sm font-medium transition-colors',
              tab === t ? 'bg-white text-primary shadow-sm' : 'text-neutral-500',
            )}
          >
            {t === 'login' ? 'Войти' : 'Регистрация'}
          </button>
        ))}
      </div>

      {!configured && (
        <div className="mb-5 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>Демо-режим: авторизация заработает после подключения Supabase (DEPLOY.md).</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {tab === 'register' && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Имя</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ваше имя"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Телефон</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="input"
              />
            </div>
          </>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Минимум 6 символов"
            className="input"
          />
        </div>

        {error && (
          <div className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="flex gap-2 rounded-xl bg-secondary-light p-3 text-sm text-secondary">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Подождите…' : tab === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>
    </div>
  )
}
