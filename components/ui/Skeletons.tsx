/** Простые скелетоны-заглушки для Suspense fallback. */

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200">
      <div className="aspect-square animate-pulse bg-neutral-100" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
        <div className="h-9 w-full animate-pulse rounded-full bg-neutral-100" />
      </div>
    </div>
  )
}

export function ProductsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-neutral-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function CategoriesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mx-auto mb-8 h-8 w-40 animate-pulse rounded bg-neutral-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
