'use client'

import type { Review } from '@/lib/types'
import { formatDateLang } from '@/lib/format'
import { useLang } from '@/components/LangProvider'
import { reviewText, personName } from '@/lib/community-i18n'
import StarRating from '@/components/ui/StarRating'

export default function ReviewCard({ review }: { review: Review }) {
  const { lang, t } = useLang()
  const name = review.author?.name ? personName(review.author.name, lang) : t.product.buyer
  const text = reviewText(review, lang)
  const avatar = review.author?.avatar_url
  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-semibold text-primary">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-neutral-900">{name}</p>
            <p className="text-xs text-neutral-400">{formatDateLang(review.created_at, lang)}</p>
          </div>
        </div>
        <StarRating value={review.rating} size={14} />
      </div>
      {text && <p className="mt-3 text-sm text-neutral-700">{text}</p>}
    </div>
  )
}
