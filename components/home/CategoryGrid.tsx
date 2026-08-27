import Link from 'next/link'
import { getCategories } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { categoryName } from '@/lib/i18n'

export default async function CategoryGrid() {
  const categories = await getCategories()
  const { lang, t } = await getT()

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h2 className="section-title mb-8 text-center">{t.home.categoriesTitle}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalog/${c.slug}`}
            className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/img/categories/${c.slug}.jpg`}
                alt={categoryName(c, lang)}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute left-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-lg shadow-sm backdrop-blur">
                {c.icon}
              </span>
            </div>
            <div className="p-3.5 text-center">
              <span className="font-medium text-neutral-800 group-hover:text-primary">
                {categoryName(c, lang)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
