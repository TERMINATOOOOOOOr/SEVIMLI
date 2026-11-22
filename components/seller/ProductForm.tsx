'use client'

import { useRef, useState } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABEL, expiryMode, defaultPrecision } from '@/lib/categories'
import { COUNTRIES, countryName } from '@/lib/product-i18n'
import { mapTrustError } from '@/lib/trust-errors'
import { useLang } from '@/components/LangProvider'
import Thumb from '@/components/ui/Thumb'
import ExpiryFields, { type ExpiryValue } from '@/components/seller/ExpiryFields'

interface Props {
  shopId: string
  initial: Product | null
  onClose: () => void
  onSaved: (product: Product) => void
  /** Импорт магазина подтверждён администратором — можно ставить метку «оригинал». */
  originalVerified: boolean
}

const MAX_IMAGES = 5

export default function ProductForm({ shopId, initial, onClose, onSaved, originalVerified }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const { lang, t } = useLang()
  const s = t.seller

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [oldPrice, setOldPrice] = useState(initial?.old_price?.toString() ?? '')
  const [categorySlug, setCategorySlug] = useState(initial?.category_slug ?? 'clothes')
  const [stock, setStock] = useState(initial?.stock?.toString() ?? '0')
  // Остаток при правке уходит, только если его меняли: иначе затёрли бы списания заказов
  const [stockTouched, setStockTouched] = useState(false)
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [country, setCountry] = useState(initial?.country ?? '')
  const [isOriginal, setIsOriginal] = useState(Boolean(initial?.is_original))
  const [expiry, setExpiry] = useState<ExpiryValue>({
    expires_on: initial?.expires_on ?? null,
    expires_precision: initial?.expires_precision ?? defaultPrecision(initial?.category_slug ?? 'clothes'),
    made_on: initial?.made_on ?? null,
    pao_months: initial?.pao_months ?? null,
    no_expiry: Boolean(initial?.no_expiry),
  })
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list)
    const room = MAX_IMAGES - images.length - files.length
    setFiles((prev) => [...prev, ...incoming.slice(0, Math.max(0, room))])
  }

  async function uploadFiles(): Promise<string[]> {
    const urls: string[] = []
    if (files.length === 0) return urls
    // Политика Storage (004): первая папка пути обязана быть id пользователя, а не магазина
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      const message = lang === 'uz'
        ? 'Sessiya tugadi — qaytadan kiring'
        : lang === 'en'
          ? 'Your session expired — please sign in again'
          : 'Сессия истекла — войдите заново'
      throw new Error(message)
    }
    for (const file of files) {
      // Имя файла не доверяем (кириллица/пробелы ломают ключ) — берём только безопасное расширение
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg'
      const path = `${user.id}/${shopId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: upErr } = await supabase.storage.from('products').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('products').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  const mode = expiryMode(categorySlug)
  const expiryGiven = expiry.no_expiry || expiry.expires_on !== null || expiry.made_on !== null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (mode === 'required' && !expiryGiven) {
      setError(s.expiryNeed)
      return
    }
    setSaving(true)
    try {
      const uploaded = files.length ? await uploadFiles() : []
      const keepExpiry = mode !== 'hidden'
      const payload: Record<string, unknown> = {
        shop_id: shopId,
        name,
        description: description || null,
        price: Number(price),
        old_price: oldPrice ? Number(oldPrice) : null,
        category_slug: categorySlug,
        images: [...images, ...uploaded],
        brand: brand.trim() || null,
        country: country || null,
        is_original: originalVerified ? isOriginal : Boolean(initial?.is_original),
        expires_on: keepExpiry ? expiry.expires_on : null,
        expires_precision: keepExpiry && expiry.expires_on ? expiry.expires_precision : 'month',
        made_on: keepExpiry ? expiry.made_on : null,
        pao_months: keepExpiry && expiry.made_on ? expiry.pao_months : null,
        no_expiry: keepExpiry ? expiry.no_expiry : false,
      }
      if (!initial || stockTouched) payload.stock = Number(stock) || 0

      const query = initial
        ? supabase.from('products').update(payload).eq('id', initial.id).select('*').single()
        : supabase.from('products').insert(payload).select('*').single()

      const { data, error: dbErr } = await query
      if (dbErr) throw dbErr
      onSaved(data as Product)
    } catch (err) {
      const mapped = mapTrustError(err)
      if (mapped.code === 'product_limit') setError(s.errLimit)
      else if (err instanceof Error) setError(err.message)
      else setError(s.errSave)
    } finally {
      setSaving(false)
    }
  }

  const totalImages = images.length + files.length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">
            {initial ? 'Редактировать товар' : 'Новый товар'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Название *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Цена, сум *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Старая цена</label>
              <input type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Категория</label>
              <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="input">
                {Object.entries(CATEGORY_LABEL).map(([slug, label]) => (
                  <option key={slug} value={slug}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">На складе</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value)
                  setStockTouched(true)
                }}
                className="input"
              />
            </div>
          </div>

          {mode !== 'hidden' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">{s.brand}</label>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={60} className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">{s.country}</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="input">
                  <option value="">{s.countryNone}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {countryName(c.value, lang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {mode !== 'hidden' && (
            <ExpiryFields value={expiry} onChange={setExpiry} required={mode === 'required'} />
          )}

          {mode !== 'hidden' && (
            <div className="rounded-xl bg-neutral-50 p-3">
              <label className={`flex items-center gap-2 text-sm font-medium ${originalVerified ? 'text-neutral-800' : 'text-neutral-400'}`}>
                <input
                  type="checkbox"
                  checked={isOriginal}
                  disabled={!originalVerified}
                  onChange={(e) => setIsOriginal(e.target.checked)}
                />
                {s.original}
              </label>
              <p className="mt-1 text-xs text-neutral-500">{originalVerified ? s.originalOn : s.originalOff}</p>
            </div>
          )}

          {/* Фото */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Фото (до {MAX_IMAGES})
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                addFiles(e.dataTransfer.files)
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 py-6 text-neutral-400 hover:border-primary"
            >
              <Upload size={22} />
              <span className="text-sm">Перетащите или выберите файлы</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />

            {totalImages > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((src, i) => (
                  <div key={`u-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-200">
                    <Thumb src={src} />
                    <button
                      type="button"
                      onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-0 top-0 rounded-bl bg-black/50 p-0.5 text-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {files.map((f, i) => (
                  <div key={`f-${i}`} className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 text-[10px] text-neutral-500">
                    <span className="line-clamp-2 px-1 text-center">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-0 top-0 rounded-bl bg-black/50 p-0.5 text-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
