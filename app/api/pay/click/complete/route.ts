import { handleClick } from '@/lib/pay-click'

export const dynamic = 'force-dynamic'

/** Click, шаг Complete (action=1). Адрес для кабинета магазина: https://<сайт>/api/pay/click/complete */
export async function POST(req: Request): Promise<Response> {
  return handleClick(req, 1)
}
