import { Suspense } from 'react'
import type { Metadata } from 'next'
import ForgotForm from '@/components/auth/ForgotForm'

export const metadata: Metadata = { title: 'Восстановление пароля' }

export default function ForgotPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  )
}
