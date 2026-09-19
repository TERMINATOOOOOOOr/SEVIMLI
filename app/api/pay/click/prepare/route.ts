import { handleClick } from '@/lib/pay-click'

export const dynamic = 'force-dynamic'

/** Click, шаг Prepare (action=0). Адрес для кабинета магазина: https://<сайт>/api/pay/click/prepare */
export async function POST(req: Request): Promise<Response> {
  return handleClick(req, 0)
}
