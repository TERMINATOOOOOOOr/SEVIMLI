/**
 * Назначить роль пользователю (по умолчанию admin) — доступ к /admin.
 * Запуск:  npm run make-admin -- gulnoza@example.com
 *          npm run make-admin -- someone@example.com buyer   (снять права)
 * Ключи — из .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Пользователь должен быть зарегистрирован.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* нет файла — берём из process.env */
  }
  return { ...out, ...process.env } as Record<string, string>
}

async function main() {
  const [email, role = 'admin'] = process.argv.slice(2)
  if (!email) {
    console.error('Укажите email: npm run make-admin -- user@example.com [admin|seller|buyer]')
    process.exit(1)
  }
  const env = loadEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url.includes('placeholder')) {
    console.error('Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local')
    process.exit(1)
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await supabase.rpc('set_user_role', { p_email: email, p_role: role })
  if (error) {
    console.error(/user_not_found/.test(error.message) ? `Пользователь ${email} не найден — сначала регистрация на сайте.` : error.message)
    process.exit(1)
  }
  console.log(`Готово: ${email} → ${role} (id ${data})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
