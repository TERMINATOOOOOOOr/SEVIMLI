'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Send, ShoppingBag, RotateCcw, Sparkles, CalendarDays, Sun, Moon } from 'lucide-react'
import type { Product } from '@/lib/types'
import {
  SKIN_OPTIONS,
  CONCERN_OPTIONS,
  recommend,
  parseFreeText,
  buildRoutine,
  type SkinType,
  type Concern,
  type Recommendation,
  type RoutinePlan,
} from '@/lib/assistant'
import { formatPriceLang } from '@/lib/format'
import { productName } from '@/lib/product-i18n'
import { useCart } from '@/store/cart'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'
import Thumb from '@/components/ui/Thumb'

interface Chip {
  id: string
  label: string
}

interface Message {
  id: number
  role: 'bot' | 'user'
  text?: string
  chips?: Chip[]
  recs?: Recommendation[]
  plan?: RoutinePlan
}

let nextId = 1

/** Карточка «когда что наносить»: утро/вечер по шагам + активы по дням недели. */
function PlanCard({ plan }: { plan: RoutinePlan }) {
  const { lang, t } = useLang()

  const steps = (list: RoutinePlan['am'], withMoisturizer = false) => (
    <ol className="mt-1.5 space-y-1.5">
      <li className="flex gap-2 text-sm text-neutral-700">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-500">
          1
        </span>
        {t.assistant.cleanse}
      </li>
      {list.map((s, i) => (
        <li key={s.productId} className="flex gap-2 text-sm text-neutral-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-[11px] font-bold text-primary">
            {i + 2}
          </span>
          <span>
            <Link href={`/product/${s.productId}`} className="font-medium text-neutral-900 hover:text-primary">
              {s.label[lang]}
            </Link>{' '}
            — {s.note[lang]}
          </span>
        </li>
      ))}
      {withMoisturizer && (
        <li className="flex gap-2 text-sm text-neutral-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-500">
            {list.length + 2}
          </span>
          {t.assistant.moisturize}
        </li>
      )}
    </ol>
  )

  return (
    <div className="mt-2 rounded-2xl border border-neutral-200 bg-white p-4 text-left">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
        <CalendarDays size={15} className="text-primary" /> {t.assistant.planTitle}
      </p>

      <div className="mt-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-500">
          <Sun size={13} /> {t.assistant.morning}
        </p>
        {steps(plan.am)}
      </div>

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">
          <Moon size={13} /> {t.assistant.evening}
        </p>
        {steps(plan.pm, true)}
      </div>

      {plan.week.length > 0 && (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t.assistant.weekly}
          </p>
          {plan.week.map((w) => (
            <div key={w.productId} className="mt-2.5">
              <p className="text-xs font-medium text-neutral-700">{w.label[lang]}</p>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {t.assistant.days.map((d, di) => (
                  <div
                    key={d}
                    className={cn(
                      'rounded-lg py-1 text-center text-[10px] font-semibold',
                      w.days.includes(di)
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-400',
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-2 text-xs text-neutral-400">{t.assistant.dailyRest}</p>
        </div>
      )}

      <div className="mt-4 space-y-1 rounded-xl bg-primary-light/40 p-3">
        <p className="text-xs leading-relaxed text-neutral-600">💡 {t.assistant.planTip1}</p>
        <p className="text-xs leading-relaxed text-neutral-600">💡 {t.assistant.planTip2}</p>
      </div>
    </div>
  )
}

export default function AssistantChat({ products }: { products: Product[] }) {
  const { lang, t } = useLang()
  const addItem = useCart((s) => s.addItem)
  const [messages, setMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [skin, setSkin] = useState<SkinType | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])

  /** Отменяем отложенные ответы прошлого запроса, чтобы они не вклинились в новый. */
  function clearPending() {
    timerIds.current.forEach(clearTimeout)
    timerIds.current.length = 0
    setTyping(false)
  }

  useEffect(() => {
    const ids = timerIds.current
    return () => ids.forEach(clearTimeout)
  }, [])

  const productById = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  const skinChips: Chip[] = SKIN_OPTIONS.map((o) => ({ id: `skin:${o.id}`, label: o.label[lang] }))
  const concernChips: Chip[] = CONCERN_OPTIONS.map((o) => ({
    id: `concern:${o.id}`,
    label: o.label[lang],
  }))

  /** Ответ бота с имитацией набора текста. */
  function botSay(msg: Omit<Message, 'id' | 'role'>, delay = 650) {
    setTyping(true)
    timerIds.current.push(
      setTimeout(() => {
        setTyping(false)
        setMessages((m) => [...m, { id: nextId++, role: 'bot', ...msg }])
      }, delay),
    )
  }

  // Приветствие
  useEffect(() => {
    if (messages.length === 0) {
      botSay({ text: t.assistant.greeting, chips: skinChips }, 400)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing])

  function userSay(text: string) {
    setMessages((m) => [...m, { id: nextId++, role: 'user', text }])
  }

  function showResult(s: SkinType, c: Concern) {
    const recs = recommend(s, c)
    const plan = buildRoutine(recs)
    botSay({ text: t.assistant.resultIntro, recs })
    if (plan)
      timerIds.current.push(setTimeout(() => botSay({ text: t.assistant.planIntro, plan }, 800), 1300))
    timerIds.current.push(
      setTimeout(
        () => botSay({ text: t.assistant.outro, chips: [{ id: 'restart', label: t.assistant.restart }] }, 900),
        plan ? 2600 : 1000,
      ),
    )
  }

  function onChip(chip: Chip) {
    clearPending()
    if (chip.id === 'restart') {
      setSkin(null)
      userSay(chip.label)
      botSay({ text: t.assistant.greeting, chips: skinChips })
      return
    }
    const [kind, value] = chip.id.split(':')
    userSay(chip.label)
    if (kind === 'skin') {
      setSkin(value as SkinType)
      botSay({ text: t.assistant.askConcern, chips: concernChips })
    } else if (kind === 'concern') {
      showResult(skin ?? 'normal', value as Concern)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    clearPending()
    setInput('')
    userSay(text)
    const parsed = parseFreeText(text)
    if (parsed.skin) setSkin(parsed.skin)
    if (parsed.concern) {
      showResult(parsed.skin ?? skin ?? 'normal', parsed.concern)
    } else {
      botSay({ text: t.assistant.fallback, chips: skin ? concernChips : skinChips })
    }
  }

  function onAdd(p: Product) {
    addItem(p)
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <div className="flex h-[68dvh] min-h-[440px] flex-col rounded-3xl border border-neutral-200 bg-white shadow-sm">
      {/* Лента сообщений */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[85%]', m.role === 'user' && 'text-right')}>
              {m.role === 'bot' && (
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Sparkles size={12} /> {t.assistant.name}
                </div>
              )}
              {m.text && (
                <div
                  className={cn(
                    'inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'rounded-br-md bg-primary text-white'
                      : 'rounded-bl-md bg-neutral-100 text-neutral-800',
                  )}
                >
                  {m.text}
                </div>
              )}

              {/* Рекомендованные товары */}
              {m.recs && (
                <div className="mt-2 space-y-2">
                  {m.recs.map((r) => {
                    const p = productById.get(r.productId)
                    if (!p) return null
                    return (
                      <div
                        key={r.productId}
                        className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left"
                      >
                        <Link
                          href={`/product/${p.id}`}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-100"
                        >
                          <Thumb src={p.images?.[0]} emoji="🧴" alt={productName(p, lang)} />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/product/${p.id}`}
                            className="line-clamp-1 text-sm font-medium text-neutral-900 hover:text-primary"
                          >
                            {productName(p, lang)}
                          </Link>
                          <p className="line-clamp-2 text-xs text-neutral-500">{r.reason[lang]}</p>
                          <p className="mt-0.5 text-sm font-bold text-primary">{formatPriceLang(p.price, lang)}</p>
                        </div>
                        <button
                          onClick={() => onAdd(p)}
                          className="btn-primary shrink-0 !px-3.5 !py-2 text-xs"
                        >
                          <ShoppingBag size={14} />
                          {addedId === p.id ? t.assistant.added : ''}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* График применения */}
              {m.plan && <PlanCard plan={m.plan} />}

              {/* Чипы-варианты */}
              {m.chips && (
                <div className={cn('mt-2 flex flex-wrap gap-1.5', m.role === 'user' && 'justify-end')}>
                  {m.chips.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onChip(c)}
                      className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary-light/50 px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      {c.id === 'restart' && <RotateCcw size={13} />}
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:300ms]" />
            </span>
            {t.assistant.name} {t.assistant.typing}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Ввод */}
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-neutral-100 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.assistant.freePlaceholder}
          className="input !py-2.5 text-sm"
        />
        <button type="submit" className="btn-primary shrink-0 !px-4" aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
