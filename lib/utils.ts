import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Объединяет классы Tailwind, корректно разрешая конфликты. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * true — если в .env.local прописаны реальные ключи Supabase.
 * Пока стоят placeholder-значения, приложение работает на демо-данных (lib/demo.ts).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes('placeholder') && !key.includes('placeholder'))
}
