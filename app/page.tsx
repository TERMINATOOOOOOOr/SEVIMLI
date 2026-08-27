import { Suspense } from 'react'
import Hero from '@/components/home/Hero'
import CategoryGrid from '@/components/home/CategoryGrid'
import KoreanBeauty from '@/components/home/KoreanBeauty'
import CommunityCTA from '@/components/home/CommunityCTA'
import FeaturedShops from '@/components/home/FeaturedShops'
import NewProducts from '@/components/home/NewProducts'
import { CategoriesSkeleton, ProductsSkeleton } from '@/components/ui/Skeletons'

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoryGrid />
      </Suspense>
      <Suspense fallback={<ProductsSkeleton count={4} />}>
        <KoreanBeauty />
      </Suspense>
      <Suspense fallback={<ProductsSkeleton count={3} />}>
        <CommunityCTA />
      </Suspense>
      <Suspense fallback={<ProductsSkeleton count={6} />}>
        <FeaturedShops />
      </Suspense>
      <Suspense fallback={<ProductsSkeleton />}>
        <NewProducts />
      </Suspense>
    </>
  )
}
