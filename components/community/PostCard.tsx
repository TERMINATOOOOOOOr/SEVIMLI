'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Send, ShoppingBag, Share2 } from 'lucide-react'
import type { CommunityPost, PostKind, Product } from '@/lib/types'
import { formatRelativeLang, formatPriceLang } from '@/lib/format'
import { categoryEmoji } from '@/lib/categories'
import { productName, cityName } from '@/lib/product-i18n'
import { postText, commentText, tagLabel, personName } from '@/lib/community-i18n'
import { useCommunity } from '@/store/community'
import { useCart } from '@/store/cart'
import { useLang } from '@/components/LangProvider'
import { cn } from '@/lib/utils'
import Thumb from '@/components/ui/Thumb'

interface Props {
  post: CommunityPost
  /** Привязанный товар — воронка «сообщество → покупка». */
  product?: Product | null
  /** На детальной странице комментарии раскрыты сразу и заголовок не кликабелен. */
  detail?: boolean
}

function Avatar({ name, src, size = 'lg' }: { name: string; src?: string | null; size?: 'lg' | 'sm' }) {
  const cls = size === 'lg' ? 'h-10 w-10' : 'h-7 w-7 text-xs'
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn(cls, 'shrink-0 rounded-full object-cover')} />
  }
  return (
    <div className={cn(cls, 'flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary')}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function PostCard({ post, product, detail = false }: Props) {
  const { lang, t } = useLang()
  const toggleLike = useCommunity((s) => s.toggleLike)
  const addComment = useCommunity((s) => s.addComment)
  const liked = useCommunity((s) => s.likedIds.includes(post.id))
  const addItem = useCart((s) => s.addItem)

  const [showComments, setShowComments] = useState(detail)
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  const KIND_META: Record<PostKind, { label: string; className: string }> = {
    review: { label: t.community.kindReview, className: 'bg-secondary-light text-secondary' },
    question: { label: t.community.kindQuestion, className: 'bg-amber-100 text-amber-700' },
    tip: { label: t.community.kindTip, className: 'bg-primary-light text-primary' },
  }
  const kind = KIND_META[post.kind]

  function submitComment(e: React.FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    addComment(post.id, value)
    setText('')
    setShowComments(true)
  }

  async function share() {
    const url = `${window.location.origin}/community/${post.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SEVIMLI', text: post.text.slice(0, 80), url })
        return
      }
    } catch {
      /* пользователь закрыл шэринг — молча падаем в копирование */
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard недоступен (http) — ничего страшного */
    }
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5">
      {/* Автор */}
      <header className="flex items-center gap-3">
        <Avatar name={personName(post.author_name, lang)} src={post.author_avatar} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-900">{personName(post.author_name, lang)}</p>
          <p className="text-xs text-neutral-400">
            {post.author_city && `${cityName(post.author_city, lang)} · `}
            {detail ? (
              formatRelativeLang(post.created_at, lang)
            ) : (
              <Link href={`/community/${post.id}`} className="hover:text-primary">
                {formatRelativeLang(post.created_at, lang)}
              </Link>
            )}
          </p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', kind.className)}>
          {kind.label}
        </span>
      </header>

      {/* Текст */}
      {detail ? (
        <p className="mt-4 whitespace-pre-line leading-relaxed text-neutral-700">{postText(post, lang)}</p>
      ) : (
        <Link href={`/community/${post.id}`} className="block">
          <p className="mt-4 whitespace-pre-line leading-relaxed text-neutral-700">{postText(post, lang)}</p>
        </Link>
      )}

      {/* Фото */}
      {post.images.length > 0 && (
        <div className={cn('mt-4 grid gap-2 overflow-hidden rounded-xl', post.images.length > 1 && 'grid-cols-2')}>
          {post.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className={cn('w-full rounded-xl object-cover', post.images.length > 1 ? 'aspect-square' : 'max-h-96')}
            />
          ))}
        </div>
      )}

      {/* Теги */}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tg) => (
            <span key={tg} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
              #{tagLabel(tg, lang)}
            </span>
          ))}
        </div>
      )}

      {/* Привязанный товар — прямой путь в покупку */}
      {product && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <Link
            href={`/product/${product.id}`}
            className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white"
          >
            <Thumb
              src={product.images?.[0]}
              emoji={categoryEmoji(product.category_slug)}
              alt={productName(product, lang)}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/product/${product.id}`}
              className="line-clamp-2 text-sm font-medium text-neutral-800 hover:text-primary"
            >
              {productName(product, lang)}
            </Link>
            <p className="mt-0.5 text-sm font-bold text-primary">{formatPriceLang(product.price, lang)}</p>
          </div>
          <button
            onClick={() => addItem(product)}
            className="btn-primary shrink-0 !px-4 !py-2 text-xs"
            aria-label={t.community.addToCart}
          >
            <ShoppingBag size={14} />
            <span className="hidden sm:inline">{t.community.addToCart}</span>
          </button>
        </div>
      )}

      {/* Действия */}
      <footer className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-3">
        <button
          onClick={() => toggleLike(post.id)}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            liked ? 'text-primary' : 'text-neutral-500 hover:text-primary',
          )}
          aria-pressed={liked}
        >
          <Heart size={18} className={liked ? 'fill-primary' : ''} />
          {post.likes}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-primary"
        >
          <MessageCircle size={18} />
          {post.comments.length}
        </button>
        <button
          onClick={share}
          className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-primary"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">{copied ? t.community.linkCopied : t.community.share}</span>
        </button>
        {!detail && (
          <Link
            href={`/community/${post.id}`}
            className="ml-auto text-sm font-medium text-primary hover:underline"
          >
            {t.community.openPost} →
          </Link>
        )}
      </footer>

      {/* Комментарии */}
      {showComments && (
        <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
          {post.comments.length === 0 && (
            <p className="text-sm text-neutral-400">{t.community.noComments}</p>
          )}
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={personName(c.author_name, lang)} size="sm" />
              <div className="min-w-0 flex-1 rounded-xl bg-neutral-50 px-3 py-2">
                <p className="text-xs font-medium text-neutral-800">
                  {personName(c.author_name, lang)}
                  <span className="ml-2 font-normal text-neutral-400">
                    {formatRelativeLang(c.created_at, lang)}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-neutral-700">{commentText(c, lang)}</p>
              </div>
            </div>
          ))}

          <form onSubmit={submitComment} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.community.commentPlaceholder}
              className="input !py-2 text-sm"
            />
            <button type="submit" className="btn-primary shrink-0 !px-3.5 !py-2" aria-label={t.community.send}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
