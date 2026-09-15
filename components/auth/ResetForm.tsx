'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, LockKeyhole } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/utils'
import { useLang } from '@/components/LangProvider'

/** Установка нового пароля после перехода по ссылке из письма (сессия уже есть). */
export default function ResetForm() {
  const router = useRouter()
  const { t } = useLang()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError(t.auth.passwordShort)
      return
    }
    if (password !== confirm) {
      setError(t.auth.passwordsDiffer)
      return
    }
    if (!isSupabaseConfigured()) {
      setNotice(t.auth.notAvailableDemo)
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setNotice(t.auth.saved)
      setTimeout(() => {
        router.push('/profile')
        router.refresh()
      }, 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.actionFail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <LockKeyhole size={22} />
      </div>
      <h1 className="mb-2 font-display text-3xl font-bold text-neutral-900">{t.auth.resetTitle}</h1>
      <p className="mb-8 text-neutral-500">{t.auth.resetText}</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t.auth.newPassword}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t.auth.passwordPlaceholder}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t.auth.repeatPassword}</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
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
          {loading ? t.auth.wait : t.auth.savePassword}
        </button>
      </form>
    </div>
  )
}
