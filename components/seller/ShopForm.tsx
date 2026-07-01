'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import type { Shop } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABEL } from '@/lib/categories'
import Thumb from '@/components/ui/Thumb'

const CITIES = ['Ташкент', 'Самарканд', 'Бухара', 'Андижан', 'Наманган', 'Фергана']

export default function ShopForm({ userId, shop }: { userId: string; shop: Shop | null }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(shop?.name ?? '')
  const [description, setDescription] = useState(shop?.description ?? '')
  const [categorySlug, setCategorySlug] = useState(shop?.category_slug ?? 'clothes')
  const [city, setCity] = useState(shop?.city ?? 'Ташкент')
  const [phone, setPhone] = useState(shop?.phone ?? '')
  const [instagram, setInstagram] = useState(shop?.instagram ?? '')
  const [logoUrl, setLogoUrl] = useState(shop?.logo_url ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  async function uploadLogo(): Promise<string> {
    if (!logoFile) return logoUrl
    const path = `${userId}/${Date.now()}-${logoFile.name}`
    const { error: upErr } = await supabase.storage.from('shops').upload(path, logoFile, { upsert: true })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('shops').getPublicUrl(path)
    return data.publicUrl
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSavedMsg(null)
    setSaving(true)
    try {
      const logo = await uploadLogo()
      const payload = {
        owner_id: userId,
        name,
        description: description || null,
        category_slug: categorySlug,
        city,
        phone: phone || null,
        instagram: instagram || null,
        logo_url: logo || null,
      }

      if (shop) {
        const { error: dbErr } = await supabase.from('shops').update(payload).eq('id', shop.id)
        if (dbErr) throw dbErr
      } else {
        const { error: dbErr } = await supabase.from('shops').insert(payload)
        if (dbErr) throw dbErr
      }
      setSavedMsg('Сохранено')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить магазин')
    } finally {
      setSaving(false)
    }
  }

  const previewLogo = logoFile ? URL.createObjectURL(logoFile) : logoUrl || null

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-neutral-900">
        {shop ? 'Настройки магазина' : 'Создание магазина'}
      </h1>

      <form onSubmit={onSubmit} className="max-w-lg space-y-4">
        {/* Логотип */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200">
            <Thumb src={previewLogo} emoji="🏬" />
          </div>
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline !py-2 text-sm">
              <Upload size={16} /> Загрузить логотип
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Название *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input resize-none" />
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
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Город</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Телефон</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 …" className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Instagram</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username" className="input" />
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
          {savedMsg && <span className="text-sm text-secondary">{savedMsg}</span>}
        </div>
      </form>
    </div>
  )
}
