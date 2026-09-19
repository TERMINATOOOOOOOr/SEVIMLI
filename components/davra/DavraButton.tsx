'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Users, Check } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useDavra, DAVRA_ME } from '@/store/davra'
import { DAVRA_LIVE, fetchMyCircleHeads, addCircleItem, mapDavraError } from '@/lib/davra-live'
import { createClient } from '@/lib/supabase/client'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'

/**
 * «В корзину круга» на странице товара.
 * Демо: круг в localStorage. Live: гость → вход; нет круга → /davra; иначе — в самый свежий круг.
 */
export default function DavraButton({ product }: { product: Product }) {
  const mounted = useHasMounted()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLang()
  const circle = useDavra((s) => s.circle)
  const addItem = useDavra((s) => s.addItem)
  const [added, setAdded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  if (!mounted) return null

  function flash() {
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  async function onClick() {
    if (!DAVRA_LIVE) {
      if (!circle) {
        router.push('/davra')
        return
      }
      addItem(product.id, DAVRA_ME)
      flash()
      return
    }
    setBusy(true)
    setHint(null)
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser()
      if (!user) {
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`)
        return
      }
      const circles = await fetchMyCircleHeads()
      if (circles.length === 0) {
        router.push('/davra')
        return
      }
      await addCircleItem(circles[0].id, product.id, user.id)
      setHint(`${t.davra.itemAdded} «${circles[0].name}»`)
      flash()
    } catch (e) {
      const err = mapDavraError(e)
      if (err.code === 'auth') router.push(`/auth?redirect=${encodeURIComponent(pathname)}`)
      else setHint(t.davra.actionFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3">
      <button onClick={onClick} disabled={busy} className="btn-outline w-full !py-2.5 text-sm">
        {added ? <Check size={16} className="text-secondary" /> : <Users size={16} />}
        {t.davra.btn}
      </button>
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
