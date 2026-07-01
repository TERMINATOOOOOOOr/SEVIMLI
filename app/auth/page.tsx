import { Suspense } from 'react'
import type { Metadata } from 'next'
import AuthForm from '@/components/auth/AuthForm'

export const metadata: Metadata = { title: 'Вход и регистрация' }

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
