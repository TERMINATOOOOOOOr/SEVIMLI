import { createAdminClient } from '@/lib/supabase/admin'
import { toTiyin } from '@/lib/payments'

/**
 * Вебхук кассы Payme (Merchant API, JSON-RPC). Деньги идут магазину, поэтому ключ кассы —
 * у каждого магазина свой: по ключу из Basic-авторизации находим магазин, дальше работаем
 * только с его заказами. Сумма всегда берётся из базы, а не из запроса.
 *
 * Магазин указывает этот адрес в кабинете Payme: https://<сайт>/api/pay/payme
 */

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ERR = {
  auth: -32504,
  method: -32601,
  internal: -32400,
  cantDo: -31008,
  notFound: -31003,
  amount: -31001,
  account: -31050,
} as const

type Msg = { ru: string; uz: string; en: string }
const MESSAGES: Record<number, Msg> = {
  [ERR.auth]: { ru: 'Недостаточно прав', uz: 'Huquq yetarli emas', en: 'Not enough privileges' },
  [ERR.method]: { ru: 'Метод не найден', uz: 'Metod topilmadi', en: 'Method not found' },
  [ERR.internal]: { ru: 'Внутренняя ошибка', uz: 'Ichki xatolik', en: 'Internal error' },
  [ERR.cantDo]: { ru: 'Операция недоступна', uz: 'Amalni bajarib bo‘lmaydi', en: 'Operation is not allowed' },
  [ERR.notFound]: { ru: 'Транзакция не найдена', uz: 'Tranzaksiya topilmadi', en: 'Transaction not found' },
  [ERR.amount]: { ru: 'Неверная сумма', uz: 'Noto‘g‘ri summa', en: 'Wrong amount' },
  [ERR.account]: { ru: 'Заказ не найден', uz: 'Buyurtma topilmadi', en: 'Order not found' },
}

const jsonRes = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

const fail = (id: unknown, code: number, extra?: string) =>
  jsonRes({ jsonrpc: '2.0', id: id ?? null, error: { code, message: MESSAGES[code] ?? MESSAGES[ERR.internal], data: extra } })

const ms = (v: string | null | undefined) => (v ? Date.parse(v) : 0)

/** Ключ кассы из «Authorization: Basic base64(Paycom:KEY)». */
function keyFromAuth(header: string | null): string | null {
  if (!header?.startsWith('Basic ')) return null
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const idx = decoded.indexOf(':')
    return idx === -1 ? null : decoded.slice(idx + 1)
  } catch {
    return null
  }
}

/** id заказа из params.account (имя поля магазин задаёт сам, берём первое значение-uuid). */
function orderFromAccount(account: unknown): string | null {
  if (!account || typeof account !== 'object') return null
  for (const v of Object.values(account as Record<string, unknown>)) {
    if (typeof v === 'string' && UUID_RE.test(v.trim())) return v.trim()
  }
  return null
}

