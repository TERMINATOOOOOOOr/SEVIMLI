import type { Circle, CircleItem, CircleMember, PublicProfile } from '@/lib/types'

/** Круг с участницами (профили без телефона) и позициями с товарами. Подсказки связей — как в сообществе. */
export const CIRCLE_WITH_ALL =
  '*, members:circle_members(*, profile:public_profiles!circle_members_user_id_fkey(*)), ' +
  'items:circle_items(*, product:products(*, shop:shops(*)))'

const byJoined = (a: CircleMember, b: CircleMember) => (a.joined_at < b.joined_at ? -1 : 1)
const byCreated = (a: CircleItem, b: CircleItem) => (a.created_at < b.created_at ? -1 : 1)

export function normalizeCircle(row: unknown): Circle {
  const r = row as Circle & { members?: (CircleMember & { profile?: PublicProfile | null })[]; items?: CircleItem[] }
  return {
    ...r,
    members: [...(r.members ?? [])].map((m) => ({ ...m, profile: m.profile ?? null })).sort(byJoined),
    items: [...(r.items ?? [])].map((i) => ({ ...i, product: i.product ?? null })).sort(byCreated),
  }
}
