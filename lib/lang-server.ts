import { cookies } from 'next/headers'
import { DEFAULT_LANG, LANG_COOKIE, messages, normalizeLang, type Dict, type Lang } from '@/lib/i18n'

/** Текущий язык в серверных компонентах (из cookie `lang`). */
export async function getLang(): Promise<Lang> {
  try {
    const store = await cookies()
    return normalizeLang(store.get(LANG_COOKIE)?.value)
  } catch {
    return DEFAULT_LANG
  }
}

/** Язык + словарь одним вызовом — для серверных страниц. */
export async function getT(): Promise<{ lang: Lang; t: Dict }> {
  const lang = await getLang()
  return { lang, t: messages[lang] }
}
