import type { Metadata } from 'next'
import { getMyLoyalty } from '@/lib/data'
import LoyaltyView from '@/components/loyalty/LoyaltyView'

export const metadata: Metadata = {
  title: 'Карта лояльности',
  description:
    'Программа лояльности SEVIMLI: баллы за завершённые покупки, уровни Bronze–Platinum и кешбэк баллами до 5%.',
}

export const dynamic = 'force-dynamic'

export default async function LoyaltyPage() {
  // Боевой режим: баллы и история с сервера (начисляет complete_order); демо/гость → null
  const server = await getMyLoyalty()
  return <LoyaltyView server={server} />
}
