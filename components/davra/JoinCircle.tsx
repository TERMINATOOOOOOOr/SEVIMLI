'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, LogIn } from 'lucide-react'
import type { CirclePreview, Viewer } from '@/lib/types'
import { joinCircle, mapDavraError } from '@/lib/davra-live'
import { useLang } from '@/components/LangProvider'

/** Кнопка «Присоединиться» на странице приглашения /davra/join/<code>. */
export default function JoinCircle({ code, preview, viewer }: { code: string; preview: CirclePreview; viewer: Viewer | null }) {
  const router = useRouter()
  const { t } = useLang()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!viewer) {
    return (
      <Link href={`/auth?redirect=${encodeURIComponent(`/davra/join/${code}`)}`} className="btn-primary">
        <LogIn size={16} /> {t.davra.joinLogin}
      </Link>
    )
  }
  if (preview.is_member) {
    return (
      <Link href={`/davra?c=${preview.id}`} className="btn-primary">
        <Users size={16} /> {t.davra.goToCircle}
      </Link>
    )
  }
  if (preview.is_full) return <p className="text-sm text-neutral-500">{t.davra.joinFull}</p>

  async function join() {
    setBusy(true)
    setError(null)
    try {
      const id = await joinCircle(code)
      router.push(`/davra?c=${id}`)
    } catch (e) {
      const err = mapDavraError(e)
      if (err.code === 'auth') {
        router.push(`/auth?redirect=${encodeURIComponent(`/davra/join/${code}`)}`)
        return
      }
      setError(err.code === 'full' ? t.davra.joinFull : err.code === 'not_found' ? t.davra.joinNotFound : t.davra.actionFailed)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={join} disabled={busy} className="btn-primary">
        <Users size={16} /> {t.davra.join}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
