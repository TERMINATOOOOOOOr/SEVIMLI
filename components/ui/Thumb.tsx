import { cn } from '@/lib/utils'

interface ThumbProps {
  src?: string | null
  emoji?: string
  alt?: string
  className?: string
}

/**
 * Универсальная миниатюра: показывает изображение, если оно есть,
 * иначе — мягкий градиентный плейсхолдер с emoji.
 */
export default function Thumb({ src, emoji = '🛍️', alt = '', className }: ThumbProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn('h-full w-full object-cover', className)} />
  }
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light via-white to-secondary-light',
        className,
      )}
    >
      <span className="text-4xl opacity-80">{emoji}</span>
    </div>
  )
}
