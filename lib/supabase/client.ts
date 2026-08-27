import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase-клиент для клиентских (browser) компонентов.
 *
 * ВАЖНО: в демо-режиме (ключей нет) НЕ бросаем исключение — иначе любой
 * компонент, создающий клиент при рендере, роняет страницу на проде
 * («This page couldn't load»). Возвращаем клиент с валидными по формату
 * заглушками: код в демо-ветках его всё равно не вызывает
 * (везде стоят проверки isSupabaseConfigured()).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createBrowserClient(
    url && !url.includes('placeholder') ? url : 'https://demo-placeholder.supabase.co',
    key && !key.includes('placeholder') ? key : 'demo-placeholder-key',
  )
}
