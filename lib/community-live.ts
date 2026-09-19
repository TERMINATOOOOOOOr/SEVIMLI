import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/utils'
import {
  POST_WITH_ALL,
  COMMENT_WITH_AUTHOR,
  QUESTION_WITH_ANSWERS,
  ANSWER_WITH_AUTHOR,
  normalizePost,
  normalizeQuestion,
} from '@/lib/community-select'
import type { CommunityPost, PostComment, PostKind, ProductAnswer, ProductQuestion } from '@/lib/types'

/**
 * Клиентские мутации сообщества (боевой режим). createClient() создаётся ВНУТРИ
 * функций: в демо-режиме модуль импортируется, но ни одна функция не вызывается.
 */

/** Константа сборки: NEXT_PUBLIC_* вшиты в бандл → одинаково на сервере и клиенте. */
export const COMMUNITY_LIVE = isSupabaseConfigured()

export type CommunityErrorCode =
  | 'auth'
  | 'limit'
  | 'duplicate'
  | 'own_post'
  | 'not_found'
  | 'invalid'
  | 'too_big'
  | 'bad_type'
  | 'unknown'

export class CommunityError extends Error {
  code: CommunityErrorCode
  constructor(code: CommunityErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

/** PG/PostgREST/Storage-ошибка → код для i18n. ctx нужен, чтобы 42501 при жалобе значил «свой пост», а не «гость». */
export function mapError(
  e: unknown,
  ctx: 'post' | 'like' | 'comment' | 'report' | 'qa' | 'upload' = 'post',
): CommunityError {
  if (e instanceof CommunityError) return e
  const err = e as { code?: string; message?: string; statusCode?: string | number }
  const msg = err?.message ?? ''
  if (/post_limit_exceeded|write_limit_exceeded/.test(msg)) return new CommunityError('limit', msg)
  if (err?.code === '23505') return new CommunityError('duplicate', msg)
  if (err?.code === '42501' || /not authenticated|row-level security/i.test(msg))
    return new CommunityError(ctx === 'report' ? 'own_post' : 'auth', msg)
  if (err?.code === 'P0002' || err?.code === '22P02' || err?.code === 'PGRST116')
    return new CommunityError('not_found', msg)
  if (err?.code === '23514') return new CommunityError('invalid', msg)
  if (String(err?.statusCode) === '413' || /maximum allowed size|exceeded/i.test(msg))
    return new CommunityError('too_big', msg)
  if (String(err?.statusCode) === '415' || /mime type/i.test(msg)) return new CommunityError('bad_type', msg)
  return new CommunityError('unknown', msg)
}

export async function createPost(
  input: { kind: PostKind; text: string; tags: string[]; product_id: string | null; images: string[] },
  userId: string,
): Promise<CommunityPost> {
  const supabase = createClient()
  // author_id шлём явно (posts_insert_own with check); author_name/city/likes/is_ad всё равно проставит триггер
  const { data, error } = await supabase
    .from('community_posts')
    .insert({ ...input, author_id: userId })
    .select(POST_WITH_ALL)
    .single()
  if (error) throw mapError(error, 'post')
  return normalizePost(data)
}

/** Атомарный лайк через RPC (007): один вызов, без 23505 и гонок; likes уже пересчитан триггером. */
export async function toggleLike(postId: string): Promise<{ liked: boolean; likes: number }> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('toggle_post_like', { p_post: postId })
  if (error) throw mapError(error, 'like')
  return data as { liked: boolean; likes: number }
}

export async function addComment(postId: string, text: string, userId: string): Promise<PostComment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, author_id: userId, text })
    .select(COMMENT_WITH_AUTHOR)
    .single()
  if (error) throw mapError(error, 'comment')
  return data as PostComment
}

export async function reportPost(postId: string, userId: string, reason?: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('post_reports')
    .insert({ post_id: postId, user_id: userId, reason: reason ?? null })
  if (error) throw mapError(error, 'report') // 23505 → duplicate, 42501 → own_post
}

export async function askQuestion(productId: string, text: string, userId: string): Promise<ProductQuestion> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_questions')
    .insert({ product_id: productId, author_id: userId, text })
    .select(QUESTION_WITH_ANSWERS)
    .single()
  if (error) throw mapError(error, 'qa')
  return normalizeQuestion(data)
}

export async function addAnswer(questionId: string, text: string, userId: string): Promise<ProductAnswer> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_answers')
    .insert({ question_id: questionId, author_id: userId, text })
    .select(ANSWER_WITH_AUTHOR)
    .single()
  if (error) throw mapError(error, 'qa')
  return data as ProductAnswer // is_seller и имя магазина проставил stamp_answer_author (004)
}

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

/** data:-URL (canvas JPEG из композера) → Blob без fetch(): CSP connect-src не пускает data:. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(0, comma)
  const mime = meta.match(/^data:([^;]+)/)?.[1] ?? 'image/jpeg'
  const bin = atob(dataUrl.slice(comma + 1))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** Фото поста → бакет community/<uid>/<ts>-<rand>.jpg → публичный URL. Папка ОБЯЗАТЕЛЬНО user.id (community_owner_insert). */
export async function uploadPostImage(dataUrl: string, userId: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl)
  if (blob.size > MAX_IMAGE_BYTES) throw new CommunityError('too_big')
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('community')
    .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
  if (error) throw mapError(error, 'upload')
  return supabase.storage.from('community').getPublicUrl(path).data.publicUrl
}

/** Публичный URL → путь в бакете community (после «/object/public/community/»). */
export function communityPathFromUrl(url: string): string | null {
  const m = url.match(/\/object\/public\/community\/(.+)$/)
  return m ? decodeURIComponent(m[1]) : null
}

/** Убрать загруженные фото, если сам пост не сохранился (иначе в бакете остаются сироты). */
export async function removePostImages(urls: string[]): Promise<void> {
  const paths = urls.map(communityPathFromUrl).filter((p): p is string => Boolean(p))
  if (paths.length === 0) return
  try {
    await createClient().storage.from('community').remove(paths)
  } catch {
    /* не критично */
  }
}
