import { getFeaturedShops } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import ShopCard from '@/components/cards/ShopCard'

export default async function FeaturedShops() {
  const shops = await getFeaturedShops(6)
  const { t } = await getT()
  if (shops.length === 0) return null

  return (
    <section className="bg-neutral-50 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="section-title mb-8">{t.home.shopsTitle}</h2>

        {/* Мобильный горизонтальный скролл / grid на десктопе */}
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </div>
    </section>
  )
}
