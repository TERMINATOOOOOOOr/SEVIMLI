import { LANG_COOKIE, type Lang } from '@/lib/i18n'

/** Запоминает язык интерфейса в cookie на год (читает layout на сервере). */
export function setLangCookie(lang: Lang): void {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`
}
