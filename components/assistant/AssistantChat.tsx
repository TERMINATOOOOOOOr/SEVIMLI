'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Send,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  CalendarDays,
  Sun,
  Moon,
  Plus,
  Trash2,
  MessageSquare,
  X,
  PanelLeft,
} from 'lucide-react'
import type { Product, Viewer } from '@/lib/types'
import {
  SKIN_OPTIONS,
  CONCERN_OPTIONS,
  recommend,
  parseFreeText,
  answerFaq,
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
import { useSession } from '@/store/session'
import { loadChats, saveChats, type Conversation } from '@/lib/assistant-storage'
import { splitCards, stripCards } from '@/lib/assistant-markers'
import { ASSISTANT_LIVE, saveChatsLive, rememberLoaded } from '@/lib/assistant-live'
import type { StoredConversation } from '@/lib/data'

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

/** Уникальный id диалога (браузерный рантайм). */
function newConvId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* fallthrough */
  }
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const nowMs = () => Date.now()

/** Автозаголовок диалога из первого сообщения пользователя. */
function titleFromMessages(msgs: Message[], fallback: string): string {
  const firstUser = msgs.find((m) => m.role === 'user' && m.text)
  const text = firstUser?.text ? stripCards(firstUser.text) : ''
  if (!text) return fallback
  return text.length > 30 ? text.slice(0, 30) + '…' : text
}

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

/** Карточка товара внутри ответа Севили (вне AssistantChat — иначе перемонтируется на каждом чанке стрима). */
function ProductChip({ p, added, onAdd }: { p: Product; added: boolean; onAdd: (p: Product) => void }) {
  const { lang, t } = useLang()
  return (
    <div className="my-2 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5 text-left">
      <Link href={`/product/${p.id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-100">
        <Thumb src={p.images?.[0]} emoji="🧴" alt={productName(p, lang)} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/product/${p.id}`} className="line-clamp-2 text-sm font-medium text-neutral-900 hover:text-primary">
          {productName(p, lang)}
        </Link>
        <p className="mt-0.5 text-xs text-neutral-500">{p.shop?.name ?? ''}</p>
        <p className="mt-0.5 text-sm font-bold text-primary">{formatPriceLang(p.price, lang)}</p>
      </div>
      <button onClick={() => onAdd(p)} className="btn-primary shrink-0 !px-3 !py-2 text-xs" aria-label={t.common.addToCart}>
        <ShoppingBag size={14} />
        <span className="hidden sm:inline">{added ? t.assistant.added : t.common.addToCart}</span>
      </button>
    </div>
  )
}

interface ChatProps {
  products: Product[]
  /** Боевой режим: текущий пользователь и его диалоги из базы (assistant_conversations). */
  viewer?: Viewer | null
  initialChats?: StoredConversation[] | null
}

