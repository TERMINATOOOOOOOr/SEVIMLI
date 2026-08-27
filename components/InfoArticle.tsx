import type { ReactNode } from 'react'

export interface InfoSection {
  h?: string
  /** Абзацы; строка, начинающаяся с «- », рендерится пунктом списка. */
  p: string[]
}

/** Единый шаблон инфо-/юридических страниц. */
export default function InfoArticle({
  title,
  subtitle,
  sections,
  footer,
}: {
  title: string
  subtitle?: string
  sections: InfoSection[]
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-neutral-900 sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 text-neutral-500">{subtitle}</p>}

      <div className="mt-8 space-y-8">
        {sections.map((s, i) => {
          const items = s.p.filter((line) => line.startsWith('- '))
          const paras = s.p.filter((line) => !line.startsWith('- '))
          return (
            <section key={i}>
              {s.h && <h2 className="mb-3 text-xl font-semibold text-neutral-900">{s.h}</h2>}
              {paras.map((line, j) => (
                <p key={j} className="mb-3 leading-relaxed text-neutral-700">
                  {line}
                </p>
              ))}
              {items.length > 0 && (
                <ul className="list-disc space-y-1.5 pl-5 text-neutral-700">
                  {items.map((line, j) => (
                    <li key={j} className="leading-relaxed">
                      {line.slice(2)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {footer && <div className="mt-10">{footer}</div>}
    </div>
  )
}
