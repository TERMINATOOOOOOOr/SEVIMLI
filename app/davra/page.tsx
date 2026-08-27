import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { getNewProducts } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import DavraView from '@/components/davra/DavraView'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = { title: 'Davra — круг подруг · Dugonalar davrasi' }

export default async function DavraPage() {
  const { t } = await getT()
  const products = await getNewProducts(100)

  return (
    <div className="relative isolate overflow-x-clip">
      {/* Тюбики в невесомости на заднем плане */}
      <WeightlessBg seed={5} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
            <Users size={16} /> Davra
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold text-neutral-900">{t.davra.title}</h1>
          <p className="mt-2 max-w-2xl text-neutral-600">{t.davra.subtitle}</p>
        </header>

        <DavraView products={products} />
      </div>
    </div>
  )
}
