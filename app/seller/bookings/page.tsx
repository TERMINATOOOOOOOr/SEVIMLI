import type { Metadata } from 'next'
import { CalendarClock } from 'lucide-react'
import { getSellerContext } from '@/lib/seller'
import { getBookingsByShop } from '@/lib/data'
import NoShop from '@/components/seller/NoShop'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Записи' }

export default async function SellerBookingsPage() {
  const { shop } = await getSellerContext()
  if (!shop) return <NoShop />

  const bookings = await getBookingsByShop(shop.id)

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-neutral-900">Записи</h1>
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-neutral-400">
          <CalendarClock size={40} />
          <p>Записей пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4">
              <div>
                <p className="font-medium text-neutral-900">{b.service_name || 'Услуга'}</p>
                <p className="text-sm text-neutral-400">
                  {b.booking_date ? formatDate(b.booking_date) : ''} · {b.time_slot} · {b.phone}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
