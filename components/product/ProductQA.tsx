'use client'

import { useMemo, useState } from 'react'
import { HelpCircle, BadgeCheck, CornerDownRight, Send } from 'lucide-react'
import type { ProductQuestion, Viewer } from '@/lib/types'
import { useCommunity, questionsByProduct } from '@/store/community'
import { COMMUNITY_LIVE } from '@/lib/community-live'
import { useLiveQuestions } from '@/lib/community-hooks'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'
import { questionText, answerText, personName } from '@/lib/community-i18n'
import TimeAgo from '@/components/ui/TimeAgo'
import LoginCta from '@/components/community/LoginCta'

interface Props {
  productId: string
  /** Боевой режим: вопросы с сервера (в демо игнорируются — данные из стора). */
  initialQuestions: ProductQuestion[]
  viewer: Viewer | null
}

/**
 * Вопросы о товаре прямо на карточке: спросить у сообщества и продавца.
 * Демо — localStorage (store/community.ts); live — Supabase (lib/community-live.ts).
 */
export default function ProductQA({ productId, initialQuestions, viewer }: Props) {
  const mounted = useHasMounted()
  const { lang, t } = useLang()
  const allQuestions = useCommunity((s) => s.questions)
  const storeQuestions = useMemo(() => questionsByProduct(allQuestions, productId), [allQuestions, productId])
  const storeAsk = useCommunity((s) => s.askQuestion)
  const storeAnswer = useCommunity((s) => s.addAnswer)
  const live = useLiveQuestions({ initialQuestions, viewer })
  const questions = COMMUNITY_LIVE ? live.questions : storeQuestions
  const isGuest = COMMUNITY_LIVE && !viewer

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    if (COMMUNITY_LIVE) {
      if (!live.requireAuth()) return
      setBusy(true)
      const ok = await live.ask(productId, value)
      setBusy(false)
      if (!ok) return // текст остаётся — можно повторить
    } else {
      storeAsk(productId, value)
    }
    setText('')
  }

  async function answer(e: React.FormEvent, questionId: string) {
    e.preventDefault()
    const value = replyText.trim()
    if (!value) return
    if (COMMUNITY_LIVE) {
      if (!live.requireAuth()) return
      setBusy(true)
      const ok = await live.answer(questionId, value)
      setBusy(false)
      if (!ok) return
    } else {
      storeAnswer(questionId, value)
    }
    setReplyText('')
    setReplyTo(null)
  }

  function startReply(questionId: string) {
    if (COMMUNITY_LIVE && !live.requireAuth()) return
    setReplyTo(questionId)
    setReplyText('')
  }

  const ready = COMMUNITY_LIVE || mounted

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-center gap-2">
        <HelpCircle size={22} className="text-primary" />
        <h2 className="section-title !text-2xl">
          {t.product.qaTitle} {ready && questions.length > 0 && `(${questions.length})`}
        </h2>
      </div>

      {/* Спросить */}
      {isGuest ? (
        <div className="rounded-2xl border border-neutral-200 p-4">
          <LoginCta compact text={t.product.loginToAsk} />
        </div>
      ) : (
        <form onSubmit={ask} className="flex gap-2 rounded-2xl border border-neutral-200 p-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={t.product.qaPlaceholder}
            className="input"
          />
          <button type="submit" disabled={!text.trim() || busy} className="btn-primary shrink-0 !px-5">
            <Send size={16} />
            <span className="hidden sm:inline">{t.product.ask}</span>
          </button>
        </form>
      )}
      {live.error && (
        <p className="mt-2 text-sm text-red-600">
          {live.error === 'limit' ? t.community.writeLimit : t.community.actionFailed}
        </p>
      )}

      {/* Список вопросов */}
      <div className="mt-5 space-y-4">
        {!ready ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
          ))
        ) : questions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-neutral-400">
            {t.product.noQuestions}
          </p>
        ) : (
          questions.map((q) => {
            const qName = personName(q.author?.name || q.author_name, lang)
            return (
              <div key={q.id} className="rounded-2xl border border-neutral-200 p-5">
                {/* Вопрос */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600">
                    {qName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {qName}
                      <span className="ml-2 font-normal text-neutral-400">
                        <TimeAgo iso={q.created_at} lang={lang} />
                      </span>
                    </p>
                    <p className="mt-1 text-neutral-700">{questionText(q, lang)}</p>
                  </div>
                </div>

                {/* Ответы */}
                {q.answers.length > 0 && (
                  <div className="mt-4 space-y-3 border-l-2 border-primary-light pl-4">
                    {q.answers.map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5">
                        <CornerDownRight size={16} className="mt-1 shrink-0 text-neutral-300" />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-900">
                            {personName(a.author_name, lang)}
                            {a.is_seller && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-light px-2 py-0.5 text-xs font-semibold text-secondary">
                                <BadgeCheck size={12} /> {t.product.seller}
                              </span>
                            )}
                            <span className="font-normal text-neutral-400">
                              <TimeAgo iso={a.created_at} lang={lang} />
                            </span>
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-700">{answerText(a, lang)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ответить */}
                {replyTo === q.id ? (
                  <form onSubmit={(e) => answer(e, q.id)} className="mt-4 flex gap-2">
                    <input
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      maxLength={2000}
                      placeholder={t.product.answerPlaceholder}
                      className="input !py-2 text-sm"
                    />
                    <button type="submit" disabled={busy} className="btn-primary shrink-0 !px-3.5 !py-2">
                      <Send size={15} />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => startReply(q.id)}
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                    title={isGuest ? t.product.loginToAnswer : undefined}
                  >
                    {t.product.reply}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
