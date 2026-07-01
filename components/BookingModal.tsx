'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/utils'

const SLOTS = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

interface Props {
  shopId: string
  shopName: string
  onClose: () => void
}

export default function BookingModal({ shopId, shopName, onClose }: Props) {
  const router = useRouter()
  const [service, setService] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (!isSupabaseConfigured()) {
        setDone(true)
        return
      }
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/shop/' + shopId)
        return
      }
      const { error: dbErr } = await supabase.from('bookings').insert({
        shop_id: shopId,
        user_id: user.id,
        service_name: service,
        booking_date: date,
        time_slot: slot,
        phone,
        status: 'pending',
      })
      if (dbErr) throw dbErr
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось записаться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Запись — {shopName}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-light text-secondary">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-lg font-medium text-neutral-900">Вы записаны!</p>
            <p className="text-sm text-neutral-500">Салон свяжется с вами для подтверждения.</p>
            <button onClick={onClose} className="btn-primary mt-2">
              Готово
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Услуга *</label>
              <input value={service} onChange={(e) => setService(e.target.value)} required placeholder="Маникюр, массаж…" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Дата *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Время *</label>
                <select value={slot} onChange={(e) => setSlot(e.target.value)} required className="input">
                  <option value="" disabled>
                    Выберите
                  </option>
                  {SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Телефон *</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+998 …" className="input" />
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Записываем…' : 'Записаться'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
