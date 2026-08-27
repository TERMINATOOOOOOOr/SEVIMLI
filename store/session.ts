'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/lib/types'

/**
 * Демо-сессия: работает, пока Supabase на заглушках (.env.local).
 * Как только подключите реальный Supabase (DEPLOY.md), вход пойдёт через
 * supabase.auth, а этот стор перестанет использоваться.
 */

export const DEMO_EMAIL = 'demo@sevimli.uz'
export const DEMO_PASSWORD = 'demo123'

export interface DemoUser {
  id: string
  email: string
  name: string
  phone: string
  city: string
  role: UserRole
}

/** Срок жизни демо-сессии: 7 дней, после — тихий разлогин при загрузке. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface SessionState {
  user: DemoUser | null
  /** Unix-мс, после которых сессия считается истёкшей. */
  expiresAt: number | null
  login: (input: { email: string; name?: string; phone?: string }) => void
  logout: () => void
  becomeSeller: () => void
  updateProfile: (patch: Partial<Pick<DemoUser, 'name' | 'phone' | 'city'>>) => void
}

/** Имя по умолчанию из email: dilnoza@mail.uz → Dilnoza */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'Гостья'
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      expiresAt: null,

      login: ({ email, name, phone }) =>
        set({
          user: {
            id: 'demo-user',
            email,
            name: name?.trim() || nameFromEmail(email),
            phone: phone?.trim() || '+998 90 123 45 67',
            city: 'Ташкент',
            role: 'buyer',
          },
          expiresAt: Date.now() + SESSION_TTL_MS,
        }),

      logout: () => set({ user: null, expiresAt: null }),

      becomeSeller: () =>
        set((s) => (s.user ? { user: { ...s.user, role: 'seller' } } : s)),

      updateProfile: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
    }),
    {
      name: 'sevimli-session',
      version: 2,
      migrate: () => ({ user: null, expiresAt: null }),
      // Истёкшую сессию гасим при восстановлении из localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.expiresAt && Date.now() > state.expiresAt) {
          useSession.setState({ user: null, expiresAt: null })
        }
      },
    },
  ),
)
