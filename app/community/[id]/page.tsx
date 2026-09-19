import type { Metadata } from 'next'
import Link from 'next/link'
import { getNewProducts, getCommunityPost, getCommunityFeed, getViewer, getMyLikedPostIds } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { isSupabaseConfigured } from '@/lib/utils'
import PostDetail from '@/components/community/PostDetail'

type Params = Promise<{ id: string }>

/** Заголовок и превью по тексту поста — для ссылок в Telegram/мессенджерах. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params
  const post = await getCommunityPost(id) // cache(): второй вызов в странице бесплатный
  if (!post) return { title: 'Пост сообщества' }
  const title = post.text.length > 60 ? post.text.slice(0, 57).trimEnd() + '…' : post.text
  const description = post.text.slice(0, 160)
  const image = post.images.find((src) => /^https?:\/\//.test(src))
  return {
    title,
    description,
    openGraph: { title, description, ...(image ? { images: [image] } : {}) },
  }
}

export default async function CommunityPostPage({ params }: { params: Params }) {
  const { id } = await params
  const { t } = await getT()
  const [products, post, feed, viewer] = await Promise.all([
    getNewProducts(50),
    getCommunityPost(id),
    getCommunityFeed(1, 30),
    getViewer(),
  ])
  const ids = [...(post ? [post.id] : []), ...feed.posts.map((p) => p.id)]
  const likedIds = viewer ? await getMyLikedPostIds(viewer.id, ids) : []
  const live = isSupabaseConfigured() // демо: данные из localStorage, пропсы пустые

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/community" className="text-sm font-medium text-primary hover:underline">
        {t.community.backToFeed}
      </Link>
      <div className="mt-5">
        {/* notFound() не зовём: PostDetail показывает свой экран «Пост не найден» с кнопкой в ленту */}
        <PostDetail
          key={id}
          postId={id}
          products={products}
          initialPost={live ? post : null}
          initialPosts={live ? feed.posts : []}
          initialLikedIds={likedIds}
          viewer={viewer}
        />
      </div>
    </div>
  )
}
