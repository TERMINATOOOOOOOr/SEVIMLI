import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/utils'
import SellerSidebar from '@/components/seller/Sidebar'
import SellerDemoGate from '@/components/seller/SellerDemoGate'
import { getSellerContext } from '@/lib/seller'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
      <SellerSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  // Демо-режим: доступ гейтится на клиенте по локальной сессии.
  if (!isSupabaseConfigured()) {
    return (
      <SellerDemoGate>
        <Shell>{children}</Shell>
      </SellerDemoGate>
    )
  }

  const { userId, profile } = await getSellerContext()
  if (!userId) redirect('/auth?redirect=/seller/dashboard')
  if (profile?.role !== 'seller' && profile?.role !== 'admin') redirect('/profile')

  return <Shell>{children}</Shell>
}
