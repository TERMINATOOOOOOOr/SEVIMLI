import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/utils'

const PROTECTED = ['/profile', '/cart', '/seller']

/**
 * Обновляет сессию Supabase и защищает приватные роуты.
 * Если Supabase не настроен (заглушки) — пропускаем всё как есть.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured()) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Админка: всем, кроме profiles.role = 'admin', отдаём честный 404 (страница сама проверяет роль ещё раз)
  if (path === '/admin' || path.startsWith('/admin/')) {
    let isAdmin = false
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      isAdmin = data?.role === 'admin'
    }
    if (!isAdmin) return NextResponse.rewrite(new URL('/__hidden__', request.url), { status: 404 })
  }

  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + '/'))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  return response
}
