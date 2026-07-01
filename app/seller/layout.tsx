import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/utils'
import AuthRequired from '@/components/auth/AuthRequired'
import SellerSidebar from '@/components/seller/Sidebar'
import { getSellerContext } from '@/lib/seller'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <AuthRequired demo />

  const { userId, profile } = await getSellerContext()
  if (!userId) redirect('/auth?redirect=/seller/dashboard')
  if (profile?.role !== 'seller' && profile?.role !== 'admin') redirect('/profile')

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
      <SellerSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
