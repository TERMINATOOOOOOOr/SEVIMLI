import Anthropic from '@anthropic-ai/sdk'
import { demoProducts, demoCategories } from '@/lib/demo'
import { rateLimit, clientIp } from '@/lib/rate-limit'

/**
 * Живой ассистент «Севиля» на Claude. Ключ читается на сервере из ANTHROPIC_API_KEY
 * и в браузер не попадает. Ответ стримится. При отсутствии ключа / лимите / ошибке
 * клиент откатывается на оффлайн-правила (см. AssistantChat) — сайт не ломается.
 */

export const runtime = 'nodejs'

const MODEL = process.env.ASSISTANT_MODEL || 'claude-haiku-4-5'

/** Компактный каталог для заземления — чтобы Севиля советовала только реальные товары. */
function catalogText(): string {
  const cat = new Map(demoCategories.map((c) => [c.slug, c.name_ru] as const))
  return demoProducts
    .map((p) => {
      const slug = p.category_slug ?? ''
      const c = cat.get(slug) ?? slug ?? '—'
      const price = new Intl.NumberFormat('ru-RU').format(p.price)
      const desc = p.description ? ` · ${p.description.slice(0, 90)}` : ''
      return `- ${p.name} — ${price} сум · ${c}${desc}`
    })
    .join('\n')
}

function systemPrompt(lang: 'ru' | 'uz'): string {
  const language = lang === 'uz' ? 'узбекском' : 'русском'
  return `Ты — Севиля, дружелюбная помощница маркетплейса SEVIMLI (площадка «всё в одном» для женщин Узбекистана). Отвечай ТОЛЬКО на ${language} языке, тепло и по делу, коротко (2–5 предложений), с лёгкими эмодзи по месту.

Что такое SEVIMLI (используй как факты):
- Проверенные магазины и оригинальная корейская косметика (K-beauty) — тот же оригинал, что в бутиках, но дешевле.
- Живое сообщество: честные отзывы реальных девушек.
- Davra — групповые покупки: собери круг подруг, при сумме от 500 000 сум скидка −10% каждой и одна доставка на всех.
- Проверка подлинности: у товаров «100% оригинал» защитная наклейка с кодом, код проверяется на сайте.
- Лояльность: баллы с покупок, уровни Bronze/Silver/Gold/Platinum, кешбэк 1–5%, баллами до 50% заказа.
- Салоны: запись на маникюр, макияж, массаж, укладку.
- Доставка: у большинства магазинов бесплатная по Ташкенту, обычно 1 день; по регионам — быстрая отправка.
- Оплата: Uzcard/Humo, Click/Payme, баллами. Возврат — через магазин, деньги на карту/баллами.
- Языки: узбекский и русский.

Твоя работа:
1) Подбирать уход по типу кожи и задаче, рекомендуя ТОЛЬКО товары из каталога ниже (не выдумывай товары и цены; цены в сумах).
2) Отвечать на вопросы о площадке (доставка, подлинность, Davra, лояльность, оплата, салоны и т.д.).

Правила:
- Не выходи за рамки SEVIMLI, красоты и ухода. На посторонние темы мягко возвращай к своей роли.
- Это не медицинская консультация; при серьёзных проблемах с кожей советуй обратиться к дерматологу.
- Не упоминай, что ты ИИ или языковая модель; ты — помощница Севиля.
- Пиши простым текстом без markdown-разметки: никаких ** для жирного, # для заголовков или списков со звёздочками. Названия товаров бери в кавычки «…». Если перечисляешь шаги — короткими строками «1) …», «2) …». Эмодзи и переносы строк можно.

Каталог товаров SEVIMLI:
${catalogText()}`
}

interface InMsg {
  role?: string
  content?: unknown
}

export async function POST(req: Request): Promise<Response> {
  // 1) Rate-limit по IP — защита квоты на публичном сайте.
  const ip = clientIp(req.headers)
  const rl = rateLimit(`assistant:${ip}`, 20, 5 * 60 * 1000)
  if (!rl.ok) {
    return new Response('rate_limited', {
      status: 429,
      headers: { 'retry-after': String(rl.retryAfter) },
    })
  }

  // 2) Нет ключа → 503, клиент уходит в оффлайн-правила.
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response('no_key', { status: 503 })

  // 3) Разбор и санитизация входа.
  let body: { messages?: InMsg[]; lang?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('bad_json', { status: 400 })
  }
  const lang: 'ru' | 'uz' = body.lang === 'uz' ? 'uz' : 'ru'
  const incoming = Array.isArray(body.messages) ? body.messages : []
  const messages = incoming
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return new Response('no_user_message', { status: 400 })
  }

  // 4) Стриминг ответа Claude.
  const client = new Anthropic({ apiKey })
  const encoder = new TextEncoder()

  const rs = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 700,
          system: [
            { type: 'text', text: systemPrompt(lang), cache_control: { type: 'ephemeral' } },
          ],
          messages,
        })
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        // Ошибку не заглушаем: клиент увидит оборванный/пустой поток и откатится.
        controller.error(err)
      }
    },
  })

  return new Response(rs, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-assistant': 'live',
    },
  })
}
