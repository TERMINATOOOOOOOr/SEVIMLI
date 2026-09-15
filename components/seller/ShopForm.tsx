'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Truck } from 'lucide-react'
import type { Shop } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/utils'
import { CATEGORY_LABEL } from '@/lib/categories'
import Thumb from '@/components/ui/Thumb'

const CITIES = ['Ташкент', 'Самарканд', 'Бухара', 'Андижан', 'Наманган', 'Фергана']

export default function ShopForm({ userId, shop }: { userId: string; shop: Shop | null }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const demo = !isSupabaseConfigured()

  const [name, setName] = useState(shop?.name ?? '')
  const [description, setDescription] = useState(shop?.description ?? '')
  const [categorySlug, setCategorySlug] = useState(shop?.category_slug ?? 'clothes')
  const [city, setCity] = useState(shop?.city ?? 'Ташкент')
  const [phone, setPhone] = useState(shop?.phone ?? '')
  const [instagram, setInstagram] = useState(shop?.instagram ?? '')
  const logoUrl = shop?.logo_url ?? ''
  const [logoFile, setLogoFile] = useState<File | null>(null)
  // Доставка: тариф магазина, порог бесплатной доставки, срок, самовывоз
  const [deliveryFee, setDeliveryFee] = useState(String(shop?.delivery_fee ?? 15000))
  const [freeFrom, setFreeFrom] = useState(String(shop?.free_delivery_from ?? 200000))
  const [deliveryDays, setDeliveryDays] = useState(shop?.delivery_days_text ?? 'По Ташкенту — 1–2 дня')
  const [pickupEnabled, setPickupEnabled] = useState(Boolean(shop?.pickup_enabled))
  const [pickupAddress, setPickupAddress] = useState(shop?.pickup_address ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  async function uploadLogo(): Promise<string> {
    if (!logoFile) return logoUrl
    const supabase = createClient()
    const safeName = logoFile.name.replace(/[^A-Za-z0-9._-]/g, '_')
    const path = `${userId}/${Date.now()}-${safeName}`
    const { error: upErr } = await supabase.storage.from('shops').upload(path, logoFile, { upsert: true })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('shops').getPublicUrl(path)
    return data.publicUrl
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSavedMsg(null)
    if (demo) {
      setSavedMsg('Демо-режим: настройки не сохраняются до подключения базы')
      return
    }
    setSaving(true)
    try {
      const logo = await uploadLogo()
      const payload = {
        owner_id: userId,
        name: name.trim(),
        description: description.trim() || null,
        category_slug: categorySlug,
        city,
        phone: phone.trim() || null,
        instagram: instagram.trim() || null,
        logo_url: logo || null,
        delivery_fee: Math.max(0, Number(deliveryFee) || 0),
        free_delivery_from: Math.max(0, Number(freeFrom) || 0),
        delivery_days_text: deliveryDays.trim() || null,
        pickup_enabled: pickupEnabled,
        pickup_address: pickupEnabled ? pickupAddress.trim() || null : null,
      }

      const supabase = createClient()
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
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-neutral-400">JPG, PNG или WebP до 5 МБ</p>
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

        {/* Доставка — её выполняет магазин; эти условия видит покупательница в корзине */}
        <fieldset className="space-y-3 rounded-2xl border border-neutral-200 p-4">
          <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold text-neutral-900">
            <Truck size={15} className="text-primary" /> Доставка и самовывоз
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Стоимость по Ташкенту, сум</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Бесплатно от, сум</label>
              <input
                type="number"
                min={0}
                step={10000}
                value={freeFrom}
                onChange={(e) => setFreeFrom(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Срок доставки</label>
            <input value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} className="input" />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={pickupEnabled}
              onChange={(e) => setPickupEnabled(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Есть самовывоз
          </label>
          {pickupEnabled && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Адрес самовывоза</label>
              <input
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Ташкент, …"
                className="input"
              />
            </div>
          )}
        </fieldset>

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