export default function AssistantChat({ products, viewer = null, initialChats = null }: ChatProps) {
  const { lang, t } = useLang()
  const addItem = useCart((s) => s.addItem)
  const user = useSession((s) => s.user)
  // Кто «залогинен»: в боевом режиме — пользователь Supabase (история в базе), в демо — демо-сессия (localStorage)
  const email = ASSISTANT_LIVE ? (viewer?.id ?? null) : (user?.email ?? null)
  const loggedIn = !!email
  /** Единая точка сохранения истории. */
  const persist = (store: { list: Conversation<Message>[]; activeId: string }) => {
    if (ASSISTANT_LIVE) {
      if (viewer) saveChatsLive(viewer.id, store)
    } else {
      saveChats(email, store)
    }
  }
  const [messages, setMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [skin, setSkin] = useState<SkinType | null>(null)
  /** Последняя выбранная задача — чтобы отвечать на «а если жирная?» без повторного вопроса. */
  const [lastConcern, setLastConcern] = useState<Concern | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)
  /** Список диалогов и активный — только для залогиненных (Phase 2). */
  const [convos, setConvos] = useState<Conversation<Message>[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
  /** Для кого уже инициализировали ленту: 'guest' | `u:<email>`. */
  const initedFor = useRef<string | null>(null)
  /** Зеркало convos для чтения в эффектах без циклов по зависимостям. */
  const convosRef = useRef<Conversation<Message>[]>([])
  /** Активный запрос к живому ассистенту — чтобы прервать при новом сообщении/смене чата. */
  const abortRef = useRef<AbortController | null>(null)
  const DEFAULT_TITLE = t.assistant.newChat

  useEffect(() => {
    convosRef.current = convos
  }, [convos])

  /** Отменяем отложенные ответы прошлого запроса, чтобы они не вклинились в новый. */
  function clearPending() {
    timerIds.current.forEach(clearTimeout)
    timerIds.current.length = 0
    abortRef.current?.abort()
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

  /** Ответ бота: текст + карточки товаров на месте маркеров [[p:<id>]]. */
  function renderBotText(text: string) {
    const segments = splitCards(text)
    if (segments.length === 1 && segments[0].kind === 'text') return segments[0].text
    return segments.map((s, i) => {
      if (s.kind === 'text') return <span key={i}>{s.text}</span>
      const p = productById.get(s.id)
      // key по id товара: карточка не перемонтируется, пока стрим дописывает текст
      return p ? <ProductChip key={s.id + ':' + i} p={p} added={addedId === p.id} onAdd={onAdd} /> : null
    })
  }

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

  /** Свежее приветственное сообщение. */
  function freshGreeting(): Message {
    return { id: nextId++, role: 'bot', text: t.assistant.greeting, chips: skinChips }
  }

  // Инициализация по пользователю: залогинен → грузим список диалогов (или создаём первый),
  // гость → один эфемерный чат (ничего не сохраняем). Срабатывает и при входе/выходе.
  useEffect(() => {
    const marker = loggedIn ? `u:${email}` : 'guest'
    if (initedFor.current === marker) return
    initedFor.current = marker
    clearPending()
    setSkin(null)

    if (loggedIn) {
      const store = ASSISTANT_LIVE
        ? initialChats && initialChats.length > 0
          ? { list: initialChats as Conversation<Message>[], activeId: initialChats[0].id }
          : null
        : loadChats<Message>(email)
      if (ASSISTANT_LIVE && store) rememberLoaded(store.list.map((c) => c.id))
      if (store && store.list.length > 0) {
        const active = store.list.find((c) => c.id === store.activeId) ?? store.list[0]
        const maxId = store.list.reduce(
          (mx, c) => Math.max(mx, c.messages.reduce((m, x) => Math.max(m, x?.id ?? 0), 0)),
          0,
        )
        if (nextId <= maxId) nextId = maxId + 1
        // Восстановление сохранённых диалогов из localStorage — осознанный setState в эффекте
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConvos(store.list)
        setActiveId(active.id)
        setMessages(active.messages)
        return
      }
      // Нет сохранёнки → первый диалог с приветствием.
      const greeting = freshGreeting()
      const conv: Conversation<Message> = {
        id: newConvId(),
        title: DEFAULT_TITLE,
        messages: [greeting],
        updatedAt: nowMs(),
      }
      setConvos([conv])
      setActiveId(conv.id)
      setMessages([greeting])
      return
    }

    // Гость — эфемерный одиночный чат.
    setConvos([])
    setActiveId('')
    setMessages([freshGreeting()])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, email])

  // Автосохранение: пишем текущую ленту в активный диалог и в localStorage (только залогинен).
  useEffect(() => {
    if (!loggedIn || initedFor.current !== `u:${email}` || !activeId) return
    const next = convosRef.current.map((c) =>
      c.id === activeId
        ? {
            ...c,
            messages,
            updatedAt: nowMs(),
            title:
              c.title && c.title !== DEFAULT_TITLE
                ? c.title
                : titleFromMessages(messages, DEFAULT_TITLE),
          }
        : c,
    )
    setConvos(next)
    persist({ list: next, activeId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeId, loggedIn, email])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing])

  function userSay(text: string) {
    setMessages((m) => [...m, { id: nextId++, role: 'user', text }])
  }

  function showResult(s: SkinType, c: Concern) {
    setSkin(s)
    setLastConcern(c)
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

  /** Оффлайн-ответ по правилам — запасной путь, если живой Claude недоступен. */
  function offlineReply(text: string) {
    const parsed = parseFreeText(text)
    if (parsed.skin || parsed.concern) {
      const nextSkin = parsed.skin ?? skin
      const nextConcern = parsed.concern ?? lastConcern
      if (nextConcern) {
        showResult(nextSkin ?? 'normal', nextConcern)
      } else {
        setSkin(nextSkin ?? 'normal')
        botSay({ text: t.assistant.askConcern, chips: concernChips })
      }
      return
    }
    const faq = answerFaq(text, lang)
    if (faq) {
      botSay({ text: faq })
      return
    }
    botSay({ text: t.assistant.fallback, chips: skin ? concernChips : skinChips })
  }

  /** Живой ответ Севили (Claude, стриминг). При лимите/ошибке — откат на offlineReply. */
  async function askClaude(text: string) {
    // Маркеры карточек [[p:<id>]] отправляем как есть — сервер вернёт модели её коды
    const convo = [
      ...messages
        .filter((m) => m.text)
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text as string })),
      { role: 'user', content: text },
    ]
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setTyping(true)
    let botId: number | null = null
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: convo, lang }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) throw new Error('status ' + res.status)
      setTyping(false)
      botId = nextId++
      const id = botId
      setMessages((m) => [...m, { id, role: 'bot', text: '' }])
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let acc = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        acc += dec.decode(value, { stream: true })
        setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: acc } : x)))
      }
      if (!acc.trim()) throw new Error('empty')
    } catch {
      if (botId !== null) {
        const dead = botId
        setMessages((m) => m.filter((x) => x.id !== dead || (x.text ?? '').trim()))
      }
      setTyping(false)
      if (!ctrl.signal.aborted) offlineReply(text)
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    clearPending()
    setInput('')
    userSay(text)
    askClaude(text)
  }

  function onAdd(p: Product) {
    addItem(p)
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  /** Гость: сброс единственного эфемерного чата. */
  function resetGuestChat() {
    clearPending()
    setSkin(null)
    setAddedId(null)
    setMessages([freshGreeting()])
  }

  /** Залогинен: создать новый диалог (прежние сохраняются в списке). */
  function newConversation() {
    clearPending()
    setSkin(null)
    setAddedId(null)
    const greeting = freshGreeting()
    const conv: Conversation<Message> = {
      id: newConvId(),
      title: DEFAULT_TITLE,
      messages: [greeting],
      updatedAt: nowMs(),
    }
    const next = [conv, ...convosRef.current]
    setConvos(next)
    setActiveId(conv.id)
    setMessages([greeting])
    persist({ list: next, activeId: conv.id })
    setSidebarOpen(false)
  }

  /** Кнопка «Новый чат» в шапке. */
  function startNewChat() {
    if (loggedIn) newConversation()
    else resetGuestChat()
  }

  /** Переключиться на другой диалог. */
  function switchConversation(id: string) {
    setSidebarOpen(false)
    if (id === activeId) return
    const conv = convosRef.current.find((c) => c.id === id)
    if (!conv) return
    clearPending()
    setSkin(null)
    setAddedId(null)
    const maxId = conv.messages.reduce((m, x) => Math.max(m, x?.id ?? 0), 0)
    if (nextId <= maxId) nextId = maxId + 1
    setActiveId(id)
    setMessages(conv.messages)
    persist({ list: convosRef.current, activeId: id })
  }

  /** Удалить диалог из истории. */
  function deleteConversation(id: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    const remaining = convosRef.current.filter((c) => c.id !== id)
    if (remaining.length === 0) {
      clearPending()
      setSkin(null)
      const greeting = freshGreeting()
      const conv: Conversation<Message> = {
        id: newConvId(),
        title: DEFAULT_TITLE,
        messages: [greeting],
        updatedAt: nowMs(),
      }
      setConvos([conv])
      setActiveId(conv.id)
      setMessages([greeting])
      persist({ list: [conv], activeId: conv.id })
      return
    }
    setConvos(remaining)
    if (id === activeId) {
      const nextActive = remaining[0]
      clearPending()
      setSkin(null)
      const maxId = nextActive.messages.reduce((m, x) => Math.max(m, x?.id ?? 0), 0)
      if (nextId <= maxId) nextId = maxId + 1
      setActiveId(nextActive.id)
      setMessages(nextActive.messages)
      persist({ list: remaining, activeId: nextActive.id })
    } else {
      persist({ list: remaining, activeId })
    }
  }

  /** Отображаемый заголовок диалога (с фолбэком). */
  function convTitle(c: Conversation<Message>): string {
    return c.title && c.title.trim() ? c.title : titleFromMessages(c.messages, DEFAULT_TITLE)
  }

  /** Диалоги, отсортированные по свежести. */
  const sortedConvos = [...convos].sort((a, b) => b.updatedAt - a.updatedAt)

  /** Внутренность панели истории (переиспользуется на десктопе и в мобильном drawer). */
  const listInner = (
    <>
      <button
        type="button"
        onClick={newConversation}
        className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary"
      >
        <Plus size={15} /> {t.assistant.newChat}
      </button>
      <div className="mt-1.5 flex-1 space-y-0.5 overflow-y-auto">
        {sortedConvos.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => switchConversation(c.id)}
            className={cn(
              'group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
              c.id === activeId
                ? 'bg-primary-light/60 font-medium text-primary'
                : 'text-neutral-600 hover:bg-neutral-100',
            )}
          >
            <MessageSquare size={14} className="shrink-0 opacity-70" />
            <span className="min-w-0 flex-1 truncate">{convTitle(c)}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => deleteConversation(c.id, e)}
              className="shrink-0 rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              aria-label="Удалить диалог"
            >
              <Trash2 size={13} />
            </span>
          </button>
        ))}
      </div>
    </>
  )

  return (
    <div className="relative flex h-[68dvh] min-h-[440px] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      {/* Панель истории (десктоп) — только для залогиненных */}
      {loggedIn && (
        <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-100 p-2 md:flex">
          {listInner}
        </aside>
      )}

      {/* Панель истории (мобильный drawer) */}
      {loggedIn && sidebarOpen && (
        <div className="absolute inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-neutral-100 bg-white p-2 shadow-xl">
            <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>
            {listInner}
          </aside>
        </div>
      )}

      {/* Основная колонка: шапка + лента + ввод */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Шапка: имя + управление историей */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-2.5">
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-neutral-800">
            {loggedIn && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="mr-0.5 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 md:hidden"
                aria-label="История"
              >
                <PanelLeft size={16} />
              </button>
            )}
            <Sparkles size={15} className="shrink-0 text-primary" /> {t.assistant.name}
            <span className="truncate text-xs font-normal text-neutral-400">
              · {loggedIn ? t.assistant.historyHint : t.assistant.guestHint}
            </span>
          </span>
          <button
            type="button"
            onClick={startNewChat}
            className="flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus size={13} /> {t.assistant.newChat}
          </button>
        </div>

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
                    'inline-block whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'rounded-br-md bg-primary text-white'
                      : 'rounded-bl-md bg-neutral-100 text-neutral-800',
                  )}
                >
                  {m.role === 'bot' ? renderBotText(m.text) : m.text}
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
    </div>
  )
}
