'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ShieldAlert, ScanLine, Sparkles } from 'lucide-react'
import type { Product } from '@/lib/types'
import { verifyCode, VERIFY_CODES, type VerifyResult } from '@/lib/insights'
import { formatDateLang } from '@/lib/format'
import { productName } from '@/lib/product-i18n'
import { useLang } from '@/components/LangProvider'
import Thumb from '@/components/ui/Thumb'

export default function VerifyWidget({
  products,
  initialCode = '',
  demo = false,
}: {
  products: Product[]
  initialCode?: string
  /** База не подключена — реестр демонстрационный, честно помечаем результат. */
  demo?: boolean
}) {
  const { lang, t } = useLang()
  const [code, setCode] = useState(initialCode)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [demoIdx, setDemoIdx] = useState(0)

  const productById = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  function check(value?: string) {
    const v = (value ?? code).trim()
    if (!v) return
    setResult(verifyCode(v))
  }

  function fillDemo() {
    const demo = VERIFY_CODES[demoIdx % VERIFY_CODES.length]
    setDemoIdx((i) => i + 1)
    setCode(demo.code)
    setResult(verifyCode(demo.code))
  }

  const okProduct =
    result?.status === 'ok' ? (productById.get(result.record.productId) ?? null) : null

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <ScanLine
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.verify.placeholder}
            className="input pl-11 font-mono uppercase"
            spellCheck={false}
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          {t.verify.check}
        </button>
      </form>

      {demo && (
        <button
          onClick={fillDemo}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Sparkles size={14} /> {t.verify.tryDemo}
        </button>
      )}

      {/* Результат */}
      {result?.status === 'ok' && (
        <div className="mt-5 rounded-2xl border border-secondary/30 bg-secondary-light p-5">
          <p className="flex items-center gap-2 font-semibold text-secondary">
            <ShieldCheck size={20} /> {t.verify.okTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{t.verify.okText}</p>
          {demo && <p className="mt-2 text-xs text-amber-700">{t.verify.demoNote}</p>}

          {okProduct && (
            <Link
              href={`/product/${okProduct.id}`}
              className="mt-4 flex items-center gap-3 rounded-xl border border-white bg-white/70 p-3 transition-shadow hover:shadow-sm"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <Thumb src={okProduct.images?.[0]} emoji="🧴" alt={productName(okProduct, lang)} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {productName(okProduct, lang)}
                </p>
                <p className="text-xs text-neutral-500">
                  {okProduct.brand} · {okProduct.country}
                </p>
              </div>
            </Link>
          )}

          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              [t.verify.batch, result.record.batch],
              [t.verify.supplier, result.record.importInfo.supplier],
              [t.verify.declaration, result.record.importInfo.declaration],
              [t.verify.importedAt, formatDateLang(result.record.importInfo.importedAt, lang)],
              [t.verify.expiresAt, formatDateLang(result.record.importInfo.expiresAt, lang)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 sm:block">
                <dt className="text-neutral-400">{k}</dt>
                <dd className="font-medium text-neutral-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {result?.status === 'not_found' && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-center gap-2 font-semibold text-amber-700">
            <ShieldAlert size={20} /> {t.verify.failTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{t.verify.failText}</p>
        </div>
      )}

      {result?.status === 'bad_format' && (
        <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <p className="font-semibold text-neutral-800">{t.verify.formatTitle}</p>
          <p className="mt-1 text-sm text-neutral-600">{t.verify.formatText}</p>
        </div>
      )}
    </div>
  )
}
