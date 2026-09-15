import type { NextConfig } from 'next'

/**
 * Заголовки безопасности для всех ответов.
 * CSP прагматичный: Next.js требует inline-скрипты для гидратации,
 * поэтому script-src с 'unsafe-inline' (ужесточение через nonce — при
 * подключении реального бэкенда). Внешних доменов у нас нет вообще —
 * это сильно сужает поверхность атаки.
 */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "media-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // камера — себе (для будущего QR-сканера подлинности), остальное закрыто
    value: 'camera=(self), microphone=(), geolocation=(), payment=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Обезличиваем стек: убираем наводку на Next.js. Заголовок Server
  // («railway-hikari») ставит edge-прокси Railway уже после нас —
  // из приложения его снять нельзя, пробуем переопределить.
  { key: 'Server', value: 'SEVIMLI' },
]

const nextConfig: NextConfig = {
  // Убирает заголовок x-powered-by: Next.js
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
