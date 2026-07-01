import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getNewProducts } from '@/lib/data'
import ProductCard from '@/components/cards/ProductCard'

export default async function NewProducts() {
  const products = await getNewProducts(8)
  if (products.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="section-title">Новинки</h2>
        <Link href="/catalog/clothes" className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2">
          Все товары <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
