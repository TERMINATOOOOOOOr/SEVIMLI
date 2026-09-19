'use client'

import { useEffect, useState } from 'react'
import { Wallet, Copy, Check, TriangleAlert } from 'lucide-react'
import type { Shop, ShopPayMode } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

/**
 * Приём оплаты магазином. Деньги идут на кассу магазина напрямую, SEVIMLI их не держит.
 * Реквизиты кассы публичны (по ним строится ссылка на оплату), ключи вебхука лежат
 * в отдельной таблице и видны только владельцу магазина.
 */
export default function PaymentSettings({ shop, demo = false }: { shop: Shop; demo?: boolean }) {
  const supabase = createClient()
  const [provider, setProvider] = useState<ShopPayMode>(shop.payment_provider ?? 'none')
  const [paymeId, setPaymeId] = useState(shop.payme_merchant_id ?? '')
  const [paymeField, setPaymeField] = useState(shop.payme_account_field ?? 'order_id')
  const [paymeKey, setPaymeKey] = useState('')
  const [clickService, setClickService] = useState(shop.click_service_id ?? '')
  const [clickMerchant, setClickMerchant] = useState(shop.click_merchant_id ?? '')
  const [clickSecret, setClickSecret] = useState('')
  const [payUrl, setPayUrl] = useState(shop.payment_url ?? '')
  const [note, setNote] = useState(shop.payment_note ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const hooks =
    provider === 'payme'
      ? [{ label: 'Endpoint для кассы Payme', url: `${origin}/api/pay/payme` }]
      : provider === 'click'
        ? [
            { label: 'Prepare URL', url: `${origin}/api/pay/click/prepare` },
            { label: 'Complete URL', url: `${origin}/api/pay/click/complete` },
          ]
        : []

  useEffect(() => {
    if (demo) return
    let cancelled = false
    supabase
      .from('shop_payment_secrets')
      .select('payme_key, click_secret_key')
      .eq('shop_id', shop.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return
        setPaymeKey((data.payme_key as string) ?? '')
        setClickSecret((data.click_secret_key as string) ?? '')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.id, demo])

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* клипборд недоступен */
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(null)
    if (demo) {
      setSaved('Демо-режим: реквизиты не сохраняются до подключения базы')
      return
    }
    setSaving(true)
    try {
      const { error: shopErr } = await supabase
        .from('shops')
        .update({
          payment_provider: provider,
          payme_merchant_id: paymeId.trim() || null,
          payme_account_field: paymeField.trim() || 'order_id',
          click_service_id: clickService.trim() || null,
          click_merchant_id: clickMerchant.trim() || null,
          payment_url: payUrl.trim() || null,
          payment_note: note.trim() || null,
        })
        .eq('id', shop.id)
      if (shopErr) throw shopErr

      const { error: secErr } = await supabase.from('shop_payment_secrets').upsert({
        shop_id: shop.id,
        payme_key: paymeKey.trim() || null,
        click_secret_key: clickSecret.trim() || null,
        updated_at: new Date().toISOString(),
      })
      if (secErr) throw secErr
      setSaved('Сохранено')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const noKey = (provider === 'payme' && !paymeKey.trim()) || (provider === 'click' && !clickSecret.trim())

  return (
    <form onSubmit={save} className="mt-8 rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-center gap-2">
        <Wallet size={20} className="text-primary" />
        <h2 className="font-semibold text-neutral-900">Приём оплаты</h2>
      </div>
      <p className="mt-1.5 text-sm text-neutral-600">
        Деньги приходят на вашу кассу напрямую. SEVIMLI платежи не принимает и комиссию с них не берёт: площадка
        только показывает покупательнице кнопку оплаты вашего заказа.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Способ оплаты</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value as ShopPayMode)} className="input">
            <option value="none">Только при получении</option>
            <option value="payme">Payme (касса магазина)</option>
            <option value="click">Click (касса магазина)</option>
            <option value="link">Своя ссылка на оплату</option>
          </select>
        </div>

        {provider === 'payme' && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Merchant ID кассы</label>
              <input value={paymeId} onChange={(e) => setPaymeId(e.target.value)} className="input" placeholder="например, 65f1c0…" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Название поля счёта</label>
              <input value={paymeField} onChange={(e) => setPaymeField(e.target.value)} className="input" placeholder="order_id" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Ключ кассы (для подтверждения оплаты)</label>
              <input type="password" value={paymeKey} onChange={(e) => setPaymeKey(e.target.value)} className="input" autoComplete="off" />
            </div>
          </>
        )}

        {provider === 'click' && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Service ID</label>
              <input value={clickService} onChange={(e) => setClickService(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Merchant ID</label>
              <input value={clickMerchant} onChange={(e) => setClickMerchant(e.target.value)} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Секретный ключ (для подтверждения оплаты)</label>
              <input type="password" value={clickSecret} onChange={(e) => setClickSecret(e.target.value)} className="input" autoComplete="off" />
            </div>
          </>
        )}

        {provider === 'link' && (
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Ссылка на оплату</label>
            <input value={payUrl} onChange={(e) => setPayUrl(e.target.value)} className="input" placeholder="https://…" />
            <p className="mt-1 text-xs text-neutral-500">
              Покупательница перейдёт по ней и оплатит вам. Оплату отмечаете вы сами в разделе «Заказы».
            </p>
          </div>
        )}

        {provider !== 'none' && (
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Подпись под кнопкой оплаты</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="input" placeholder="например: оплата до 18:00, потом доставка завтра" />
          </div>
        )}
      </div>

      {hooks.length > 0 && (
        <div className="mt-4 rounded-xl bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-800">Адреса для кабинета {provider === 'payme' ? 'Payme' : 'Click'}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Впишите их в настройках своей кассы. Тогда оплата будет отмечаться автоматически.
          </p>
          <div className="mt-3 space-y-2">
            {hooks.map((h) => (
              <div key={h.url} className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-xs text-neutral-500">{h.label}</span>
                <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2 py-1.5 text-xs text-neutral-700">{h.url}</code>
                <button type="button" onClick={() => copy(h.url)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-white hover:text-primary" aria-label="Скопировать">
                  {copied === h.url ? <Check size={15} className="text-secondary" /> : <Copy size={15} />}
                </button>
              </div>
            ))}
          </div>
          {noKey && (
            <p className="mt-3 flex items-start gap-2 text-xs text-amber-700">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" />
              Пока ключ не введён, оплата работает, но отмечать её нужно вручную в разделе «Заказы».
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {saved && <span className="text-sm text-secondary">{saved}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  )
}
