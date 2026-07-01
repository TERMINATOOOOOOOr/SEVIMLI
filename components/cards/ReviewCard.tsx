import type { Review } from '@/lib/types'
import { formatDate } from '@/lib/format'
import StarRating from '@/components/ui/StarRating'

export default function ReviewCard({ review }: { review: Review }) {
  const name = review.author?.name || 'Покупатель'
  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-semibold text-primary">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-neutral-900">{name}</p>
            <p className="text-xs text-neutral-400">{formatDate(review.created_at)}</p>
          </div>
        </div>
        <StarRating value={review.rating} size={14} />
      </div>
      {review.text && <p className="mt-3 text-sm text-neutral-700">{review.text}</p>}
    </div>
  )
}
