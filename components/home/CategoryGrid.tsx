import Link from 'next/link'
import { getCategories } from '@/lib/data'

export default async function CategoryGrid() {
  const categories = await getCategories()

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h2 className="section-title mb-8 text-center">Что ищешь?</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalog/${c.slug}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-3xl transition-colors group-hover:bg-primary/15">
              {c.icon}
            </span>
            <span className="font-medium text-neutral-800 group-hover:text-primary">
              {c.name_ru}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
