import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Колбэки Click (SHOP API): Prepare (action=0) и Complete (action=1).
 * Касса принадлежит магазину, поэтому секретный ключ берём у магазина заказа и им же
 * проверяем подпись. Сумма сверяется с базой, повторные вызовы идемпотентны.
 *
 * Магазин указывает в кабинете Click:
 *   Prepare  → https://<сайт>/api/pay/click/prepare
 *   Complete → https://<сайт>/api/pay/click/complete
 */

export const CLICK_ERR = {
  ok: 0,
  sign: -1,
  amount: -2,
  action: -3,
  alreadyPaid: -4,
  orderNotFound: -5,
  txnNotFound: -6,
  badRequest: -8,
  cancelled: -9,
} as const

const NOTE: Record<number, string> = {
  [CLICK_ERR.ok]: 'Success',
  [CLICK_ERR.sign]: 'SIGN CHECK FAILED',
  [CLICK_ERR.amount]: 'Incorrect parameter amount',
  [CLICK_ERR.action]: 'Action not found',
  [CLICK_ERR.alreadyPaid]: 'Already paid',
  [CLICK_ERR.orderNotFound]: 'User does not exist',
  [CLICK_ERR.txnNotFound]: 'Transaction does not exist',
  [CLICK_ERR.badRequest]: 'Error in request from click',
  [CLICK_ERR.cancelled]: 'Transaction cancelled',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const md5 = (s: string) => createHash('md5').update(s).digest('hex')

function reply(body: Record<string, unknown>, error: number) {
  return new Response(JSON.stringify({ ...body, error, error_note: NOTE[error] ?? 'Error' }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/** Click шлёт form-urlencoded, но встречается и JSON. */
async function readParams(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    const j = (await req.json()) as Record<string, unknown>
    return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, String(v ?? '')]))
  }
  const form = await req.formData()
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]))
}

export async function handleClick(req: Request, action: 0 | 1): Promise<Response> {
  const admin = createAdminClient()
  if (!admin) return reply({}, CLICK_ERR.badRequest)

  let p: Record<string, string>
  try {
    p = await readParams(req)
  } catch {
    return reply({}, CLICK_ERR.badRequest)
  }

  const base = {
    click_trans_id: p.click_trans_id,
    merchant_trans_id: p.merchant_trans_id,
  }
  const orderId = (p.merchant_trans_id ?? '').trim()
  if (!UUID_RE.test(orderId)) return reply(base, CLICK_ERR.orderNotFound)
  if (String(p.action ?? '') !== String(action)) return reply(base, CLICK_ERR.action)

  // Заказ → магазин → его секретный ключ Click
  const { data: info, error: infoErr } = await admin.rpc('pay_order_info', { p_order: orderId })
  if (infoErr || !info) return reply(base, CLICK_ERR.orderNotFound)
  const order = info as {
    id: string; total: number | null; status: string; payment_status: string
    click_secret_key: string | null; click_service_id: string | null
  }
  if (!order.click_secret_key) return reply(base, CLICK_ERR.sign)
  if (order.click_service_id && String(p.service_id ?? '') !== String(order.click_service_id)) {
    return reply(base, CLICK_ERR.sign)
  }

  // Подпись: для Prepare без merchant_prepare_id, для Complete — с ним
  const signSource =
    action === 0
      ? `${p.click_trans_id}${p.service_id}${order.click_secret_key}${p.merchant_trans_id}${p.amount}${p.action}${p.sign_time}`
      : `${p.click_trans_id}${p.service_id}${order.click_secret_key}${p.merchant_trans_id}${p.merchant_prepare_id}${p.amount}${p.action}${p.sign_time}`
  if (md5(signSource) !== String(p.sign_string ?? '').toLowerCase()) return reply(base, CLICK_ERR.sign)

  // Сумма всегда из базы
  const expected = Number(order.total ?? 0)
  if (Math.abs(Number(p.amount ?? 0) - expected) > 0.01) return reply(base, CLICK_ERR.amount)
  if (order.status === 'cancelled') return reply(base, CLICK_ERR.cancelled)

  const txn = String(p.click_trans_id ?? '')
  const { data: existing } = await admin
    .from('payments')
    .select('id, state')
    .eq('provider', 'click')
    .eq('provider_txn_id', txn)
    .maybeSingle()

  if (action === 0) {
    if (order.payment_status === 'paid') return reply(base, CLICK_ERR.alreadyPaid)
    if (!existing) {
      const { error } = await admin.rpc('pay_apply', {
        p_order: orderId,
        p_provider: 'click',
        p_txn: txn,
        p_amount: expected,
        p_state: 'created',
        p_raw: { prepare: p },
      })
      if (error) return reply(base, CLICK_ERR.badRequest)
    }
    const { data: row } = await admin.from('payments').select('id').eq('provider', 'click').eq('provider_txn_id', txn).maybeSingle()
    return reply({ ...base, merchant_prepare_id: row?.id ?? orderId }, CLICK_ERR.ok)
  }

  // Complete
  if (!existing) return reply(base, CLICK_ERR.txnNotFound)
  if (String(p.merchant_prepare_id ?? '') !== String(existing.id)) return reply(base, CLICK_ERR.txnNotFound)
  if (Number(p.error ?? 0) < 0) {
    await admin.rpc('pay_apply', { p_order: orderId, p_provider: 'click', p_txn: txn, p_amount: expected, p_state: 'cancelled', p_raw: { complete: p } })
    return reply({ ...base, merchant_confirm_id: existing.id }, CLICK_ERR.cancelled)
  }
  if (existing.state === 'paid') return reply({ ...base, merchant_confirm_id: existing.id }, CLICK_ERR.alreadyPaid)
  const { error } = await admin.rpc('pay_apply', {
    p_order: orderId,
    p_provider: 'click',
    p_txn: txn,
    p_amount: expected,
    p_state: 'paid',
    p_raw: { complete: p },
  })
  if (error) return reply(base, CLICK_ERR.badRequest)
  return reply({ ...base, merchant_confirm_id: existing.id }, CLICK_ERR.ok)
}
