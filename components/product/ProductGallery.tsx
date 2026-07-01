'use client'

import { useState } from 'react'
import Thumb from '@/components/ui/Thumb'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  emoji: string
  name: string
}

export default function ProductGallery({ images, emoji, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const hasImages = images.length > 0

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-2xl border border-neutral-200">
        <Thumb src={hasImages ? images[active] : null} emoji={emoji} alt={name} />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors',
                i === active ? 'border-primary' : 'border-neutral-200',
              )}
            >
              <Thumb src={src} emoji={emoji} alt={`${name} ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
