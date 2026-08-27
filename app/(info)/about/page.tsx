import type { Metadata } from 'next'
import { getT } from '@/lib/lang-server'
import InfoArticle, { type InfoSection } from '@/components/InfoArticle'

export const metadata: Metadata = { title: 'О нас · Biz haqimizda' }

const content: Record<string, { title: string; subtitle: string; sections: InfoSection[] }> = {
  ru: {
    title: 'О нас',
    subtitle: 'SEVIMLI — маркетплейс и сообщество для женщин Узбекистана.',
    sections: [
      {
        p: [
          'SEVIMLI — это площадка, где магазины и салоны открывают свои витрины, как на Uzum, а покупательницы выбирают их вместе с живым женским сообществом. Мы сами ничего не продаём и не доставляем: каждый товар вы покупаете у конкретного магазина, на каждую услугу записываетесь в конкретный салон. Наша работа — сделать так, чтобы выбирать было удобно, а доверять — безопасно.',
          'Мы выросли из простого наблюдения: миллионы женщин в Узбекистане уже советуются о покупках в группах и чатах — но купить проверенное там нельзя. У сообществ есть доверие, но нет полки; у больших маркетплейсов есть полка, но нет доверия. SEVIMLI сшивает и то, и другое.',
        ],
      },
      {
        h: 'Как это работает',
        p: [
          '- Магазины подключаются к платформе, проходят проверку и ведут свои витрины сами: товары, цены, доставка.',
          '- Салоны красоты принимают онлайн-записи через платформу.',
          '- Сообщество — сердце SEVIMLI: честные отзывы, вопросы и советы от реальных девушек. Понравился товар из отзыва — он покупается в один клик прямо из ленты.',
          '- Карта лояльности действует у всех магазинов площадки: кешбэк до 5% с любой покупки.',
        ],
      },
      {
        h: 'Что делаем мы как площадка',
        p: [
          '- Проверяем продавцов при подключении: документы, происхождение товара, для K-beauty — подтверждение официального импорта.',
          '- Бережём честность отзывов: рейтинг нельзя купить, накрутки и заказные отзывы удаляем.',
          '- Помогаем покупательнице и магазину договориться, если что-то пошло не так.',
        ],
      },
      {
        h: 'Где мы работаем',
        p: [
          'Стартуем в Ташкенте. Условия доставки каждый магазин указывает сам — у большинства по Ташкенту она бесплатная. Самарканд, Бухара и другие города — на очереди.',
        ],
      },
    ],
  },
  uz: {
    title: 'Biz haqimizda',
    subtitle: "SEVIMLI — O'zbekiston ayollari uchun marketpleys va hamjamiyat.",
    sections: [
      {
        p: [
          "SEVIMLI — bu do'konlar va salonlar xuddi Uzumdagidek o'z vitrinalarini ochadigan, xaridorlar esa ularni jonli ayollar hamjamiyati bilan birga tanlaydigan maydon. Biz o'zimiz hech narsa sotmaymiz va yetkazmaymiz: har bir mahsulotni aniq bir do'kondan sotib olasiz, har bir xizmatga aniq bir salonga yozilasiz. Bizning ishimiz — tanlashni qulay, ishonishni esa xavfsiz qilish.",
          "Biz oddiy kuzatuvdan boshladik: O'zbekistonda millionlab ayollar xaridlar haqida guruh va chatlarda maslahatlashadi — lekin u yerda ishonchli mahsulotni sotib olib bo'lmaydi. Hamjamiyatlarda ishonch bor, lekin peshtaxta yo'q; yirik marketpleyslerde peshtaxta bor, lekin ishonch yo'q. SEVIMLI ikkalasini birlashtiradi.",
        ],
      },
      {
        h: 'Bu qanday ishlaydi',
        p: [
          "- Do'konlar platformaga ulanadi, tekshiruvdan o'tadi va vitrinalarini o'zlari yuritadi: mahsulotlar, narxlar, yetkazib berish.",
          "- Go'zallik salonlari platforma orqali onlayn yozilishlarni qabul qiladi.",
          "- Hamjamiyat — SEVIMLIning yuragi: haqiqiy qizlarning samimiy sharhlari, savollari va maslahatlari. Sharhdagi mahsulot yoqdimi — lentadan bir bosishda sotib olinadi.",
          "- Sodiqlik kartasi platformadagi barcha do'konlarda amal qiladi: har bir xariddan 5% gacha keshbek.",
        ],
      },
      {
        h: 'Platforma sifatida biz nima qilamiz',
        p: [
          "- Sotuvchilarni ulanishda tekshiramiz: hujjatlar, mahsulot kelib chiqishi, K-beauty uchun — rasmiy import tasdig'i.",
          "- Sharhlar halolligini asraymiz: reytingni sotib olib bo'lmaydi, aldov va buyurtma sharhlarni o'chiramiz.",
          "- Biror narsa noto'g'ri ketsa, xaridor va do'konga kelishishga yordam beramiz.",
        ],
      },
      {
        h: 'Qayerda ishlaymiz',
        p: [
          "Toshkentdan boshlaymiz. Yetkazib berish shartlarini har bir do'kon o'zi belgilaydi — ko'pchiligida Toshkent bo'ylab bepul. Samarqand, Buxoro va boshqa shaharlar — navbatda.",
        ],
      },
    ],
  },
}

export default async function AboutPage() {
  const { lang } = await getT()
  const c = content[lang]
  return <InfoArticle title={c.title} subtitle={c.subtitle} sections={c.sections} />
}
