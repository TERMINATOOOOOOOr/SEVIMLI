import type { Metadata } from 'next'
import { getT } from '@/lib/lang-server'
import InfoArticle, { type InfoSection } from '@/components/InfoArticle'

export const metadata: Metadata = { title: 'Контакты · Aloqa' }

const content: Record<string, { title: string; subtitle: string; sections: InfoSection[] }> = {
  ru: {
    title: 'Контакты',
    subtitle: 'Мы на связи каждый день с 9:00 до 21:00 (Ташкент).',
    sections: [
      {
        h: 'Служба заботы о покупателях',
        p: [
          '- Telegram: @sevimli_uz',
          '- E-mail: hello@sevimli.uz',
          'Отвечаем в Telegram и по почте в рабочее время; претензию по заказу передаём магазину и помогаем договориться.',
        ],
      },
      {
        h: 'Продавцам и партнёрам',
        p: [
          '- E-mail: partners@sevimli.uz',
          'Хотите продавать на SEVIMLI? Нажмите «Стать продавцом» на странице входа и заполните карточку магазина. Значок «проверенный магазин» ставим после проверки документов. Сейчас размещение бесплатное.',
        ],
      },
      {
        h: 'Адрес',
        p: ['г. Ташкент, Узбекистан.', 'Пункт выдачи и шоурум откроются позже — следите за новостями в сообществе.'],
      },
    ],
  },
  uz: {
    title: 'Aloqa',
    subtitle: "Har kuni 9:00 dan 21:00 gacha aloqadamiz (Toshkent).",
    sections: [
      {
        h: "Xaridorlar uchun g'amxo'rlik xizmati",
        p: [
          '- Telegram: @sevimli_uz',
          '- E-mail: hello@sevimli.uz',
          "Telegram va pochta orqali ish vaqtida javob beramiz; buyurtma bo'yicha da'voni do'konga yetkazamiz va kelishishga yordam beramiz.",
        ],
      },
      {
        h: 'Sotuvchilar va hamkorlarga',
        p: [
          '- E-mail: partners@sevimli.uz',
          "SEVIMLIda sotmoqchimisiz? Kirish sahifasida «Sotuvchi bo'lish» tugmasini bosing va do'kon kartochkasini to'ldiring. «Tekshirilgan do'kon» belgisini hujjatlar tekshirilgach qo'yamiz. Hozircha joylashtirish bepul.",
        ],
      },
      {
        h: 'Manzil',
        p: ["Toshkent sh., O'zbekiston.", "Topshirish punkti va shourum keyinroq ochiladi — hamjamiyatdagi yangiliklarni kuzatib boring."],
      },
    ],
  },
}

export default async function ContactsPage() {
  const { lang } = await getT()
  const c = content[lang]
  return <InfoArticle title={c.title} subtitle={c.subtitle} sections={c.sections} />
}
