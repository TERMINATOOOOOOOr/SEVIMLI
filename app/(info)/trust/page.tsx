import type { Metadata } from 'next'
import { getT } from '@/lib/lang-server'
import InfoArticle from '@/components/InfoArticle'

export const metadata: Metadata = { title: 'Как убедиться в товаре · Mahsulotni tekshirish' }

/** Что покупательница видит и проверяет сама: срок годности и метка «оригинал». */
export default async function TrustPage() {
  const { t } = await getT()
  const c = t.trust
  return (
    <InfoArticle
      title={c.title}
      subtitle={c.subtitle}
      sections={[
        { h: c.s1h, p: [c.s1p] },
        { h: c.s2h, p: [c.s2p] },
        { h: c.s3h, p: [c.s3p] },
      ]}
    />
  )
}
