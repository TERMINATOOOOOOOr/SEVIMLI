import type { Metadata } from 'next'
import { Bot } from 'lucide-react'
import { getOriginalProducts, getNewProducts } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import AssistantChat from '@/components/assistant/AssistantChat'
import SoftGlow from '@/components/ui/SoftGlow'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = { title: 'Севиля — подбор ухода · Sevilya' }

export default async function AssistantPage() {
  const { t } = await getT()
  // Каталог для рекомендаций: K-beauty + остальное (витамин C и т.п.)
  const [original, fresh] = await Promise.all([getOriginalProducts(20), getNewProducts(50)])
  const seen = new Set<string>()
  const products = [...original, ...fresh].filter((p) =>
    seen.has(p.id) ? false : (seen.add(p.id), true),
  )

  return (
    <div className="relative isolate mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <SoftGlow variant="rose" />
      <WeightlessBg seed={1} />
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
          <Bot size={16} /> AI beta
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
          {t.assistant.title}
        </h1>
        <p className="mt-2 text-neutral-600">{t.assistant.subtitle}</p>
      </header>

      <AssistantChat products={products} />

      <p className="mt-4 text-xs leading-relaxed text-neutral-400">{t.assistant.disclaimer}</p>
    </div>
  )
}
