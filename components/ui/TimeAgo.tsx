'use client'

import type { Lang } from '@/lib/i18n'
import { formatRelativeLang } from '@/lib/format'

/**
 * Относительное время («5 минут назад») — единственный недетерминированный текст
 * в карточках сообщества: между SSR и гидрацией может пройти минута, поэтому
 * расхождение в этом узле подавлено (React патчит текст, разметка не ломается).
 */
export default function TimeAgo({ iso, lang, className }: { iso: string; lang: Lang; className?: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning className={className}>
      {formatRelativeLang(iso, lang)}
    </time>
  )
}
