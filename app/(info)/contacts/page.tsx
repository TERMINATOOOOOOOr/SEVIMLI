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
          'Первый ответ в Telegram — в течение часа в рабочее время; претензии по заказу разбираем до 3 рабочих дней.',
        ],
      },
      {
        h: 'Продавцам и партнёрам',
        p: [
          '- E-mail: partners@sevimli.uz',
          'Хотите продавать на SEVIMLI? Нажмите «Стать продавцом» на странице входа — проверка магазина занимает до 2 рабочих дней. Размещение бесплатно.',
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
          "Telegramda birinchi javob — ish vaqtida bir soat ichida; buyurtma bo'yicha da'volarni 3 ish kunigacha ko'rib chiqamiz.",
        ],
      },
      {
        h: 'Sotuvchilar va hamkorlarga',
        p: [
          '- E-mail: partners@sevimli.uz',
          "SEVIMLIda sotmoqchimisiz? Kirish sahifasida «Sotuvchi bo'lish» tugmasini bosing — do'kon tekshiruvi 2 ish kunigacha davom etadi. Joylashtirish bepul.",
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
