'use client'

import { useCallback, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { CommunityPost, ProductQuestion, Viewer } from '@/lib/types'
import * as live from '@/lib/community-live'
import type { CommunityErrorCode } from '@/lib/community-live'

/**
 * Локальное состояние сообщества в боевом режиме: стартует с серверных пропсов
 * (первый клиентский кадр = SSR), мутации идут через lib/community-live.ts.
 * Хуки вызываются компонентами безусловно (rules-of-hooks); в демо-режиме
 * их действия никто не вызывает — ни одного запроса к Supabase.
 */

/** Редирект на вход с возвратом на текущую страницу (учитывает query-строку). */
export function useForceLogin(): () => void {
  const router = useRouter()
  const pathname = usePathname()
  return useCallback(() => {
    const back = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname
    router.push(`/auth?redirect=${encodeURIComponent(back)}`)
  }, [router, pathname])
}

/** Гость → на вход с возвратом на текущую страницу. true = можно продолжать. */
export function useAuthGate(viewer: Viewer | null): () => boolean {
  const forceLogin = useForceLogin()
  return useCallback(() => {
    if (viewer) return true
    forceLogin()
    return false
  }, [viewer, forceLogin])
}

export interface PostActions {
  viewer: Viewer | null
  isLiked: (postId: string) => boolean
  toggleLike: (postId: string) => Promise<void>
  /** true — комментарий сохранён (форму можно очищать). */
  addComment: (postId: string, text: string) => Promise<boolean>
  report: (postId: string) => Promise<'sent' | 'already' | 'own' | 'failed'>
  /** false → уже сделан редирект на /auth. */
  requireAuth: () => boolean
  /** Последняя ошибка: код + id поста, к которому относится (показывается один раз, у этого поста). */
  error: { code: CommunityErrorCode; postId: string } | null
  clearError: () => void
}

export function useLivePosts(opts: {
  initialPosts: CommunityPost[]
  initialLikedIds: string[]
  viewer: Viewer | null
}): { posts: CommunityPost[]; prepend: (p: CommunityPost) => void; actions: PostActions } {
  const { viewer } = opts
  const [posts, setPosts] = useState<CommunityPost[]>(opts.initialPosts)
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set(opts.initialLikedIds))
  const [error, setError] = useState<{ code: CommunityErrorCode; postId: string } | null>(null)
  const pending = useRef<Set<string>>(new Set())
  const requireAuth = useAuthGate(viewer)
  const forceLogin = useForceLogin()

  const prepend = useCallback((p: CommunityPost) => setPosts((prev) => [p, ...prev]), [])

  const patchPost = (id: string, patch: (p: CommunityPost) => CommunityPost) =>
    setPosts((prev) => prev.map((p) => (p.id === id ? patch(p) : p)))

  const toggleLike = async (postId: string) => {
    if (!requireAuth()) return
    if (pending.current.has(postId)) return // второй клик по тому же посту, пока идёт запрос
    pending.current.add(postId)
    setError(null)
    const wasLiked = likedIds.has(postId)
    // Оптимистично
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (wasLiked) next.delete(postId)
      else next.add(postId)
      return next
    })
    patchPost(postId, (p) => ({ ...p, likes: Math.max(0, p.likes + (wasLiked ? -1 : 1)) }))
    try {
      const res = await live.toggleLike(postId)
      setLikedIds((prev) => {
        const next = new Set(prev)
        if (res.liked) next.add(postId)
        else next.delete(postId)
        return next
      })
      patchPost(postId, (p) => ({ ...p, likes: res.likes }))
    } catch (e) {
      const err = live.mapError(e, 'like')
      // Откат
      setLikedIds((prev) => {
        const next = new Set(prev)
        if (wasLiked) next.add(postId)
        else next.delete(postId)
        return next
      })
      patchPost(postId, (p) => ({ ...p, likes: Math.max(0, p.likes + (wasLiked ? 1 : -1)) }))
      // Сессия клиента разошлась с серверной (вышли в другой вкладке и т.п.) — на вход безусловно
      if (err.code === 'auth') forceLogin()
      else setError({ code: err.code, postId })
    } finally {
      pending.current.delete(postId)
    }
  }

  const addComment = async (postId: string, text: string) => {
    if (!viewer || !requireAuth()) return false
    setError(null)
    try {
      const c = await live.addComment(postId, text, viewer.id)
      patchPost(postId, (p) => ({ ...p, comments: [...p.comments, c] }))
      return true
    } catch (e) {
      const err = live.mapError(e, 'comment')
      if (err.code === 'auth') forceLogin()
      else setError({ code: err.code, postId })
      return false
    }
  }

  const report = async (postId: string) => {
    if (!viewer || !requireAuth()) return 'failed' as const
    setError(null)
    try {
      await live.reportPost(postId, viewer.id)
      return 'sent' as const
    } catch (e) {
      const err = live.mapError(e, 'report')
      if (err.code === 'duplicate') return 'already' as const
      if (err.code === 'own_post') return 'own' as const
      if (err.code === 'auth') forceLogin()
      else setError({ code: err.code, postId })
      return 'failed' as const
    }
  }

  return {
    posts,
    prepend,
    actions: {
      viewer,
      isLiked: (id) => likedIds.has(id),
      toggleLike,
      addComment,
      report,
      requireAuth,
      error,
      clearError: () => setError(null),
    },
  }
}

export function useLiveQuestions(opts: { initialQuestions: ProductQuestion[]; viewer: Viewer | null }): {
  questions: ProductQuestion[]
  /** true — сохранено (форму можно очищать). */
  ask: (productId: string, text: string) => Promise<boolean>
  answer: (questionId: string, text: string) => Promise<boolean>
  requireAuth: () => boolean
  error: CommunityErrorCode | null
} {
  const { viewer } = opts
  const [questions, setQuestions] = useState<ProductQuestion[]>(opts.initialQuestions)
  const [error, setError] = useState<CommunityErrorCode | null>(null)
  const requireAuth = useAuthGate(viewer)
  const forceLogin = useForceLogin()

  const ask = async (productId: string, text: string) => {
    if (!viewer || !requireAuth()) return false
    setError(null)
    try {
      const q = await live.askQuestion(productId, text, viewer.id)
      setQuestions((prev) => [q, ...prev])
      return true
    } catch (e) {
      const err = live.mapError(e, 'qa')
      if (err.code === 'auth') forceLogin()
      else setError(err.code)
      return false
    }
  }

  const answer = async (questionId: string, text: string) => {
    if (!viewer || !requireAuth()) return false
    setError(null)
    try {
      const a = await live.addAnswer(questionId, text, viewer.id)
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, answers: [...q.answers, a] } : q)))
      return true
    } catch (e) {
      const err = live.mapError(e, 'qa')
      if (err.code === 'auth') forceLogin()
      else setError(err.code)
      return false
    }
  }

  return { questions, ask, answer, requireAuth, error }
}
