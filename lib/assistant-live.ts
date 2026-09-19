import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/utils'
import type { ChatStore, Conversation } from '@/lib/assistant-storage'

/**
 * История диалогов с Севилёй в боевом режиме: таблица assistant_conversations (миграция 012),
 * RLS — только свои. Запись отложенная (debounce), чтобы стрим ответа не бил по базе на каждом чанке.
 */

export const ASSISTANT_LIVE = isSupabaseConfigured()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_MESSAGES = 80
const DEBOUNCE_MS = 1200

/** id диалогов, которые уже есть в базе (загружены или сохранены) — чтобы удалять пропавшие из списка. */
const known = new Set<string>()
let timer: ReturnType<typeof setTimeout> | null = null
let pending: ChatStore<unknown> | null = null

export function rememberLoaded(ids: string[]): void {
  for (const id of ids) known.add(id)
}

async function flush(userId: string): Promise<void> {
  const store = pending
  pending = null
  if (!store) return
  const supabase = createClient()
  try {
    const ids = new Set(store.list.map((c) => c.id))
    // Удалённые в интерфейсе диалоги
    const gone = [...known].filter((id) => !ids.has(id))
    if (gone.length) {
      await supabase.from('assistant_conversations').delete().in('id', gone)
      gone.forEach((id) => known.delete(id))
    }
    // Активный диалог — upsert (остальные не менялись)
    const active = store.list.find((c) => c.id === store.activeId) as Conversation<unknown> | undefined
    if (active && UUID_RE.test(active.id)) {
      const { error } = await supabase.from('assistant_conversations').upsert({
        id: active.id,
        user_id: userId,
        title: (active.title ?? '').slice(0, 80),
        messages: active.messages.slice(-MAX_MESSAGES),
      })
      if (!error) known.add(active.id)
    }
  } catch {
    /* сеть/квота — история не критична, чат продолжает работать */
  }
}

/** Отложенное сохранение; последний вызов побеждает. */
export function saveChatsLive(userId: string, store: ChatStore<unknown>): void {
  pending = store
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void flush(userId)
  }, DEBOUNCE_MS)
}
