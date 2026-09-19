import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, LogIn } from 'lucide-react'
import { getNewProducts, getMyCircles, getCircleStates, getViewer } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { isSupabaseConfigured } from '@/lib/utils'
import DavraView from '@/components/davra/DavraView'
import DavraLive from '@/components/davra/DavraLive'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = { title: 'Davra — круг подруг · Dugonalar davrasi' }
export const dynamic = 'force-dynamic'

export default async function DavraPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { t } = await getT()
  const live = isSupabaseConfigured()
  const [products, viewer, circles, sp] = await Promise.all([
    getNewProducts(100),
    live ? getViewer() : Promise.resolve(null),
    live ? getMyCircles() : Promise.resolve([]),
    searchParams,
  ])
  const states = live ? await getCircleStates(circles.map((c) => c.id)) : {}

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

        {!live ? (
          <DavraView products={products} />
        ) : viewer ? (
          <DavraLive
            key={sp.c ?? 'default'}
            circles={circles}
            states={states}
            viewer={viewer}
            products={products}
            initialActiveId={sp.c ?? null}
          />
        ) : (
          <div className="mx-auto max-w-2xl">
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-neutral-600">{t.davra.loginToDavra}</p>
              <Link href={`/auth?redirect=${encodeURIComponent('/davra')}`} className="btn-primary !py-2.5 text-sm">
                <LogIn size={16} /> {t.community.loginCta}
              </Link>
            </div>
            <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
              <h3 className="font-semibold text-neutral-900">{t.davra.how}</h3>
              <ol className="mt-3 space-y-2.5">
                {[t.davra.how1, t.davra.how2, t.davra.how3, t.davra.how4].map((step, i) => (
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
        )}
      </div>
    </div>
  )
}
