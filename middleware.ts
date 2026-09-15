import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimit, clientIp } from '@/lib/rate-limit'

/** API-эндпоинты авторизации (любой метод) и POST на страницы входа. */
const API_AUTH = /^\/api\/(auth|login|signin|signup)(\/|$)/i
const AUTH_PAGE = /^\/(auth|login|signin|signup)(\/|$)/i

// Лимит попыток входа: 5 за 15 минут на IP, дальше 429 с Retry-After.
const AUTH_LIMIT = 5
const AUTH_WINDOW_MS = 15 * 60 * 1000

/** Демо-кабинет курьера открыт только по флагу: своей курьерской сети у SEVIMLI нет. */
const COURIER_DEMO = process.env.NEXT_PUBLIC_COURIER_DEMO === '1'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const method = request.method

  // Настоящий 404 (а не 200 со стримом not-found из-за loading.tsx)
  if (!COURIER_DEMO && /^\/courier(\/|$)/.test(path)) {
    return NextResponse.rewrite(new URL('/__hidden__', request.url), { status: 404 })
  }

  const isBruteforceable =
    API_AUTH.test(path) || (AUTH_PAGE.test(path) && method !== 'GET' && method !== 'HEAD')

  if (isBruteforceable) {
    const ip = clientIp(request.headers)
    const r = rateLimit(`auth:${ip}`, AUTH_LIMIT, AUTH_WINDOW_MS)
    if (!r.ok) {
      return new NextResponse(
        JSON.stringify({ error: 'Слишком много попыток входа. Повторите позже.' }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'retry-after': String(r.retryAfter),
            'cache-control': 'no-store',
          },
        },
      )
    }
  }

  return updateSession(request)
}

export const config = {
  // Все роуты, кроме статики и картинок
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
