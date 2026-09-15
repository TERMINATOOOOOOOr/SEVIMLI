import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { getOriginalProducts } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { isSupabaseConfigured } from '@/lib/utils'
import VerifyWidget from '@/components/VerifyWidget'
import SoftGlow from '@/components/ui/SoftGlow'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = { title: 'Проверка подлинности · Asllikni tekshirish' }

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const { t } = await getT()
  const products = await getOriginalProducts(50)

  return (
    <div className="relative isolate mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <SoftGlow variant="mint" />
      <WeightlessBg seed={2} />
      <span className="inline-flex items-center gap-2 rounded-full bg-secondary-light px-4 py-1.5 text-sm font-medium text-secondary">
        <ShieldCheck size={16} /> 100% Original
      </span>
      <h1 className="mt-4 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
        {t.verify.title}
      </h1>
      <p className="mt-3 text-neutral-600">{t.verify.subtitle}</p>

      <div className="mt-8">
        <VerifyWidget products={products} initialCode={code ?? ''} demo={!isSupabaseConfigured()} />
      </div>

      <div className="mt-10 rounded-2xl border border-neutral-200 p-5">
        <h2 className="font-semibold text-neutral-900">{t.verify.howTitle}</h2>
        <ol className="mt-3 space-y-2.5">
          {t.verify.how.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-neutral-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
