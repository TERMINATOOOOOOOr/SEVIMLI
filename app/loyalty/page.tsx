import type { Metadata } from 'next'
import LoyaltyView from '@/components/loyalty/LoyaltyView'

export const metadata: Metadata = {
  title: 'Карта лояльности',
  description:
    'Программа лояльности SEVIMLI: кешбэк баллами до 5%, бесплатная доставка, ранний доступ к новинкам и подарки.',
}

export default function LoyaltyPage() {
  return <LoyaltyView />
}
