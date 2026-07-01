import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  /** Текущие query-параметры (без page) для сохранения фильтров в ссылках. */
  baseParams: Record<string, string>
  basePath: string
}

function buildHref(basePath: string, baseParams: Record<string, string>, page: number) {
  const params = new URLSearchParams(baseParams)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export default function Pagination({ page, totalPages, baseParams, basePath }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      {page > 1 && (
        <Link
          href={buildHref(basePath, baseParams, page - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 hover:border-primary hover:text-primary"
        >
          <ChevronLeft size={18} />
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(basePath, baseParams, p)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium',
            p === page
              ? 'border-primary bg-primary text-white'
              : 'border-neutral-200 hover:border-primary hover:text-primary',
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          href={buildHref(basePath, baseParams, page + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 hover:border-primary hover:text-primary"
        >
          <ChevronRight size={18} />
        </Link>
      )}
    </nav>
  )
}
