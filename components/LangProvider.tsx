'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_LANG, messages, type Dict, type Lang } from '@/lib/i18n'

/**
 * Язык приходит с сервера (layout читает cookie) — поэтому SSR и клиент
 * всегда совпадают, hydration mismatch исключён.
 */
const LangContext = createContext<Lang>(DEFAULT_LANG)

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}

export function useLang(): { lang: Lang; t: Dict } {
  const lang = useContext(LangContext)
  return { lang, t: messages[lang] }
}
