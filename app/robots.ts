import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** Личные и служебные разделы закрыты от индексации; карта сайта — sitemap.xml. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth', '/profile', '/cart', '/seller', '/admin', '/courier', '/loyalty', '/davra/join/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
