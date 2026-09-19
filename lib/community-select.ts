import type { CommunityPost, ProductQuestion, PublicProfile } from '@/lib/types'

/**
 * Общие select-строки и нормализация строк PostgREST для сообщества.
 * Чистый модуль без supabase-импортов — используется и на сервере (lib/data.ts),
 * и на клиенте (lib/community-live.ts).
 *
 * Подсказки связей (!<fk>) обязательны: post_likes и post_reports — junction-таблицы
 * между community_posts и profiles, без подсказки PostgREST отвечает PGRST201
 * («more than one relationship»).
 */

export const POST_WITH_ALL =
  '*, author:public_profiles!community_posts_author_id_fkey(*), ' +
  'comments:post_comments(*, author:public_profiles!post_comments_author_id_fkey(*)), ' +
  'product:products(*, shop:shops(*))'
export const COMMENT_WITH_AUTHOR = '*, author:public_profiles!post_comments_author_id_fkey(*)'
export const QUESTION_WITH_ANSWERS =
  '*, author:public_profiles!product_questions_author_id_fkey(*), ' +
  'answers:product_answers(*, author:public_profiles!product_answers_author_id_fkey(*))'
export const ANSWER_WITH_AUTHOR = '*, author:public_profiles!product_answers_author_id_fkey(*)'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** 'cp1' в URL → «не найдено» без запроса (иначе PostgREST вернёт 22P02). */
export const isUuid = (v: string) => UUID_RE.test(v)

const byCreatedAsc = <T extends { created_at: string }>(a: T, b: T) =>
  a.created_at < b.created_at ? -1 : 1

/** Строка PostgREST → CommunityPost, который ждут компоненты (comments/tags/images всегда массивы). */
export function normalizePost(row: unknown): CommunityPost {
  const r = row as CommunityPost & { author?: PublicProfile | null }
  return {
    ...r,
    author: r.author ?? null, // null после удаления аккаунта (author_id set null) и у демо-сида
    author_avatar: r.author?.avatar_url ?? r.author_avatar ?? null,
    images: r.images ?? [],
    tags: r.tags ?? [],
    comments: [...(r.comments ?? [])].sort(byCreatedAsc),
    product: r.product ?? null, // null, если товар неактивен (products_read) или удалён
  }
}

export function normalizeQuestion(row: unknown): ProductQuestion {
  const q = row as ProductQuestion
  return { ...q, answers: [...(q.answers ?? [])].sort(byCreatedAsc) }
}
