'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured, cn } from '@/lib/utils'
import { useLang } from '@/components/LangProvider'

const INTERESTS = ['kbeauty', 'clothes', 'salons'] as const
type Interest = (typeof INTERESTS)[number]

/**
 * Лист ожидания на главной: первые покупательницы до запуска (таблица waitlist,
 * анонимная запись разрешена RLS). В демо-режиме заявка не отправляется.
 */
export default function Waitlist() {
  const { t } = useLang()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [picked, setPicked] = useState<Interest[]>(['kbeauty'])
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(i: Interest) {
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (contact.trim().length < 5) return
    if (!isSupabaseConfigured()) {
      setDone(true)
      return
    }
    setBusy(true)
    try {
      const { error: err } = await createClient().from('waitlist').insert({
        name: name.trim() || null,
        contact: contact.trim(),
        city: 'Ташкент',
        interests: picked,
        source: 'home',
      })
      if (err) throw err
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.waitlist.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-3xl border border-primary/20 bg-primary-light/40 p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={14} /> {t.waitlist.badge}
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold text-neutral-900 sm:text-3xl">{t.waitlist.title}</h2>
            <p className="mt-3 max-w-xl text-neutral-600">{t.waitlist.subtitle}</p>
          </div>

          {done ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white p-5 text-neutral-800">
              <CheckCircle2 size={24} className="shrink-0 text-secondary" />
              <p className="text-sm">{t.waitlist.thanks}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.waitlist.name}
                  autoComplete="given-name"
                  className="input"
                />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t.waitlist.contact}
                  required
                  minLength={5}
                  className="input"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => toggle(i)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      picked.includes(i)
                        ? 'border-primary bg-primary text-white'
                        : 'border-neutral-200 text-neutral-600 hover:border-primary',
                    )}
                  >
                    {t.waitlist.interests[i]}
                  </button>
                ))}
              </div>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? t.waitlist.sending : t.waitlist.submit}
              </button>
              <p className="text-xs text-neutral-400">{t.waitlist.privacy}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
