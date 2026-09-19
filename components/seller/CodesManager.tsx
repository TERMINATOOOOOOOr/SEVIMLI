'use client'

import { useState } from 'react'
import { ShieldCheck, Download, ScanLine, TriangleAlert } from 'lucide-react'
import type { Product } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/format'

export interface IssuedCode {
  code: string
  product_id: string | null
  batch: string | null
  expires_at: string | null
  checks_count: number
  first_checked_at: string | null
  created_at: string
}

interface Props {
  shopId: string
  /** Магазин подтвердил документы импорта (ставит админ) — без этого выпуск закрыт. */
  verified: boolean
  products: Product[]
  initialCodes: IssuedCode[]
  demo?: boolean
}

function toCsv(rows: string[][]): string {
  const esc = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n')
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Реестр подлинности: продавец с подтверждённым импортом выпускает уникальные коды на партию,
 * печатает их на наклейках (CSV → типография), покупательница проверяет код на /verify.
 * Счётчик проверок > 1 у одного кода — признак скопированной наклейки.
 */
export default function CodesManager({ shopId, verified, products, initialCodes, demo = false }: Props) {
  const [codes, setCodes] = useState<IssuedCode[]>(initialCodes)
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [count, setCount] = useState('50')
  const [batch, setBatch] = useState('')
  const [supplier, setSupplier] = useState('')
  const [declaration, setDeclaration] = useState('')
  const [imported, setImported] = useState('')
  const [expires, setExpires] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastIssued, setLastIssued] = useState<string[]>([])

  const productName = (id: string | null) => products.find((p) => p.id === id)?.name ?? '—'
  const site = typeof window !== 'undefined' ? window.location.origin : ''

  function exportCsv(list: { code: string; product_id: string | null; batch: string | null; expires_at: string | null }[], name: string) {
    download(
      name,
      toCsv([
        ['Код', 'Товар', 'Партия', 'Годен до', 'Ссылка для QR'],
        ...list.map((c) => [c.code, productName(c.product_id), c.batch ?? '', c.expires_at ?? '', `${site}/verify?code=${c.code}`]),
      ]),
    )
  }

  async function issue(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (demo) {
      setError('В демо-режиме коды не выпускаются — подключите базу.')
      return
    }
    const n = Math.max(1, Math.min(500, Number(count) || 0))
    setBusy(true)
    try {
      const supabase = createClient()
      const { data, error: rpcErr } = await supabase.rpc('issue_codes', {
        p_shop: shopId,
        p_product: productId || null,
        p_count: n,
        p_batch: batch || null,
        p_supplier: supplier || null,
        p_declaration: declaration || null,
        p_imported: imported || null,
        p_expires: expires || null,
      })
      if (rpcErr) {
        const m = rpcErr.message ?? ''
        setError(
          /import_not_verified/.test(m)
            ? 'Выпуск откроется после подтверждения документов импорта администратором.'
            : /codes_limit_exceeded/.test(m)
              ? 'Лимит: не больше 5000 кодов в сутки на магазин.'
              : /product_not_in_shop/.test(m)
                ? 'Этот товар не из вашего магазина.'
                : 'Не получилось выпустить коды. Попробуйте ещё раз.',
        )
        return
      }
      const issued = (data as string[] | null) ?? []
      setLastIssued(issued)
      const now = new Date().toISOString()
      const fresh: IssuedCode[] = issued.map((code) => ({
        code,
        product_id: productId || null,
        batch: batch || null,
        expires_at: expires || null,
        checks_count: 0,
        first_checked_at: null,
        created_at: now,
      }))
      setCodes((prev) => [...fresh, ...prev])
      exportCsv(fresh, `sevimli-codes-${batch || now.slice(0, 10)}.csv`)
    } finally {
      setBusy(false)
    }
  }

  const suspicious = codes.filter((c) => c.checks_count > 1)

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldCheck size={22} className="text-primary" />
        <h1 className="font-display text-2xl font-bold text-neutral-900">Коды подлинности</h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Уникальный код на каждую упаковку: печатаете наклейки из CSV (в файле есть готовая ссылка для QR), покупательница
        проверяет код на странице «Проверка подлинности» и видит партию и срок годности. Если один код проверяют
        много раз — наклейку скопировали.
      </p>

      {!verified && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            Выпуск кодов откроется после проверки документов импорта (инвойс, декларация, договор с поставщиком).
            Отправьте их администратору SEVIMLI — после подтверждения у магазина появится метка «оригинал».
          </p>
        </div>
      )}

      {/* Выпуск */}
      <form onSubmit={issue} className="mt-6 grid gap-4 rounded-2xl border border-neutral-200 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Товар</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
            <option value="">Без привязки к товару</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Сколько кодов (до 500 за раз)</label>
          <input type="number" min={1} max={500} value={count} onChange={(e) => setCount(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Партия / batch</label>
          <input value={batch} onChange={(e) => setBatch(e.target.value)} maxLength={60} placeholder="например, KR-2026-09" className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Поставщик</label>
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} maxLength={120} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">№ таможенной декларации</label>
          <input value={declaration} onChange={(e) => setDeclaration(e.target.value)} maxLength={60} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Дата ввоза</label>
          <input type="date" value={imported} onChange={(e) => setImported(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Годен до</label>
          <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="input" />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={busy || !verified} className="btn-primary">
            <ShieldCheck size={16} /> {busy ? 'Выпускаем…' : 'Выпустить и скачать CSV'}
          </button>
          {lastIssued.length > 0 && <span className="text-sm text-secondary">Выпущено: {lastIssued.length}</span>}
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>

      {/* Реестр */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-neutral-900">
          Выпущенные коды {codes.length > 0 && <span className="font-normal text-neutral-400">· {codes.length}</span>}
        </h2>
        {codes.length > 0 && (
          <button onClick={() => exportCsv(codes, 'sevimli-codes-all.csv')} className="btn-outline !py-2 text-sm">
            <Download size={15} /> Скачать все (CSV)
          </button>
        )}
      </div>
      {suspicious.length > 0 && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <TriangleAlert size={15} /> Кодов с повторными проверками: {suspicious.length} — возможно, наклейки скопировали.
        </p>
      )}

      {codes.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-neutral-400">
          Кодов пока нет.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Партия</th>
                <th className="px-4 py-3">Годен до</th>
                <th className="px-4 py-3">Проверок</th>
                <th className="px-4 py-3">Выпущен</th>
              </tr>
            </thead>
            <tbody>
              {codes.slice(0, 200).map((c) => (
                <tr key={c.code} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-mono text-xs text-neutral-900">{c.code}</td>
                  <td className="max-w-52 truncate px-4 py-2.5 text-neutral-700">{productName(c.product_id)}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{c.batch ?? '—'}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{c.expires_at ? formatDate(c.expires_at) : '—'}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        c.checks_count > 1
                          ? 'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700'
                          : 'inline-flex items-center gap-1 text-neutral-600'
                      }
                    >
                      <ScanLine size={12} /> {c.checks_count}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-400">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {codes.length > 200 && (
            <p className="border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-400">
              Показаны последние 200 — полный список в CSV.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
