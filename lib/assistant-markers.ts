/**
 * Маркеры карточек товаров в ответах Севили.
 *  • модель пишет код из каталога: [[P12]]
 *  • сервер в потоке заменяет его на [[p:<uuid>]] (makeMarkerTransform)
 *  • чат рисует на месте маркера карточку товара (splitCards)
 * Чистый модуль без зависимостей — общий для роута и клиента, покрыт юнит-тестом.
 */

export const CARD_MARK = /\[\[p:([0-9a-f-]{36})\]\]/g

/** История от клиента содержит [[p:<uuid>]] — модели возвращаем её же коды [[Pn]]. */
export function toModelCodes(text: string, idToCode: Map<string, string>): string {
  return text.replace(CARD_MARK, (_m, id: string) => {
    const code = idToCode.get(id)
    return code ? `[[${code}]]` : ''
  })
}

/**
 * Потоковая замена [[Pn]] → [[p:<uuid>]] и страховка от markdown «**».
 * Хвост чанка, который может оказаться началом маркера («[», «[[P1») или парой «**» («*»),
 * придерживается до следующего чанка — но не дольше 24 символов.
 */
export function makeMarkerTransform(codeToId: Map<string, string>) {
  let carry = ''
  const replace = (s: string) =>
    s
      .replace(/\*\*/g, '')
      .replace(/\[\[?\s*(P\d{1,3})\s*\]\]?/g, (_m, code: string) => {
        const id = codeToId.get(code)
        return id ? `[[p:${id}]]` : ''
      })
  return {
    push(delta: string): string {
      let buf = carry + delta
      carry = ''
      let open = buf.lastIndexOf('[')
      while (open > 0 && buf[open - 1] === '[') open-- // начало ряда «[[», а не последняя скобка
      const close = buf.lastIndexOf(']]')
      if (open !== -1 && open > close && buf.length - open < 24) {
        carry = buf.slice(open)
        buf = buf.slice(0, open)
      }
      // Хвост из звёздочек: пары «**» вырезаем сразу, нечётную последнюю «*» придерживаем —
      // она может оказаться половиной «**», пришедшей в следующем чанке
      const stars = buf.match(/\*+$/)
      if (stars) {
        buf = buf.slice(0, -stars[0].length)
        if (stars[0].length % 2 === 1) carry = '*' + carry
      }
      return replace(buf)
    },
    flush(): string {
      const rest = carry
      carry = ''
      return replace(rest)
    },
  }
}

export type Segment = { kind: 'text'; text: string } | { kind: 'product'; id: string }

/** Текст ответа → куски текста и карточки. Недошедший хвост маркера («[[p:3f…») не показываем. */
export function splitCards(text: string): Segment[] {
  const clean = text.replace(/\[{1,2}(p(:[0-9a-f-]{0,36}\]?)?)?$/, '')
  const out: Segment[] = []
  let last = 0
  for (const m of clean.matchAll(CARD_MARK)) {
    const i = m.index ?? 0
    if (i > last) out.push({ kind: 'text', text: clean.slice(last, i) })
    out.push({ kind: 'product', id: m[1] })
    last = i + m[0].length
  }
  if (last < clean.length) out.push({ kind: 'text', text: clean.slice(last) })
  // Карточка — блочный элемент: перенос строки сразу после неё дал бы пустую строку
  return out.map((s, idx) =>
    s.kind === 'text' && idx > 0 && out[idx - 1].kind === 'product' ? { ...s, text: s.text.replace(/^[ \t]*\n/, '') } : s,
  )
}

/** Текст без маркеров — для заголовков диалогов. */
export function stripCards(text: string): string {
  return text.replace(CARD_MARK, '').replace(/[ \t]+\n/g, '\n').trim()
}
