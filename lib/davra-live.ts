import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/utils'
import type { Circle, CircleState } from '@/lib/types'
import { CIRCLE_WITH_ALL, normalizeCircle } from '@/lib/davra-select'

/**
 * Davra в боевом режиме: круги в Supabase (circles / circle_members / circle_items, миграция 010).
 * createClient() создаётся внутри функций — в демо-режиме модуль импортируется, но не вызывается.
 */

export const DAVRA_LIVE = isSupabaseConfigured()

export type DavraErrorCode =
  | 'auth'
  | 'not_found'
  | 'full'
  | 'owner_only'
  | 'owner_cannot_leave'
  | 'limit'
  | 'forbidden'
  | 'unknown'

export class DavraError extends Error {
  code: DavraErrorCode
  constructor(code: DavraErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

export function mapDavraError(e: unknown): DavraError {
  if (e instanceof DavraError) return e
  const err = e as { code?: string; message?: string }
  const msg = err?.message ?? ''
  if (/circle_full/.test(msg)) return new DavraError('full', msg)
  if (/owner_cannot_leave/.test(msg)) return new DavraError('owner_cannot_leave', msg)
  if (/owner only|cannot remove owner/.test(msg)) return new DavraError('owner_only', msg)
  if (/circle_limit_exceeded/.test(msg)) return new DavraError('limit', msg)
  if (err?.code === 'P0002' || /circle_not_found/.test(msg) || err?.code === 'PGRST116')
    return new DavraError('not_found', msg)
  // «Не залогинена» ≠ «нет прав»: RLS-отказ у залогиненной (удалили из круга и т.п.) не должен выбрасывать на вход
  if (/not authenticated|JWT|jwt expired/i.test(msg)) return new DavraError('auth', msg)
  if (err?.code === '42501' || /row-level security|not a member/i.test(msg)) return new DavraError('forbidden', msg)
  if (err?.code === '23505') return new DavraError('forbidden', msg)
  return new DavraError('unknown', msg)
}

export async function fetchCircle(id: string): Promise<Circle | null> {
  const { data, error } = await createClient().from('circles').select(CIRCLE_WITH_ALL).eq('id', id).maybeSingle()
  if (error) throw mapDavraError(error)
  return data ? normalizeCircle(data) : null
}

export async function fetchMyCircles(): Promise<Circle[]> {
  const { data, error } = await createClient()
    .from('circles')
    .select(CIRCLE_WITH_ALL)
    .order('created_at', { ascending: false })
  if (error) throw mapDavraError(error)
  return (data ?? []).map(normalizeCircle)
}

/** Только id и имена моих кругов — для кнопки «В корзину круга» (без участниц и товаров). */
export async function fetchMyCircleHeads(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await createClient()
    .from('circles')
    .select('id, name')
    .order('created_at', { ascending: false })
  if (error) throw mapDavraError(error)
  return (data ?? []) as { id: string; name: string }[]
}

/** Прогресс кругов к порогу (корзина + уже оформленные заказы круга). Ошибку по отдельному кругу пропускаем. */
export async function fetchCircleStates(ids: string[]): Promise<Record<string, CircleState>> {
  const supabase = createClient()
  const out: Record<string, CircleState> = {}
  await Promise.all(
    ids.map(async (id) => {
      const { data, error } = await supabase.rpc('circle_state', { p_circle: id })
      if (!error && data) out[id] = data as CircleState
    }),
  )
  return out
}

export async function createCircle(name: string): Promise<string> {
  const { data, error } = await createClient().rpc('create_circle', { p_name: name })
  if (error) throw mapDavraError(error)
  return data as string
}

export async function joinCircle(code: string): Promise<string> {
  const { data, error } = await createClient().rpc('join_circle', { p_code: code })
  if (error) throw mapDavraError(error)
  return data as string
}

export async function renameCircle(id: string, name: string): Promise<void> {
  const { error } = await createClient().from('circles').update({ name: name.trim().slice(0, 60) }).eq('id', id)
  if (error) throw mapDavraError(error)
}

export async function dissolveCircle(id: string): Promise<void> {
  const { error } = await createClient().from('circles').delete().eq('id', id)
  if (error) throw mapDavraError(error)
}

export async function removeMember(circleId: string, userId: string): Promise<void> {
  const { error } = await createClient().rpc('remove_member', { p_circle: circleId, p_user: userId })
  if (error) throw mapDavraError(error)
}

export async function leaveCircle(circleId: string): Promise<void> {
  const { error } = await createClient().rpc('leave_circle', { p_circle: circleId })
  if (error) throw mapDavraError(error)
}

/** Позиция в общей корзине: одна строка на (круг, участница, товар); повтор — +1. */
export async function addCircleItem(circleId: string, productId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('circle_items')
    .insert({ circle_id: circleId, user_id: userId, product_id: productId, qty: 1 })
  if (!error) return
  // Позиция уже есть (в т.ч. двойной клик) → +1 к количеству
  if (error.code === '23505') {
    const { data: existing, error: selErr } = await supabase
      .from('circle_items')
      .select('id, qty')
      .eq('circle_id', circleId)
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()
    if (selErr) throw mapDavraError(selErr)
    if (existing) {
      const { error: upErr } = await supabase
        .from('circle_items')
        .update({ qty: Math.min(50, existing.qty + 1) })
        .eq('id', existing.id)
      if (upErr) throw mapDavraError(upErr)
      return
    }
  }
  throw mapDavraError(error)
}

export async function setCircleItemQty(itemId: string, qty: number): Promise<void> {
  const supabase = createClient()
  if (qty <= 0) {
    const { error } = await supabase.from('circle_items').delete().eq('id', itemId)
    if (error) throw mapDavraError(error)
    return
  }
  const { error } = await supabase.from('circle_items').update({ qty: Math.min(50, qty) }).eq('id', itemId)
  if (error) throw mapDavraError(error)
}

export async function removeCircleItem(itemId: string): Promise<void> {
  const { error } = await createClient().from('circle_items').delete().eq('id', itemId)
  if (error) throw mapDavraError(error)
}
