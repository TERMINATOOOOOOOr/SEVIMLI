import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Клиент с сервисным ключом: обходит RLS. Только для серверных обработчиков, которым
 * нужно действовать от имени системы (вебхуки платёжных провайдеров). Никогда не импортировать
 * в клиентские компоненты. Возвращает null, если ключей нет (демо-режим).
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) return null
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
