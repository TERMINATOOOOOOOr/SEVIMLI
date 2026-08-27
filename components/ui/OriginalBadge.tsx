import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Бейдж гарантии подлинности — ключевой сигнал доверия для K-beauty. */
export default function OriginalBadge({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md'
}) {
  const sm = size === 'sm'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-secondary-light font-semibold text-secondary',
        sm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        className,
      )}
    >
      <ShieldCheck size={sm ? 11 : 14} />
      100% оригинал
    </span>
  )
}
