'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CommunityPost, PostKind, ProductQuestion } from '@/lib/types'
import { demoPosts, demoQuestions } from '@/lib/demo'

/**
 * Встроенная соц-медиа (демо-режим: хранится в localStorage).
 * При подключении Supabase переедет в community_posts / post_comments /
 * product_questions / product_answers (см. migrations/002_social_loyalty.sql).
 */

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

interface CommunityState {
  posts: CommunityPost[]
  questions: ProductQuestion[]
  /** id постов, которые лайкнул текущий пользователь. */
  likedIds: string[]
  authorName: string

  setAuthorName: (name: string) => void
  addPost: (input: {
    kind: PostKind
    text: string
    tags: string[]
    product_id: string | null
    images?: string[]
  }) => void
  toggleLike: (postId: string) => void
  addComment: (postId: string, text: string) => void
  askQuestion: (productId: string, text: string) => void
  addAnswer: (questionId: string, text: string) => void
}

export const useCommunity = create<CommunityState>()(
  persist(
    (set) => ({
      posts: demoPosts,
      questions: demoQuestions,
      likedIds: [],
      authorName: 'Вы',

      setAuthorName: (name) => set({ authorName: name.trim() || 'Вы' }),

      addPost: ({ kind, text, tags, product_id, images }) =>
        set((state) => ({
          posts: [
            {
              id: uid('cp'),
              author_name: state.authorName,
              author_city: 'Ташкент',
              author_avatar: null,
              kind,
              text,
              images: images ?? [],
              tags,
              product_id,
              likes: 0,
              created_at: new Date().toISOString(),
              comments: [],
            },
            ...state.posts,
          ],
        })),

      toggleLike: (postId) =>
        set((state) => {
          const liked = state.likedIds.includes(postId)
          return {
            likedIds: liked
              ? state.likedIds.filter((id) => id !== postId)
              : [...state.likedIds, postId],
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, likes: Math.max(0, p.likes + (liked ? -1 : 1)) } : p,
            ),
          }
        }),

      addComment: (postId, text) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    {
                      id: uid('cc'),
                      post_id: postId,
                      author_name: state.authorName,
                      text,
                      created_at: new Date().toISOString(),
                    },
                  ],
                }
              : p,
          ),
        })),

      askQuestion: (productId, text) =>
        set((state) => ({
          questions: [
            {
              id: uid('q'),
              product_id: productId,
              author_name: state.authorName,
              text,
              created_at: new Date().toISOString(),
              answers: [],
            },
            ...state.questions,
          ],
        })),

      addAnswer: (questionId, text) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answers: [
                    ...q.answers,
                    {
                      id: uid('qa'),
                      question_id: questionId,
                      author_name: state.authorName,
                      is_seller: false,
                      text,
                      created_at: new Date().toISOString(),
                    },
                  ],
                }
              : q,
          ),
        })),
    }),
    {
      name: 'sevimli-community',
      // Бампни version, если меняешь демо-посты — тогда localStorage сбросится.
      version: 3,
      migrate: () => ({
        posts: demoPosts,
        questions: demoQuestions,
        likedIds: [] as string[],
        authorName: 'Вы',
      }),
    },
  ),
)

/**
 * Хелперы-производные. Принимают массивы (а не state), потому что селектор,
 * возвращающий новый массив на каждый вызов, ломает useSyncExternalStore
 * («getSnapshot should be cached»). В компонентах оборачивай в useMemo.
 */

/** Посты, привязанные к товару (обсуждения из сообщества на карточке). */
export function postsByProduct(posts: CommunityPost[], productId: string): CommunityPost[] {
  return posts.filter((p) => p.product_id === productId)
}

/** Вопросы о конкретном товаре. */
export function questionsByProduct(
  questions: ProductQuestion[],
  productId: string,
): ProductQuestion[] {
  return questions.filter((q) => q.product_id === productId)
}

/** Все теги с частотой — для облака тем в ленте. */
export function tagsOf(posts: CommunityPost[]): { tag: string; count: number }[] {
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}
