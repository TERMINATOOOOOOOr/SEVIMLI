'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoyaltyEntry } from '@/lib/types'

/**
 * Программа лояльности (демо-режим: копится в localStorage).
 * При подключении реального Supabase баллы переедут в profiles.loyalty_points
 * и loyalty_entries (см. supabase/migrations/002_social_loyalty.sql).
 */

interface LoyaltyState {
  points: number
  entries: LoyaltyEntry[]
  cardNo: string | null
  /** Создаёт номер карты при первом обращении (на клиенте). */
  ensureCard: () => void
  addPoints: (points: number, reason: string) => void
  reset: () => void
}

function makeCardNo(): string {
  const n = Math.floor(1000 + Math.random() * 9000)
  const m = Math.floor(1000 + Math.random() * 9000)
  const k = Math.floor(1000 + Math.random() * 9000)
  return `5555 ${n} ${m} ${k}`
}

export const useLoyalty = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      points: 0,
      entries: [],
      cardNo: null,

      ensureCard: () => {
        if (!get().cardNo) set({ cardNo: makeCardNo() })
      },

      addPoints: (points, reason) =>
        set((state) => ({
          points: Math.max(0, state.points + points),
          entries: [
            {
              id: `le_${Date.now().toString(36)}`,
              points,
              reason,
              created_at: new Date().toISOString(),
            },
            ...state.entries,
          ].slice(0, 50),
        })),

      reset: () => set({ points: 0, entries: [], cardNo: null }),
    }),
    {
      name: 'sevimli-loyalty',
      version: 1,
    },
  ),
)
