import { cn } from '@/lib/utils'

/**
 * Нежный фон-декор страницы: два медленно дышащих пастельных пятна
 * и три деликатные искринки. Ставится первым ребёнком контейнера
 * с классами `relative isolate` — уходит за контент через -z-10.
 * Анимации переиспользуют hero-* keyframes (гаснут при reduced-motion).
 */

const VARIANTS = {
  rose: ['bg-primary/10', 'bg-[#e88bb0]/15'],
  mint: ['bg-secondary/10', 'bg-primary/10'],
  gold: ['bg-[#d9b380]/20', 'bg-primary/10'],
} as const

const SPARKS = [
  { left: '12%', top: '16%', delay: '0s' },
  { left: '84%', top: '28%', delay: '1.8s' },
  { left: '55%', top: '7%', delay: '3.2s' },
]

export default function SoftGlow({ variant = 'rose' }: { variant?: keyof typeof VARIANTS }) {
  const [a, b] = VARIANTS[variant]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className={cn('hero-aurora absolute -top-24 right-[-8%] h-72 w-72 rounded-full blur-3xl', a)}
        style={{ animation: 'hero-aurora 16s ease-in-out infinite' }}
      />
      <div
        className={cn('hero-aurora absolute left-[-10%] top-[38%] h-64 w-64 rounded-full blur-3xl', b)}
        style={{ animation: 'hero-aurora 21s ease-in-out infinite reverse' }}
      />
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="hero-twinkle absolute h-1 w-1 rounded-full bg-[#e88bb0]"
          style={{
            left: s.left,
            top: s.top,
            boxShadow: '0 0 8px 2px rgba(196,80,122,.4), 0 0 3px 1px rgba(255,255,255,.8)',
            animation: `hero-twinkle ${4 + i}s ease-in-out ${s.delay} infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}
