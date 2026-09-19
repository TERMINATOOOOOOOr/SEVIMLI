import type { Metadata } from 'next'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { getCirclePreview, getViewer } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import JoinCircle from '@/components/davra/JoinCircle'

export const metadata: Metadata = { title: 'Приглашение в Davra' }
export const dynamic = 'force-dynamic'

/** Ссылка-приглашение: превью круга и кнопка «Присоединиться» (гость → вход с возвратом сюда). */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { t } = await getT()
  const [preview, viewer] = await Promise.all([getCirclePreview(code), getViewer()])

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-primary-light via-white to-secondary-light p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
          <Users size={16} /> Davra
        </span>
        {preview ? (
          <>
            <h1 className="mt-4 font-display text-2xl font-bold text-neutral-900">{t.davra.joinTitle}</h1>
            <p className="mt-3 font-display text-3xl font-bold text-primary">{preview.name}</p>
            <p className="mt-1 text-sm text-neutral-600">
              {t.davra.joinBy}: {preview.owner_name} · {preview.members} / 6 {t.davra.joinMembers}
            </p>
            <div className="mt-6">
              <JoinCircle code={code} preview={preview} viewer={viewer} />
            </div>
            {preview.is_member && <p className="mt-3 text-xs text-neutral-500">{t.davra.alreadyMember}</p>}
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-2xl font-bold text-neutral-900">{t.davra.joinNotFound}</h1>
            <Link href="/davra" className="btn-primary mt-6">
              {t.davra.title}
            </Link>
          </>
        )}
      </div>
      <p className="mt-6 text-sm text-neutral-500">{t.davra.subtitle}</p>
    </div>
  )
}
