import Anthropic from '@anthropic-ai/sdk'
import { getAssistantCatalog, getCategories } from '@/lib/data'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { isSupabaseConfigured } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

/**
 * Живой ассистент «Севиля» на Claude. Ключ читается на сервере из ANTHROPIC_API_KEY
 * и в браузер не попадает. Ответ стримится. При отсутствии ключа / лимите / ошибке
 * клиент откатывается на оффлайн-правила (см. AssistantChat) — сайт не ломается.
 */

export const runtime = 'nodejs'

const MODEL = process.env.ASSISTANT_MODEL || 'claude-haiku-4-5'
/** Общий потолок запросов в сутки — защита бюджета ключа от флуда с разных IP. */
const DAILY_CAP = Math.max(100, Number(process.env.ASSISTANT_DAILY_CAP ?? 2000) || 2000)
const DAY_MS = 24 * 60 * 60 * 1000

/** Компактный каталог для заземления — чтобы Севиля советовала только реальные товары. */
async function catalogText(): Promise<string> {
  const [products, categories] = await Promise.all([getAssistantCatalog(150), getCategories()])
  if (products.length === 0) {
    return '(каталог пока пуст — честно скажи, что товары появятся, и отвечай на вопросы о площадке)'
  }
  const cat = new Map(categories.map((c) => [c.slug, c.name_ru] as const))
  return products
    .map((p) => {
      const slug = p.category_slug ?? ''
      const c = cat.get(slug) ?? slug ?? '—'
      const price = new Intl.NumberFormat('ru-RU').format(p.price)
      const desc = p.description ? ` · ${p.description.slice(0, 90)}` : ''
      return `- ${p.name} — ${price} сум · ${c}${desc}`
    })
    .join('\n')
}

async function systemPrompt(lang: 'ru' | 'uz'): Promise<string> {
  const language =
    lang === 'uz'
      ? 'узбекском языке ЛАТИНИЦЕЙ (oʻzbek lotin yozuvi; кириллицу и русские слова не используй, описания товаров переводи своими словами, названия товаров оставляй как в каталоге)'
      : 'русском языке'
  const catalog = await catalogText()
  return `Ты — Севиля, дружелюбная ИИ-помощница маркетплейса SEVIMLI (площадка для женщин Узбекистана: проверенные магазины косметики и одежды, салоны, сообщество). Отвечай ТОЛЬКО на ${language}, тепло и по делу, коротко (2–5 предложений), с лёгкими эмодзи по месту. Никакой markdown-разметки: никаких **, заголовков и звёздочек.

Что такое SEVIMLI (используй как факты):
- Проверенные магазины и оригинальная корейская косметика (K-beauty): продавцы подтверждают официальный импорт документами, метка «оригинал» ставится по документам поставщика.
- Живое сообщество: честные отзывы реальных девушек по реальным заказам.
- Davra — групповые покупки: круг подруг, при сумме от 500 000 сум скидка −10% каждой (её даёт магазин), одна доставка на всех по тарифу магазина.
- Проверка подлинности: у товаров с меткой «оригинал» защитная наклейка с кодом, код проверяется на странице «Проверка подлинности».
- Лояльность: баллы за завершённые покупки, уровни Bronze/Silver/Gold/Platinum, кешбэк баллами 1–5%, баллами можно оплатить до 20% заказа, баллы действуют 6 месяцев.
- Салоны: запись на маникюр, макияж, массаж, укладку; салон подтверждает запись сам.
- Доставка: её выполняет магазин (свой курьер, служба доставки или самовывоз), по Ташкенту обычно за 1 день; стоимость и срок указывает магазин, у многих бесплатно от 200 000 сум.
- Оплата: магазину при получении или по его ссылке Click/Payme; онлайн-оплата картой на площадке подключается.
- Возврат: через магазин по закону «О защите прав потребителей» — обмен товара надлежащего качества 10 дней; косметика, парфюмерия, бельё и предметы гигиены обмену не подлежат, кроме брака. Платформа — медиатор в спорах.
- Языки: узбекский и русский.

Твоя работа:
1) Подбирать уход по типу кожи и задаче, рекомендуя ТОЛЬКО товары из каталога ниже (не выдумывай товары и цены; цены в сумах).
2) Отвечать на вопросы о площадке (доставка, подлинность, Davra, лояльность, оплата, салоны и т.д.).

Правила:
- Не выходи за рамки SEVIMLI, красоты и ухода. На посторонние темы мягко возвращай к своей роли.
- Это советы по уходу, а не медицинская консультация. Никогда не обещай «вылечить», не называй товары лекарством, не ставь диагнозы, не советуй лекарства и БАДы. При акне, дерматите, аллергии, беременности или любых серьёзных проблемах с кожей советуй обратиться к дерматологу.
- Если спросят, кто ты, — честно: ты ИИ-помощница SEVIMLI по имени Севиля.
- Не обещай бесплатную доставку, возврат денег или решение спора «в пользу покупателя» — это решает магазин по закону.
- Пиши простым текстом без markdown-разметки: никаких ** для жирного, # для заголовков или списков со звёздочками. Названия товаров бери в кавычки «…». Если перечисляешь шаги — короткими строками «1) …», «2) …». Эмодзи и переносы строк можно.

Каталог товаров SEVIMLI:
${catalog}`
}

interface InMsg {
  role?: string
  content?: unknown
}

export async function POST(req: Request): Promise<Response> {
  // 1) Лимиты: по IP (доверенный адрес от edge), по пользователю и общий дневной потолок.
  const ip = clientIp(req.headers)
  const rl = rateLimit(`assistant:ip:${ip}`, 20, 5 * 60 * 1000)
  if (!rl.ok) {
    return new Response('rate_limited', {
      status: 429,
      headers: { 'retry-after': String(rl.retryAfter) },
    })
  }

  let userId: string | null = null
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      userId = null
    }
  }
  if (userId) {
    const ru = rateLimit(`assistant:user:${userId}`, 120, DAY_MS)
    if (!ru.ok) {
      return new Response('rate_limited', {
        status: 429,
        headers: { 'retry-after': String(ru.retryAfter) },
      })
    }
  }
  const rg = rateLimit('assistant:global', DAILY_CAP, DAY_MS)
  if (!rg.ok) {
    return new Response('rate_limited', {
      status: 429,
      headers: { 'retry-after': String(rg.retryAfter) },
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

  // Messages API требует, чтобы диалог начинался с реплики пользователя
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return new Response('no_user_message', { status: 400 })
  }

  const system = await systemPrompt(lang)

  // 4) Стриминг ответа Claude.
  const client = new Anthropic({ apiKey })
  const encoder = new TextEncoder()

  const rs = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 700,
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages,
        })
        // Страховка от markdown: «**» вырезаем прямо в потоке (одиночную «*» на границе чанка придерживаем)
        let carry = ''
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            let text = carry + event.delta.text
            carry = ''
            if (text.endsWith('*')) {
              carry = '*'
              text = text.slice(0, -1)
            }
            text = text.replace(/\*\*/g, '')
            if (text) controller.enqueue(encoder.encode(text))
          }
        }
        if (carry) controller.enqueue(encoder.encode(carry))
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
