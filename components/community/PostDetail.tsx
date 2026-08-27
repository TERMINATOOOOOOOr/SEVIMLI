'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { MessagesSquare } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useCommunity } from '@/store/community'
import { useHasMounted } from '@/lib/hooks'
import { useLang } from '@/components/LangProvider'
import PostCard from '@/components/community/PostCard'

export default function PostDetail({ postId, products }: { postId: string; products: Product[] }) {
  const mounted = useHasMounted()
  const { t } = useLang()
  const posts = useCommunity((s) => s.posts)

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

  if (!mounted) {
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

  return (
    <div className="space-y-8">
      <PostCard
        post={post}
        product={post.product_id ? (productById.get(post.product_id) ?? null) : null}
        detail
      />

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t.community.relatedPosts}</h2>
          <div className="space-y-5">
            {related.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                product={p.product_id ? (productById.get(p.product_id) ?? null) : null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
