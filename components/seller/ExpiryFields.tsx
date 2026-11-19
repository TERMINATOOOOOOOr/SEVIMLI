'use client'

import { useState } from 'react'
import { useLang } from '@/components/LangProvider'
import { todayTashkent } from '@/lib/expiry'
import { useHasMounted } from '@/lib/hooks'

/** Что магазин указал о сроке; хранится так же, как колонки products. */
export interface ExpiryValue {
  expires_on: string | null
  expires_precision: 'month' | 'day'
  made_on: string | null
  pao_months: number | null
  no_expiry: boolean
}

interface Props {
  value: ExpiryValue
  onChange: (v: ExpiryValue) => void
  required: boolean
}

const PAO = [6, 12, 18, 24, 36]
const pad = (n: number) => String(n).padStart(2, '0')

function parts(iso: string | null): { y: string; m: string; d: string } {
  if (!iso) return { y: '', m: '', d: '' }
  const [y, m, d] = iso.slice(0, 10).split('-')
  return { y, m, d }
}

/** Месяц и год (и день при точной дате) — как на упаковке. */
export default function ExpiryFields({ value, onChange, required }: Props) {
  const { t } = useLang()
  const s = t.seller
  const mounted = useHasMounted()

  // «Только дата изготовления» — отдельный режим: дату в нём можно ещё не выбрать
  const [mfgMode, setMfgMode] = useState(value.made_on !== null && value.expires_on === null)
  const dateIso = mfgMode ? value.made_on : value.expires_on
  const { y, m, d } = parts(dateIso)
  const thisYear = Number(todayTashkent().slice(0, 4))
  const years = mfgMode
    ? Array.from({ length: 6 }, (_, i) => thisYear - i)
    : Array.from({ length: 7 }, (_, i) => thisYear + i)
  const precision = mfgMode ? 'month' : value.expires_precision

  function setDate(ny: string, nm: string, nd: string) {
    if (!ny || !nm) {
      onChange(mfgMode ? { ...value, made_on: null } : { ...value, expires_on: null })
      return
    }
    const day = precision === 'day' && nd ? nd : '01'
    const last = new Date(Date.UTC(Number(ny), Number(nm), 0)).getUTCDate()
    const iso = `${ny}-${nm}-${pad(Math.min(Number(day), last))}`
    onChange(mfgMode ? { ...value, made_on: iso, no_expiry: false } : { ...value, expires_on: iso, no_expiry: false })
  }

  const past = mounted && !mfgMode && value.expires_on !== null && value.expires_on <= todayTashkent()

  return (
    <fieldset className="space-y-3 rounded-xl border border-neutral-200 p-4">
      <legend className="px-1 text-sm font-medium text-neutral-700">
        {s.expiryLabel}
        {required && ' *'}
      </legend>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={value.no_expiry}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { ...value, no_expiry: true, expires_on: null, made_on: null, pao_months: null }
                : { ...value, no_expiry: false },
            )
          }
        />
        {s.noExpiry}
      </label>

      {!value.no_expiry && (
        <>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {mfgMode ? s.expiryMfg : s.expiryExp}
          </div>
          <div className="flex flex-wrap gap-2">
            {precision === 'day' && (
              <select aria-label={s.day} value={d} onChange={(e) => setDate(y, m, e.target.value)} className="input !w-24">
                <option value="">{s.day}</option>
                {Array.from({ length: 31 }, (_, i) => pad(i + 1)).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            )}
            <select aria-label={s.month} value={m} onChange={(e) => setDate(y, e.target.value, d)} className="input !w-28">
              <option value="">{s.month}</option>
              {Array.from({ length: 12 }, (_, i) => pad(i + 1)).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select aria-label={s.year} value={y} onChange={(e) => setDate(e.target.value, m, d)} className="input !w-28">
              <option value="">{s.year}</option>
              {years.map((v) => (
                <option key={v} value={String(v)}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {!mfgMode && (
              <button
                type="button"
                className="text-primary underline-offset-2 hover:underline"
                onClick={() => {
                  const next = precision === 'day' ? 'month' : 'day'
                  // Переход на «месяц» — храним первое число, как требует база
                  const exp = value.expires_on && next === 'month' ? `${value.expires_on.slice(0, 8)}01` : value.expires_on
                  onChange({ ...value, expires_precision: next, expires_on: exp })
                }}
              >
                {precision === 'day' ? s.precisionMonth : s.precisionDay}
              </button>
            )}
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              onClick={() => {
                onChange(
                  mfgMode
                    ? { ...value, made_on: null, pao_months: null }
                    : { ...value, expires_on: null, expires_precision: 'month' },
                )
                setMfgMode(!mfgMode)
              }}
            >
              {mfgMode ? s.hasExpiry : s.onlyMfg}
            </button>
          </div>

          {mfgMode && (
            <div>
              <label className="mb-1 block text-sm text-neutral-700">{s.paoLabel}</label>
              <select
                value={value.pao_months ?? ''}
                onChange={(e) => onChange({ ...value, pao_months: e.target.value ? Number(e.target.value) : null })}
                className="input !w-28"
              >
                <option value="">—</option>
                {PAO.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {past && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{s.expiryPast}</p>}
      <p className="text-xs text-neutral-500">{s.expiryHint}</p>
      <p className="text-xs text-neutral-500">{s.expiryRule}</p>
    </fieldset>
  )
}
