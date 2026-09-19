import Link from 'next/link'
import { MessagesSquare, ArrowRight, Heart, MessageCircle } from 'lucide-react'
import { getCommunityPosts } from '@/lib/data'
import { getT } from '@/lib/lang-server'
import { formatRelativeLang } from '@/lib/format'
import { postText, personName } from '@/lib/community-i18n'

export default async function CommunityCTA() {
  const posts = await getCommunityPosts(3)
  const { lang, t } = await getT()

  const kindLabel: Record<string, string> = {
    review: t.community.kindReview,
    question: t.community.kindQuestion,
    tip: t.community.kindTip,
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary-light via-white to-secondary-light p-6 sm:p-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Текст */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
              <MessagesSquare size={16} /> {t.home.ctaBadge}
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
              {t.home.ctaTitle}
            </h2>
            <p className="mt-4 text-neutral-600">{t.home.ctaSubtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/community" className="btn-primary">
                {t.home.ctaOpen} <ArrowRight size={16} />
              </Link>
              <Link href="/korean" className="btn-outline">
                {t.home.ctaKorean}
              </Link>
            </div>
          </div>

          {/* Тизер постов */}
          <div className="space-y-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/community/${p.id}`}
                className="block rounded-2xl border border-white bg-white/80 p-4 backdrop-blur transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  {p.author_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.author_avatar}
                      alt={p.author?.name || p.author_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                      {personName(p.author?.name || p.author_name, lang).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-neutral-800">{personName(p.author?.name || p.author_name, lang)}</span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    {kindLabel[p.kind] ?? p.kind}
                  </span>
                  <span className="ml-auto text-xs text-neutral-400">
                    {formatRelativeLang(p.created_at, lang)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{postText(p, lang)}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Heart size={13} /> {p.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={13} /> {p.comments.length}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
