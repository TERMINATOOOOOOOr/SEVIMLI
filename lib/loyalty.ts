import type { LoyaltyTier } from '@/lib/types'

/** Конфигурация программы лояльности SEVIMLI. */

export interface TierConfig {
  id: LoyaltyTier
  label: string
  /** Порог входа в уровень (в баллах). */
  threshold: number
  /** Кешбэк баллами от суммы заказа, %. */
  cashback: number
  /** Классы градиента карты. */
  gradient: string
  /** CSS-градиент металлического чипа уровня на карте. */
  chip: string
  perks: string[]
}

export const TIERS: TierConfig[] = [
  {
    id: 'bronze',
    label: 'Bronze',
    threshold: 0,
    cashback: 1,
    gradient: 'from-[#8a5a46] via-[#b7876a] to-[#5f3a28]',
    chip: 'linear-gradient(160deg, #d9a08c, #8a5a48)',
    perks: ['1% кешбэк баллами', 'Ранний доступ к акциям', 'Доступ к сообществу'],
  },
  {
    id: 'silver',
    label: 'Silver',
    threshold: 1000,
    cashback: 2,
    gradient: 'from-[#7d838c] via-[#adb3bc] to-[#666c76]',
    chip: 'linear-gradient(160deg, #dfe3e8, #8d939c)',
    perks: ['2% кешбэк баллами', 'Ранний доступ к новинкам', 'Подарок в день рождения'],
  },
  {
    id: 'gold',
    label: 'Gold',
    threshold: 3000,
    cashback: 3,
    gradient: 'from-[#a8874a] via-[#d3b87e] to-[#8a6a34]',
    chip: 'linear-gradient(160deg, #ecd9a8, #a8874a)',
    perks: ['3% кешбэк баллами', 'Приоритетная поддержка', 'Закрытые распродажи'],
  },
  {
    id: 'platinum',
    label: 'Platinum',
    threshold: 8000,
    cashback: 5,
    gradient: 'from-primary via-primary-dark to-neutral-900',
    chip: 'linear-gradient(160deg, #f3c6dd, #8d2f5f)',
    perks: ['5% кешбэк баллами', 'Подарки от магазинов-партнёров', 'Ранний доступ к Davra-дропам'],
  },
]

/** Баллами можно оплатить не больше этой доли заказа. */
export const MAX_POINTS_SHARE = 0.2
/** Срок жизни баллов, дней. */
export const POINTS_TTL_DAYS = 180

/** 1 балл за каждые 1000 сум заказа (базовое начисление). */
export const POINTS_PER_SUM = 1000

/** Уровень по количеству накопленных баллов. */
export function tierOf(points: number): TierConfig {
  return [...TIERS].reverse().find((t) => points >= t.threshold) ?? TIERS[0]
}

/** Следующий уровень (или null, если максимум). */
export function nextTierOf(points: number): TierConfig | null {
  return TIERS.find((t) => t.threshold > points) ?? null
}

/** Прогресс до следующего уровня, 0..100. */
export function tierProgress(points: number): number {
  const current = tierOf(points)
  const next = nextTierOf(points)
  if (!next) return 100
  const span = next.threshold - current.threshold
  if (span <= 0) return 100
  return Math.min(100, Math.round(((points - current.threshold) / span) * 100))
}

/** Баллы за заказ с учётом кешбэка уровня. */
export function pointsForOrder(total: number, points: number): number {
  const base = Math.floor(total / POINTS_PER_SUM)
  const bonus = Math.floor((base * tierOf(points).cashback) / 100)
  return base + bonus
}
