import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAdminData, isAdminUser } from '@/lib/admin'
import AdminPanel from '@/components/admin/AdminPanel'

export const metadata: Metadata = { title: 'Админка', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/** Доступ только profiles.role = 'admin' (назначается скриптом `npm run make-admin -- <email>`). Остальным — 404. */
export default async function AdminPage() {
  if (!(await isAdminUser())) notFound()
  const data = await getAdminData()
  return <AdminPanel {...data} />
}
