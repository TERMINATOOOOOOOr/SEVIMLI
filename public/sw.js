/* Service worker SEVIMLI: аккуратное кэширование без риска «залипших» страниц.
   Страницы — network-first (свежесть важнее), статика и фото — stale-while-revalidate.
   ВАЖНО: respondWith всегда получает настоящий Response — undefined ломает
   навигацию («This page couldn't load» в Chrome). */

const VERSION = 'sevimli-v3'
const IMG_CACHE = `${VERSION}-img`
const STATIC_CACHE = `${VERSION}-static`
const PAGE_CACHE = `${VERSION}-pages`

const OFFLINE_HTML = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SEVIMLI — offline</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#fff;color:#1a1a1a;margin:0;padding:24px;text-align:center}
.card{max-width:340px}h1{color:#c4507a;font-size:22px}p{color:#666;font-size:15px;line-height:1.5}
button{margin-top:16px;background:#c4507a;color:#fff;border:0;border-radius:999px;padding:12px 28px;font-size:15px;font-weight:600}</style></head>
<body><div class="card"><h1>Нет соединения · Aloqa yo'q</h1>
<p>Проверьте интернет и попробуйте ещё раз.<br>Internetni tekshirib, qayta urinib ko'ring.</p>
<button onclick="location.reload()">Обновить · Yangilash</button></div></body></html>`

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  // Фото и иконки: сначала кэш, обновляем в фоне
  if (url.pathname.startsWith('/img/') || url.pathname.match(/\.(png|jpg|jpeg|webp|ico|svg)$/)) {
    event.respondWith(staleWhileRevalidate(request, IMG_CACHE))
    return
  }

  // Сборка Next: контент-хэши в именах — можно смело кэшировать
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
    return
  }

  // Навигация: сеть → кэш этой страницы → кэш главной → офлайн-страница
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Кэшируем только успешные ответы — 404/500 не должны «застревать» в офлайне
          if (res.ok && res.status === 200) {
            const copy = res.clone()
            caches.open(PAGE_CACHE).then((c) => c.put(request, copy)).catch(() => {})
          }
          return res
        })
        .catch(async () => {
          const hit = await caches.match(request)
          if (hit) return hit
          const home = await caches.match('/')
          if (home) return home
          return offlineResponse()
        }),
    )
  }
})

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone()).catch(() => {})
      return res
    })
    .catch(() => undefined)
  const result = cached || (await network)
  return result || Response.error()
}
