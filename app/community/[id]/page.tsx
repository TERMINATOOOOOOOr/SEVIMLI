import type { Metadata } from 'next'
import Link from 'next/link'
import { getNewProducts } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import PostDetail from '@/components/community/PostDetail'

export const metadata: Metadata = { title: 'Пост сообщества' }

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getT()
  const products = await getNewProducts(50)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/community" className="text-sm font-medium text-primary hover:underline">
        {t.community.backToFeed}
      </Link>
      <div className="mt-5">
        <PostDetail postId={id} products={products} />
      </div>
    </div>
  )
}
