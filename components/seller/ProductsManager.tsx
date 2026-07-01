'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import type { Product } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/format'
import { categoryEmoji } from '@/lib/categories'
import { cn } from '@/lib/utils'
import Thumb from '@/components/ui/Thumb'
import ProductForm from '@/components/seller/ProductForm'

export default function ProductsManager({
  shopId,
  initialProducts,
}: {
  shopId: string
  initialProducts: Product[]
}) {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setFormOpen(true)
  }

  function onSaved(saved: Product) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
    })
    setFormOpen(false)
  }

  async function remove(id: string) {
    if (!confirm('Удалить товар?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  async function toggle(p: Product) {
    const next = !p.is_active
    await supabase.from('products').update({ is_active: next }).eq('id', p.id)
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: next } : x)))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-neutral-900">Мои товары</h1>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} /> Добавить товар
        </button>
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
          Товаров пока нет. Добавьте первый!
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="p-3 font-medium">Товар</th>
                <th className="hidden p-3 font-medium sm:table-cell">Цена</th>
                <th className="hidden p-3 font-medium sm:table-cell">Склад</th>
                <th className="p-3 font-medium">Статус</th>
                <th className="p-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                        <Thumb src={p.images?.[0]} emoji={categoryEmoji(p.category_slug)} />
                      </div>
                      <span className="line-clamp-1 font-medium text-neutral-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="hidden p-3 sm:table-cell">{formatPrice(p.price)}</td>
                  <td className="hidden p-3 sm:table-cell">{p.stock}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        p.is_active ? 'bg-secondary-light text-secondary' : 'bg-neutral-100 text-neutral-500',
                      )}
                    >
                      {p.is_active ? 'Активен' : 'Скрыт'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggle(p)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100" title="Показать/скрыть">
                        {p.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100" title="Редактировать">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => remove(p.id)} className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-500" title="Удалить">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <ProductForm shopId={shopId} initial={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />
      )}
    </div>
  )
}
