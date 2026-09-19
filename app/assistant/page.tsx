import type { Metadata } from 'next'
import { Bot } from 'lucide-react'
import { getAssistantCatalog, getMyAssistantChats, getViewer } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import AssistantChat from '@/components/assistant/AssistantChat'
import SoftGlow from '@/components/ui/SoftGlow'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = { title: 'Севиля — подбор ухода · Sevilya' }
export const dynamic = 'force-dynamic'

export default async function AssistantPage() {
  const { t } = await getT()
  // Тот же каталог, что видит Севиля на сервере: маркеры карточек [[p:<id>]] в ответах всегда находят товар
  const [products, viewer, chats] = await Promise.all([getAssistantCatalog(150), getViewer(), getMyAssistantChats()])

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
        <p className="mt-1 text-xs text-neutral-400">{t.assistant.aiNote}</p>
      </header>

      <AssistantChat products={products} viewer={viewer} initialChats={chats} />

      <p className="mt-4 text-xs leading-relaxed text-neutral-400">{t.assistant.disclaimer}</p>
    </div>
  )
}
