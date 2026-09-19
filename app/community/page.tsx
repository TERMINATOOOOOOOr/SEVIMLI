import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { getNewProducts, getCommunityFeed, getViewer, getMyLikedPostIds } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { isSupabaseConfigured } from '@/lib/utils'
import CommunityFeed from '@/components/community/CommunityFeed'
import SoftGlow from '@/components/ui/SoftGlow'
import WeightlessBg from '@/components/ui/Weightless'

export const metadata: Metadata = {
  title: 'Сообщество',
  description:
    'Живое сообщество SEVIMLI: реальные отзывы, вопросы и советы о косметике, одежде и салонах. Спроси — и сразу купи проверенное.',
}

export const dynamic = 'force-dynamic'

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { t } = await getT()
  const page = Math.max(1, Number((await searchParams).page) || 1)
  // Товары нужны, чтобы прикреплять их к постам и вести из ленты сразу в покупку.
  const [products, feed, viewer] = await Promise.all([getNewProducts(50), getCommunityFeed(page), getViewer()])
  const likedIds = viewer ? await getMyLikedPostIds(viewer.id, feed.posts.map((p) => p.id)) : []
  // Демо: лента живёт в localStorage — серверные пропсы не нужны, не раздуваем HTML демо-постами
  const live = isSupabaseConfigured()

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SoftGlow variant="rose" />
      <WeightlessBg seed={0} />
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
          <Users size={16} /> {t.community.badge}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
          {t.community.title}
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-600">{t.community.subtitle}</p>
      </header>

      {/* key: при переходе ?page=N локальное состояние ленты переинициализируется */}
      <CommunityFeed
        key={page}
        products={products}
        initialPosts={live ? feed.posts : []}
        initialLikedIds={likedIds}
        viewer={viewer}
        page={page}
        hasMore={feed.hasMore}
      />
    </div>
  )
}