export async function POST(req: Request): Promise<Response> {
  const admin = createAdminClient()
  if (!admin) return fail(null, ERR.internal, 'not configured')

  let body: { id?: unknown; method?: string; params?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return fail(null, ERR.internal, 'bad json')
  }
  const rpcId = body.id ?? null
  const params = (body.params ?? {}) as Record<string, unknown>

  // 1) Авторизация: ключ кассы принадлежит конкретному магазину
  const key = keyFromAuth(req.headers.get('authorization'))
  if (!key) return fail(rpcId, ERR.auth)
  const { data: secret } = await admin.from('shop_payment_secrets').select('shop_id').eq('payme_key', key).maybeSingle()
  if (!secret?.shop_id) return fail(rpcId, ERR.auth)
  const shopId = secret.shop_id as string

  /** Заказ этого магазина: чужие заказы через этот ключ недоступны. */
  async function loadOrder(orderId: string | null) {
    if (!orderId || !UUID_RE.test(orderId)) return null
    const { data } = await admin!
      .from('orders')
      .select('id, shop_id, total_price, status, payment_status')
      .eq('id', orderId)
      .eq('shop_id', shopId)
      .maybeSingle()
    return data as { id: string; total_price: number | null; status: string; payment_status: string } | null
  }

  async function loadPayment(txn: string) {
    const { data } = await admin!
      .from('payments')
      .select('id, order_id, amount, state, created_at, paid_at, cancelled_at, raw')
      .eq('provider', 'payme')
      .eq('provider_txn_id', txn)
      .maybeSingle()
    return data as
      | { id: string; order_id: string; amount: number; state: string; created_at: string; paid_at: string | null; cancelled_at: string | null; raw: Record<string, unknown> | null }
      | null
  }

  const stateCode = (p: { state: string; paid_at: string | null }) =>
    p.state === 'paid' ? 2 : p.state === 'cancelled' ? (p.paid_at ? -2 : -1) : 1

  try {
    switch (body.method) {
      case 'CheckPerformTransaction': {
        const order = await loadOrder(orderFromAccount(params.account))
        if (!order) return fail(rpcId, ERR.account)
        if (order.status === 'cancelled') return fail(rpcId, ERR.cantDo, 'order cancelled')
        if (toTiyin(Number(order.total_price ?? 0)) !== Number(params.amount)) return fail(rpcId, ERR.amount)
        return jsonRes({ jsonrpc: '2.0', id: rpcId, result: { allow: true } })
      }

      case 'CreateTransaction': {
        const txn = String(params.id ?? '')
        const existing = await loadPayment(txn)
        if (existing) {
          // Повтор того же запроса: отвечаем тем же, что и в первый раз
          if (existing.state !== 'created') return fail(rpcId, ERR.cantDo, 'already finished')
          return jsonRes({ jsonrpc: '2.0', id: rpcId, result: { create_time: ms(existing.created_at), transaction: existing.id, state: 1 } })
        }
        const order = await loadOrder(orderFromAccount(params.account))
        if (!order) return fail(rpcId, ERR.account)
        if (order.payment_status === 'paid') return fail(rpcId, ERR.cantDo, 'already paid')
        if (toTiyin(Number(order.total_price ?? 0)) !== Number(params.amount)) return fail(rpcId, ERR.amount)
        // Другая незавершённая транзакция по этому заказу
        const { data: active } = await admin
          .from('payments')
          .select('id')
          .eq('order_id', order.id)
          .eq('provider', 'payme')
          .eq('state', 'created')
          .limit(1)
        if ((active ?? []).length > 0) return fail(rpcId, ERR.cantDo, 'another transaction in progress')

        const { error } = await admin.rpc('pay_apply', {
          p_order: order.id,
          p_provider: 'payme',
          p_txn: txn,
          p_amount: Number(order.total_price ?? 0),
          p_state: 'created',
          p_raw: { account: params.account, time: params.time },
        })
        if (error) return fail(rpcId, ERR.internal, error.message)
        const created = await loadPayment(txn)
        if (!created) return fail(rpcId, ERR.internal, 'not stored')
        return jsonRes({ jsonrpc: '2.0', id: rpcId, result: { create_time: ms(created.created_at), transaction: created.id, state: 1 } })
      }

      case 'PerformTransaction': {
        const txn = String(params.id ?? '')
        const p = await loadPayment(txn)
        if (!p) return fail(rpcId, ERR.notFound)
        if (p.state === 'paid') {
          return jsonRes({ jsonrpc: '2.0', id: rpcId, result: { transaction: p.id, perform_time: ms(p.paid_at), state: 2 } })
        }
        if (p.state !== 'created') return fail(rpcId, ERR.cantDo, 'cancelled')
        const { error } = await admin.rpc('pay_apply', {
          p_order: p.order_id,
          p_provider: 'payme',
          p_txn: txn,
          p_amount: p.amount,
          p_state: 'paid',
          p_raw: { ...(p.raw ?? {}), performed: true },
        })
        if (error) return fail(rpcId, ERR.internal, error.message)
        const done = await loadPayment(txn)
        return jsonRes({ jsonrpc: '2.0', id: rpcId, result: { transaction: p.id, perform_time: ms(done?.paid_at), state: 2 } })
      }

      case 'CancelTransaction': {
        const txn = String(params.id ?? '')
        const p = await loadPayment(txn)
        if (!p) return fail(rpcId, ERR.notFound)
        if (p.state !== 'cancelled') {
          const { error } = await admin.rpc('pay_apply', {
            p_order: p.order_id,
            p_provider: 'payme',
            p_txn: txn,
            p_amount: p.amount,
            p_state: 'cancelled',
            p_raw: { ...(p.raw ?? {}), reason: params.reason ?? null },
          })
          if (error) return fail(rpcId, ERR.internal, error.message)
        }
        const done = await loadPayment(txn)
        return jsonRes({
          jsonrpc: '2.0',
          id: rpcId,
          result: { transaction: p.id, cancel_time: ms(done?.cancelled_at), state: done ? stateCode(done) : -1 },
        })
      }

      case 'CheckTransaction': {
        const p = await loadPayment(String(params.id ?? ''))
        if (!p) return fail(rpcId, ERR.notFound)
        return jsonRes({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            create_time: ms(p.created_at),
            perform_time: ms(p.paid_at),
            cancel_time: ms(p.cancelled_at),
            transaction: p.id,
            state: stateCode(p),
            reason: (p.raw as { reason?: number } | null)?.reason ?? null,
          },
        })
      }

      case 'GetStatement': {
        const from = new Date(Number(params.from ?? 0)).toISOString()
        const to = new Date(Number(params.to ?? Date.now())).toISOString()
        const { data } = await admin
          .from('payments')
          .select('id, order_id, provider_txn_id, amount, state, created_at, paid_at, cancelled_at, raw, orders!inner(shop_id)')
          .eq('provider', 'payme')
          .eq('orders.shop_id', shopId)
          .gte('created_at', from)
          .lte('created_at', to)
        const rows = (data ?? []) as unknown as {
          id: string; order_id: string; provider_txn_id: string; amount: number; state: string
          created_at: string; paid_at: string | null; cancelled_at: string | null; raw: Record<string, unknown> | null
        }[]
        return jsonRes({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            transactions: rows.map((p) => ({
              id: p.provider_txn_id,
              time: ms(p.created_at),
              amount: toTiyin(Number(p.amount)),
              account: { order_id: p.order_id },
              create_time: ms(p.created_at),
              perform_time: ms(p.paid_at),
              cancel_time: ms(p.cancelled_at),
              transaction: p.id,
              state: stateCode(p),
              reason: (p.raw as { reason?: number } | null)?.reason ?? null,
            })),
          },
        })
      }

      default:
        return fail(rpcId, ERR.method)
    }
  } catch (e) {
    return fail(rpcId, ERR.internal, e instanceof Error ? e.message : 'error')
  }
}
