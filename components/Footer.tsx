import Link from 'next/link'
import { AtSign, Send, Phone } from 'lucide-react'

const columns = [
  {
    title: 'Покупателям',
    links: [
      { href: '/catalog/clothes', label: 'Каталог' },
      { href: '/search', label: 'Поиск' },
      { href: '/cart', label: 'Корзина' },
      { href: '/profile', label: 'Мои заказы' },
    ],
  },
  {
    title: 'Продавцам',
    links: [
      { href: '/auth', label: 'Стать продавцом' },
      { href: '/seller/dashboard', label: 'Кабинет' },
      { href: '/seller/products', label: 'Мои товары' },
    ],
  },
  {
    title: 'Компания',
    links: [
      { href: '/', label: 'О нас' },
      { href: '/', label: 'Контакты' },
      { href: '/', label: 'Помощь' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-20 bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <span className="font-display text-2xl font-extrabold text-white">SEVIMLI</span>
          <p className="mt-3 max-w-xs text-sm text-neutral-400">
            Маркетплейс для женщин: одежда, красота, дети, дом и услуги — в одном месте.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Instagram" className="rounded-full bg-neutral-800 p-2 hover:bg-primary">
              <AtSign size={18} />
            </a>
            <a href="#" aria-label="Telegram" className="rounded-full bg-neutral-800 p-2 hover:bg-primary">
              <Send size={18} />
            </a>
            <a href="#" aria-label="Телефон" className="rounded-full bg-neutral-800 p-2 hover:bg-primary">
              <Phone size={18} />
            </a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 font-semibold text-white">{col.title}</h4>
            <ul className="space-y-2 text-sm">
              {col.links.map((l, i) => (
                <li key={i}>
                  <Link href={l.href} className="transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-neutral-500 sm:px-6">
          © {2026} SEVIMLI. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
