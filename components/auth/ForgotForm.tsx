'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/utils'
import { useLang } from '@/components/LangProvider'

/** Запрос письма для сброса пароля (Supabase Auth → /auth/callback?next=/auth/reset). */
export default function ForgotForm() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (!isSupabaseConfigured()) {
      setNotice(t.auth.notAvailableDemo)
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const next = encodeURIComponent('/auth/reset')
      const redirectTo = `${window.location.origin}/auth/callback?next=${next}`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) throw error
      setNotice(t.auth.linkSent)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.actionFail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <KeyRound size={22} />
      </div>
      <h1 className="mb-2 font-display text-3xl font-bold text-neutral-900">{t.auth.forgotTitle}</h1>
      <p className="mb-8 text-neutral-500">{t.auth.forgotText}</p>

      <form onSubmit={onSubmit} className="space-y-4">
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
          {loading ? t.auth.wait : t.auth.sendLink}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-500">
        <Link href="/auth" className="text-primary hover:underline">
          ← {t.auth.backToLogin}
        </Link>
      </p>
    </div>
  )
}
