import type { Metadata } from 'next'
import { Bike } from 'lucide-react'
import { getT } from '@/lib/lang-server'
import CourierApp from '@/components/courier/CourierApp'
import SoftGlow from '@/components/ui/SoftGlow'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = { title: 'Кабинет курьера · Kuryer kabineti' }

export default async function CourierPage() {
  const { t } = await getT()

  return (
    <div className="relative isolate mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <SoftGlow variant="mint" />
      <WeightlessBg seed={2} />
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
          <Bike size={16} /> {t.courier.badge}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-neutral-900">{t.courier.title}</h1>
      </header>

      <CourierApp />
    </div>
  )
}
