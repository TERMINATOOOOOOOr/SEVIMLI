'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { MessagesSquare } from 'lucide-react'
import type { CommunityPost, Product, Viewer } from '@/lib/types'
import { useCommunity } from '@/store/community'
import { COMMUNITY_LIVE } from '@/lib/community-live'
import { useLivePosts } from '@/lib/community-hooks'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'
import PostCard from '@/components/community/PostCard'

interface Props {
  postId: string
  products: Product[]
  /** Боевой режим: пост и срез ленты для «похожих» — с сервера. */
  initialPost: CommunityPost | null
  initialPosts: CommunityPost[]
  initialLikedIds: string[]
  viewer: Viewer | null
}

export default function PostDetail({ postId, products, initialPost, initialPosts, initialLikedIds, viewer }: Props) {
  const mounted = useHasMounted()
  const { t } = useLang()
  const storePosts = useCommunity((s) => s.posts)
  const live = useLivePosts({
    initialPosts: initialPost ? [initialPost, ...initialPosts.filter((p) => p.id !== initialPost.id)] : initialPosts,
    initialLikedIds,
    viewer,
  })
  const posts = COMMUNITY_LIVE ? live.posts : storePosts

  const post = useMemo(() => posts.find((p) => p.id === postId) ?? null, [posts, postId])

  const related = useMemo(() => {
    if (!post) return []
    return posts
      .filter((p) => p.id !== post.id && (p.kind === post.kind || p.tags.some((tg) => post.tags.includes(tg))))
      .slice(0, 3)
  }, [posts, post])

  const productById = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  if (!COMMUNITY_LIVE && !mounted) {
    return <div className="h-72 animate-pulse rounded-2xl bg-neutral-100" />
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
        <MessagesSquare size={40} />
        <p>{t.community.postNotFound}</p>
        <Link href="/community" className="btn-primary !py-2.5 text-sm">
          {t.community.backToFeed}
        </Link>
      </div>
    )
  }

  const liveActions = COMMUNITY_LIVE ? live.actions : undefined
  const productOf = (p: CommunityPost) =>
    p.product ?? (p.product_id ? (productById.get(p.product_id) ?? null) : null)

  return (
    <div className="space-y-8">
      <PostCard post={post} product={productOf(post)} live={liveActions} detail />

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t.community.relatedPosts}</h2>
          <div className="space-y-5">
            {related.map((p) => (
              <PostCard key={p.id} post={p} product={productOf(p)} live={liveActions} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
