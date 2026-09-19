'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { MessagesSquare, ArrowRight } from 'lucide-react'
import type { CommunityPost, Product, Viewer } from '@/lib/types'
import { useCommunity, postsByProduct } from '@/store/community'
import { COMMUNITY_LIVE } from '@/lib/community-live'
import { useLivePosts } from '@/lib/community-hooks'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'
import PostCard from '@/components/community/PostCard'

interface Props {
  product: Product
  /** Боевой режим: обсуждения товара с сервера (в демо игнорируются). */
  initialPosts: CommunityPost[]
  initialLikedIds: string[]
  viewer: Viewer | null
}

/**
 * Живые обсуждения этого товара из встроенного сообщества.
 * Это и есть связка «соц-медиа → карточка товара»: реальный опыт рядом с кнопкой покупки.
 */
export default function ProductPosts({ product, initialPosts, initialLikedIds, viewer }: Props) {
  const mounted = useHasMounted()
  const { t } = useLang()
  const allPosts = useCommunity((s) => s.posts)
  const storePosts = useMemo(() => postsByProduct(allPosts, product.id), [allPosts, product.id])
  const live = useLivePosts({ initialPosts, initialLikedIds, viewer })
  const posts = COMMUNITY_LIVE ? live.posts : storePosts

  if (!COMMUNITY_LIVE && !mounted) {
    return <div className="mt-16 h-40 animate-pulse rounded-2xl bg-neutral-100" />
  }

  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessagesSquare size={22} className="text-primary" />
          <h2 className="section-title !text-2xl">
            {t.product.postsTitle} {posts.length > 0 && `(${posts.length})`}
          </h2>
        </div>
        <Link href="/community" className="text-sm font-medium text-primary hover:underline">
          {t.product.allDiscussions} <ArrowRight size={14} className="inline" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-12 text-center">
          <MessagesSquare size={36} className="text-neutral-300" />
          <p className="text-neutral-400">{t.product.noPosts}</p>
          <Link href="/community" className="btn-outline !py-2 text-sm">
            {t.product.shareExp}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} product={product} live={COMMUNITY_LIVE ? live.actions : undefined} />
          ))}
        </div>
      )}
    </section>
  )
}
