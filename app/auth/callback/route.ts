import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeInternalPath } from '@/lib/security'

/** Обмен кода подтверждения на сессию (email confirm / magic link). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Только внутренние пути — иначе open redirect через ссылку из письма
  const next = safeInternalPath(searchParams.get('next'), '/profile')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
