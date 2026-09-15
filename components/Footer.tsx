'use client'

import Link from 'next/link'
import { AtSign, Send } from 'lucide-react'
import { useLang } from '@/components/LangProvider'

export default function Footer() {
  const { t } = useLang()

  const columns = [
    {
      title: t.footer.buyers,
      links: [
        { href: '/korean', label: t.footer.korean },
        { href: '/community', label: t.footer.community },
        { href: '/davra', label: t.davra.title },
        { href: '/assistant', label: t.assistant.fabLabel },
        { href: '/verify', label: t.verify.title },
        { href: '/loyalty', label: t.footer.loyalty },
        { href: '/delivery', label: t.footer.delivery },
      ],
    },
    {
      title: t.footer.sellers,
      links: [
        { href: '/auth', label: t.footer.becomeSeller },
        { href: '/seller/dashboard', label: t.footer.sellerCabinet },
        { href: '/seller/products', label: t.footer.myProducts },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { href: '/about', label: t.footer.aboutUs },
        { href: '/contacts', label: t.footer.contacts },
        { href: '/help', label: t.footer.help },
        { href: '/terms', label: t.footer.terms },
        { href: '/privacy', label: t.footer.privacy },
      ],
    },
  ]

  return (
    <footer className="mt-20 bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <span className="font-display text-2xl font-extrabold text-white">SEVIMLI</span>
          <p className="mt-3 max-w-xs text-sm text-neutral-400">{t.footer.about}</p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://t.me/sevimli_uz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="rounded-full bg-neutral-800 p-2 hover:bg-primary"
            >
              <Send size={18} />
            </a>
            <a
              href="mailto:hello@sevimli.uz"
              aria-label="E-mail"
              className="rounded-full bg-neutral-800 p-2 hover:bg-primary"
            >
              <AtSign size={18} />
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
          © {2026} SEVIMLI. {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
