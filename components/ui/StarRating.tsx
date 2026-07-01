import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  count?: number
  size?: number
  className?: string
}

/** Показывает рейтинг звёздами (заполненные + пустые) и, опционально, число отзывов. */
export default function StarRating({ value, count, size = 16, className }: StarRatingProps) {
  const rounded = Math.round(value)
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < rounded ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}
          />
        ))}
      </div>
      <span className="text-sm text-neutral-600">
        {value.toFixed(1)}
        {count != null && <span className="text-neutral-400"> ({count})</span>}
      </span>
    </div>
  )
}
