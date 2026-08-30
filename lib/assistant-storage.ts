'use client'

/**
 * Хранилище переписок с Севилёй (Phase 2 — несколько диалогов, как в GPT).
 * Демо: держим в localStorage, ключ — по email пользователя.
 * Гости (без email) не сохраняются — их чат живёт только в памяти.
 *
 * Когда подключите реальный Supabase (DEPLOY.md): заменить на таблицу
 * `assistant_conversations` (id, user_id, title, messages jsonb, updated_at).
 */

export interface Conversation<M = unknown> {
  id: string
  title: string
  messages: M[]
  updatedAt: number
}

export interface ChatStore<M = unknown> {
  list: Conversation<M>[]
  activeId: string
}

const PREFIX = 'sevimli-chats:' // Phase 2
const LEGACY_PREFIX = 'sevimli-chat:' // Phase 1 (один диалог) — мигрируем

function keyFor(email?: string | null): string | null {
  return email ? PREFIX + email.trim().toLowerCase() : null
}

export function loadChats<M>(email?: string | null): ChatStore<M> | null {
  const key = keyFor(email)
  if (!key || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && Array.isArray(data.list)) return data as ChatStore<M>
    }
    // Миграция с Phase 1: один сохранённый диалог → список из одного.
    const legacyKey = LEGACY_PREFIX + email!.trim().toLowerCase()
    const legacyRaw = window.localStorage.getItem(legacyKey)
    if (legacyRaw) {
      const msgs = JSON.parse(legacyRaw)
      if (Array.isArray(msgs) && msgs.length > 0) {
        const store: ChatStore<M> = {
          list: [{ id: 'legacy', title: '', messages: msgs as M[], updatedAt: 0 }],
          activeId: 'legacy',
        }
        window.localStorage.setItem(key, JSON.stringify(store))
        window.localStorage.removeItem(legacyKey)
        return store
      }
    }
    return null
  } catch {
    return null
  }
}

export function saveChats<M>(email: string | null | undefined, store: ChatStore<M>): void {
  const key = keyFor(email)
  if (!key || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(store))
  } catch {
    /* переполнение квоты / сериализация — тихо игнорируем */
  }
}

export function clearChats(email?: string | null): void {
  const key = keyFor(email)
  if (!key || typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
