'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured, cn } from '@/lib/utils'
import { verifyDemoPassword, safeInternalPath } from '@/lib/security'
import { useLang } from '@/components/LangProvider'
import { useSession, DEMO_EMAIL, DEMO_PASSWORD } from '@/store/session'

type Tab = 'login' | 'register'

export default function AuthForm() {
  const router = useRouter()
  const { t: tr } = useLang()
  const searchParams = useSearchParams()
  // Только внутренние пути — иначе /auth?redirect=https://evil.com = фишинг
  const redirect = safeInternalPath(searchParams.get('redirect'), '/profile')
  const demoLogin = useSession((s) => s.login)

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

    // Демо-режим: базы нет, поэтому пускаем локально и создаём демо-сессию.
    if (!configured) {
      if (password.length < 6) {
        setError(tr.auth.passwordShort)
        return
      }
      // Пароль демо-аккаунта проверяем по SHA-256-хэшу — plaintext-сравнений нет
      if (email.trim().toLowerCase() === DEMO_EMAIL && !(await verifyDemoPassword(password))) {
        setError(tr.auth.wrongPassword)
        return
      }
      demoLogin({ email, name, phone })
      router.push(redirect)
      router.refresh()
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
          setNotice(tr.auth.emailSent)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.auth.actionFail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-center font-display text-3xl font-bold text-neutral-900">
        {tr.auth.welcome}
      </h1>
      <p className="mb-8 text-center text-neutral-500">{tr.auth.subtitle}</p>

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
            {t === 'login' ? tr.auth.login : tr.auth.register}
          </button>
        ))}
      </div>

      {!configured && (
        <div className="mb-5 rounded-xl bg-primary-light p-4 text-sm text-primary">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles size={16} /> {tr.auth.demoMode}
          </p>
          <p className="mt-1.5 text-primary/80">{tr.auth.demoText}</p>
          <p className="mt-2 font-mono text-xs text-primary/90">
            {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setEmail(DEMO_EMAIL)
              setPassword(DEMO_PASSWORD)
              setError(null)
            }}
            className="mt-2.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
          >
            {tr.auth.fillDemo}
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {tab === 'register' && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">{tr.auth.nameLabel}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder={tr.auth.namePlaceholder}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">{tr.auth.phoneLabel}</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
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
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">{tr.auth.passwordLabel}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            placeholder={tr.auth.passwordPlaceholder}
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
          {loading ? tr.auth.wait : tab === 'login' ? tr.auth.login : tr.auth.createAccount}
        </button>
      </form>
    </div>
  )
}
