/**
 * Сид демо-каталога в живую базу (для стенда/жюри). Магазины помечаются is_demo=true,
 * чтобы перед боевым запуском их можно было убрать одной командой: `npm run seed -- --clear`.
 *
 * Запуск:  npm run seed          — залить демо-магазины, товары и контент сообщества (посты, Q&A)
 *          npm run seed -- --reseed-community — пересоздать демо-посты/Q&A (лайки и комментарии к ним сбросятся)
 *          npm run seed -- --clear — удалить всё демо (каскадом: товары, заказы, посты).
 *          ВНИМАНИЕ: --clear удалит и демо-магазин, привязанный к демо-аккаунту стенда (Seoul Beauty).
 * Ключи берутся из .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { demoShops, demoProducts, demoPosts, demoQuestions } from '../lib/demo'

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
    const { error: e1 } = await supabase.rpc('clear_demo_community')
    if (e1) throw e1
    const { data, error } = await supabase.rpc('clear_demo')
    if (error) throw error
    console.log(`Удалено демо-магазинов: ${data}; демо-контент сообщества очищен`)
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

  // seed_demo не чистит перед вставкой — повторный запуск не должен плодить дубли магазинов
  const { data: existing } = await supabase.from('shops').select('id').eq('is_demo', true).limit(1)
  if ((existing ?? []).length > 0) {
    console.log('Демо-магазины уже есть — каталог не трогаем (для пересоздания: npm run seed -- --clear)')
  } else {
    const { data, error } = await supabase.rpc('seed_demo', { p_shops: shops, p_products: products })
    if (error) throw error
    console.log('Сид выполнен:', JSON.stringify(data))
    // Демо-магазины участвуют в Davra — иначе скидку круга на стенде не показать
    await supabase.from('shops').update({ davra_enabled: true }).eq('is_demo', true)
  }

  // Сообщество: товары привязываются по имени среди товаров демо-магазинов (см. 008/009).
  // Повторный сид пересоздаёт демо-посты с новыми id (реакции к ним пропадут) — только по явному флагу.
  const { data: existingPosts } = await supabase.from('community_posts').select('id').eq('is_demo', true).limit(1)
  if ((existingPosts ?? []).length > 0 && !process.argv.includes('--reseed-community')) {
    console.log('Демо-посты уже есть — сообщество не трогаем (пересоздать: npm run seed -- --reseed-community)')
    return
  }
  const productName = new Map(demoProducts.map((p) => [p.id, p.name]))
  const posts = demoPosts.map((p) => ({
    key: p.id,
    author_name: p.author_name,
    author_city: p.author_city,
    author_avatar: p.author_avatar ?? null,
    kind: p.kind,
    text: p.text,
    images: p.images,
    tags: p.tags,
    product_name: p.product_id ? (productName.get(p.product_id) ?? null) : null,
    likes: p.likes,
    created_at: p.created_at,
  }))
  const comments = demoPosts.flatMap((p) =>
    p.comments.map((c) => ({ key: c.id, post_key: p.id, author_name: c.author_name, text: c.text, created_at: c.created_at })),
  )
  const questions = demoQuestions.map((q) => ({
    key: q.id,
    product_name: productName.get(q.product_id) ?? null,
    author_name: q.author_name,
    text: q.text,
    created_at: q.created_at,
  }))
  const answers = demoQuestions.flatMap((q) =>
    q.answers.map((a) => ({
      key: a.id,
      question_key: q.id,
      author_name: a.author_name,
      is_seller: a.is_seller,
      text: a.text,
      created_at: a.created_at,
    })),
  )
  const { data: c, error: ce } = await supabase.rpc('seed_demo_community', {
    p_posts: posts,
    p_comments: comments,
    p_questions: questions,
    p_answers: answers,
  })
  if (ce) throw ce
  console.log('Сообщество засеяно:', JSON.stringify(c))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
