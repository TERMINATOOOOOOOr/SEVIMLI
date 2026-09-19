/** Базовый адрес сайта — для sitemap, robots и абсолютных ссылок в метаданных. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sevimli-production.up.railway.app').replace(/\/+$/, '')
