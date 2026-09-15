/**
 * Сид демо-каталога в живую базу (для стенда/жюри). Магазины помечаются is_demo=true,
 * чтобы перед боевым запуском их можно было убрать одной командой: `npm run seed -- --clear`.
 *
 * Запуск:  npm run seed          — залить демо-магазины и товары
 *          npm run seed -- --clear — удалить всё демо (каскадом: товары, заказы)
 * Ключи берутся из .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { demoShops, demoProducts } from '../lib/demo'

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
  const env = loadEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url.includes('placeholder')) {
    console.error('Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local')
    process.exit(1)
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  if (process.argv.includes('--clear')) {
    const { data, error } = await supabase.rpc('clear_demo')
    if (error) throw error
    console.log(`Удалено демо-магазинов: ${data}`)
    return
  }

  const shops = demoShops.map((s) => ({
    key: s.id,
    name: s.name,
    description: s.description,
    category_slug: s.category_slug,
    logo_url: s.logo_url,
    city: s.city,
    is_verified: s.is_verified,
    rating: s.rating,
    reviews_count: s.reviews_count,
  }))
  const products = demoProducts.map((p) => ({
    shop_key: p.shop_id,
    name: p.name,
    description: p.description,
    price: p.price,
    old_price: p.old_price,
    images: p.images ?? [],
    category_slug: p.category_slug,
    stock: p.stock,
    is_active: p.is_active,
    brand: p.brand ?? null,
    country: p.country ?? null,
    is_original: p.is_original ?? false,
    market_price: p.market_price ?? null,
  }))

  const { data, error } = await supabase.rpc('seed_demo', { p_shops: shops, p_products: products })
  if (error) throw error
  console.log('Сид выполнен:', JSON.stringify(data))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
