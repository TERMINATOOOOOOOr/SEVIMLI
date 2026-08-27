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
          '- Телефон: +998 78 000-00-00',
          '- Telegram: @sevimli_uz',
          '- E-mail: hello@sevimli.uz',
          'Отвечаем в Telegram обычно в течение 15 минут в рабочее время.',
        ],
      },
      {
        h: 'Продавцам и партнёрам',
        p: [
          '- E-mail: partners@sevimli.uz',
          'Хотите продавать на SEVIMLI? Нажмите «Стать продавцом» на странице входа — модерация занимает 1 рабочий день.',
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
          '- Telefon: +998 78 000-00-00',
          '- Telegram: @sevimli_uz',
          '- E-mail: hello@sevimli.uz',
          "Ish vaqtida Telegramda odatda 15 daqiqa ichida javob beramiz.",
        ],
      },
      {
        h: 'Sotuvchilar va hamkorlarga',
        p: [
          '- E-mail: partners@sevimli.uz',
          "SEVIMLIda sotmoqchimisiz? Kirish sahifasida «Sotuvchi bo'lish» tugmasini bosing — moderatsiya 1 ish kuni davom etadi.",
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
