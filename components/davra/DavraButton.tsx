'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Check } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useDavra, DAVRA_ME } from '@/store/davra'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'

/**
 * «В корзину круга» на странице товара.
 * Круга нет — ведём на /davra создавать; есть — добавляем и показываем галочку.
 */
export default function DavraButton({ product }: { product: Product }) {
  const mounted = useHasMounted()
  const router = useRouter()
  const { t } = useLang()
  const circle = useDavra((s) => s.circle)
  const addItem = useDavra((s) => s.addItem)
  const [added, setAdded] = useState(false)

  if (!mounted) return null

  function onClick() {
    if (!circle) {
      router.push('/davra')
      return
    }
    addItem(product.id, DAVRA_ME)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <button onClick={onClick} className="btn-outline mt-3 w-full !py-2.5 text-sm">
      {added ? <Check size={16} className="text-secondary" /> : <Users size={16} />}
      {t.davra.btn}
    </button>
  )
}
