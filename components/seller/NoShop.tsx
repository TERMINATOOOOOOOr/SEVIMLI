import Link from 'next/link'
import { Store } from 'lucide-react'

export default function NoShop() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
        <Store size={26} />
      </div>
      <p className="text-lg font-medium text-neutral-800">У вас ещё нет магазина</p>
      <p className="text-sm text-neutral-400">Создайте магазин, чтобы добавлять товары и принимать заказы.</p>
      <Link href="/seller/shop" className="btn-primary mt-2">
        Создать магазин
      </Link>
    </div>
  )
}
