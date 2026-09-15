import { Suspense } from 'react'
import type { Metadata } from 'next'
import ResetForm from '@/components/auth/ResetForm'

export const metadata: Metadata = { title: 'Новый пароль' }

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
