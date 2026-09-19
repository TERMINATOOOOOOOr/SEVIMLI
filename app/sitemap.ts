import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { getCategories, getSitemapEntries } from '@/lib/data'

export const revalidate = 3600

/** Публичные страницы: разделы, категории, товары, магазины, посты сообщества. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [categories, entries] = await Promise.all([getCategories(), getSitemapEntries()])

  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/korean`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/community`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/davra`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/assistant`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/verify`, changeFrequency: 'monthly', priority: 0.5 },
  ].map((e) => ({ ...e, lastModified: now })) as MetadataRoute.Sitemap

  return [
    ...fixed,
    ...categories.map((c) => ({
      url: `${SITE_URL}/catalog/${c.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...entries.products.map((p) => ({
      url: `${SITE_URL}/product/${p.id}`,
      lastModified: new Date(p.at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...entries.shops.map((s) => ({
      url: `${SITE_URL}/shop/${s.id}`,
      lastModified: new Date(s.at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...entries.posts.map((p) => ({
      url: `${SITE_URL}/community/${p.id}`,
      lastModified: new Date(p.at),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}
