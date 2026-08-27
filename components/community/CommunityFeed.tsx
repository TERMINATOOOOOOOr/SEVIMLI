'use client'

import { useMemo, useState } from 'react'
import { MessagesSquare, Clock, Flame } from 'lucide-react'
import type { PostKind, Product } from '@/lib/types'
import { useCommunity, tagsOf } from '@/store/community'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'
import { tagLabel } from '@/lib/community-i18n'
import { cn } from '@/lib/utils'
import PostCard from '@/components/community/PostCard'
import PostComposer from '@/components/community/PostComposer'

type Filter = 'all' | PostKind
type Sort = 'new' | 'popular'

export default function CommunityFeed({ products }: { products: Product[] }) {
  const mounted = useHasMounted()
  const { lang, t } = useLang()
  const posts = useCommunity((s) => s.posts)
  const tags = useMemo(() => tagsOf(posts), [posts])

  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('new')
  const [tag, setTag] = useState<string | null>(null)

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: t.community.filterAll },
    { id: 'review', label: t.community.filterReview },
    { id: 'question', label: t.community.filterQuestion },
    { id: 'tip', label: t.community.filterTip },
  ]

  const productById = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  const visible = useMemo(() => {
    let list = posts
    if (filter !== 'all') list = list.filter((p) => p.kind === filter)
    if (tag) list = list.filter((p) => p.tags.includes(tag))
    return [...list].sort((a, b) =>
      sort === 'popular'
        ? b.likes + b.comments.length * 2 - (a.likes + a.comments.length * 2)
        : +new Date(b.created_at) - +new Date(a.created_at),
    )
  }, [posts, filter, tag, sort])

  // Пока не смонтировались — не рендерим данные из localStorage (защита от hydration mismatch)
  if (!mounted) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div className="space-y-5">
        <PostComposer products={products} />

        {/* Фильтры по типу + сортировка */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                filter === f.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              )}
            >
              {f.label}
            </button>
          ))}
          {tag && (
            <button
              onClick={() => setTag(null)}
              className="rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary"
            >
              #{tagLabel(tag, lang)} ✕
            </button>
          )}

          <div className="ml-auto flex items-center gap-0.5 rounded-full bg-neutral-100 p-0.5">
            <button
              onClick={() => setSort('new')}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                sort === 'new' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500',
              )}
            >
              <Clock size={13} /> {t.community.sortNew}
            </button>
            <button
              onClick={() => setSort('popular')}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                sort === 'popular' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500',
              )}
            >
              <Flame size={13} /> {t.community.sortPopular}
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
            <MessagesSquare size={40} />
            <p>{t.community.empty}</p>
          </div>
        ) : (
          visible.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              product={post.product_id ? (productById.get(post.product_id) ?? null) : null}
            />
          ))
        )}
      </div>

      {/* Сайдбар: темы */}
      <aside className="h-fit lg:sticky lg:top-24">
        <div className="rounded-2xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900">{t.community.popularTags}</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map(({ tag: tg, count }) => (
              <button
                key={tg}
                onClick={() => setTag(tg === tag ? null : tg)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs transition-colors',
                  tg === tag
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-primary-light hover:text-primary',
                )}
              >
                #{tagLabel(tg, lang)} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-primary-light/40 p-5">
          <h3 className="font-semibold text-neutral-900">{t.community.rulesTitle}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
            {t.community.rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
