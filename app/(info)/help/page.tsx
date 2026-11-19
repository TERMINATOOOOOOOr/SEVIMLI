import type { Metadata } from 'next'
import { getT } from '@/lib/lang-server'
import InfoArticle, { type InfoSection } from '@/components/InfoArticle'

export const metadata: Metadata = { title: 'Помощь · Yordam' }

const content: Record<string, { title: string; subtitle: string; sections: InfoSection[] }> = {
  ru: {
    title: 'Помощь',
    subtitle: 'Ответы на вопросы, которые нам задают чаще всего.',
    sections: [
      {
        h: 'SEVIMLI — это магазин?',
        p: [
          'Нет. SEVIMLI — площадка, как Uzum: магазины и салоны открывают здесь свои витрины и продают сами. Мы не продаём и не доставляем товары — мы даём удобный сервис заказа, живое сообщество с честными отзывами и проверяем продавцов при подключении.',
        ],
      },
      {
        h: 'У кого я покупаю и кто отвечает за заказ?',
        p: [
          'У конкретного магазина — его название видно на карточке товара и в заказе. Магазин отвечает за качество, доставку и возврат. Если возник спор, платформа выступает медиатором: передаёт претензию магазину в течение 24 часов и помогает договориться.',
        ],
      },
      {
        h: 'Как убедиться, что косметика — оригинал?',
        p: [
          'Метку «100% оригинал» получают товары магазинов, которые подтвердили SEVIMLI происхождение товара документами; включает её администратор площадки. Проверяйте и сами: в карточке товара указан срок годности — при получении сверьте его и код партии на коробке и флаконе.',
        ],
      },
      {
        h: 'Почему цены ниже, чем в офлайн-магазинах?',
        p: [
          'Продавцы на площадке конкурируют друг с другом и не содержат дорогие офлайн-точки — поэтому цены обычно ниже. Слишком низкая цена без документов — повод насторожиться: такие магазины мы не подключаем.',
        ],
      },
      {
        h: 'Как сделать заказ?',
        p: [
          'Добавьте товар в корзину — из каталога, поиска или прямо из поста в сообществе — укажите адрес и способ оплаты. Статус заказа виден в профиле, о доставке позаботится магазин.',
        ],
      },
      {
        h: 'Как записаться в салон?',
        p: [
          'Откройте страницу салона, выберите услугу, дату и время. Салон подтвердит запись звонком или сообщением; запись видна в профиле. Отмена и перенос — по правилам салона.',
        ],
      },
      {
        h: 'Как работает карта лояльности?',
        p: [
          'Баллы начисляются за каждый завершённый заказ у любого магазина площадки: от 1% (Bronze) до 5% (Platinum). 1 балл = 1 сум; баллами можно оплатить до 20% следующего заказа, баллы действуют 6 месяцев.',
        ],
      },
      {
        h: 'Как стать продавцом?',
        p: [
          'Нажмите «Стать продавцом» в профиле, заполните карточку магазина и загрузите товары. Проверка — до 2 рабочих дней: смотрим документы и происхождение товара. Размещение бесплатно; платные тарифы с продвижением и аналитикой — по желанию продавца, без процента с продаж.',
        ],
      },
      {
        h: 'Остались вопросы?',
        p: ['Напишите нам в Telegram @sevimli_uz — отвечаем быстро и по-человечески.'],
      },
    ],
  },
  uz: {
    title: 'Yordam',
    subtitle: "Eng ko'p beriladigan savollarga javoblar.",
    sections: [
      {
        h: "SEVIMLI — do'konmi?",
        p: [
          "Yo'q. SEVIMLI — Uzum kabi maydon: do'konlar va salonlar bu yerda o'z vitrinalarini ochib, o'zlari sotadi. Biz mahsulot sotmaymiz va yetkazmaymiz — qulay buyurtma xizmati, samimiy sharhli jonli hamjamiyat beramiz va ulanishda sotuvchilarni tekshiramiz.",
        ],
      },
      {
        h: 'Men kimdan xarid qilaman va buyurtmaga kim javob beradi?',
        p: [
          "Aniq bir do'kondan — nomi mahsulot kartochkasida va buyurtmada ko'rinadi. Sifat, yetkazib berish va qaytarish uchun do'kon javob beradi. Nizo chiqsa, platforma sotuvchi bilan bog'lanishga yordam beradi va hal bo'lishini kuzatadi.",
        ],
      },
      {
        h: 'Kosmetika original ekaniga qanday ishonch hosil qilaman?',
        p: [
          "«100% original» belgisini kelib chiqishini SEVIMLIga hujjatlar bilan tasdiqlagan do'konlarning mahsulotlari oladi; belgini platforma administratori yoqadi. O'zingiz ham tekshiring: mahsulot kartochkasida yaroqlilik muddati ko'rsatilgan — qabul qilishda uni va quti hamda flakondagi partiya kodini solishtiring.",
        ],
      },
      {
        h: "Nega narxlar oflayn do'konlardagidan past?",
        p: [
          "Platformadagi sotuvchilar bir-biri bilan raqobatlashadi va qimmat oflayn nuqtalarni saqlamaydi — shuning uchun narxlar odatda pastroq. Hujjatsiz o'ta past narx — hushyor bo'lishga sabab: bunday do'konlarni ulamaymiz.",
        ],
      },
      {
        h: 'Qanday buyurtma beraman?',
        p: [
          "Mahsulotni savatga qo'shing — katalogdan, qidiruvdan yoki to'g'ridan-to'g'ri hamjamiyatdagi postdan — manzil va to'lov usulini ko'rsating. Buyurtma holati profilda ko'rinadi, yetkazib berish haqida do'kon g'amxo'rlik qiladi.",
        ],
      },
      {
        h: 'Salonga qanday yozilaman?',
        p: [
          "Salon sahifasini oching, xizmat, sana va vaqtni tanlang. Salon yozilishni qo'ng'iroq yoki xabar bilan tasdiqlaydi; yozilish profilda ko'rinadi. Bekor qilish va ko'chirish — salon qoidalari bo'yicha.",
        ],
      },
      {
        h: 'Sodiqlik kartasi qanday ishlaydi?',
        p: [
          "Ballar platformadagi istalgan do'kondagi har bir yakunlangan buyurtma uchun hisoblanadi: 1% (Bronze) dan 5% (Platinum) gacha. 1 ball = 1 so'm; keyingi buyurtmaning 20% gachasini ballar bilan to'lash mumkin, ballar 6 oy amal qiladi.",
        ],
      },
      {
        h: "Qanday sotuvchi bo'laman?",
        p: [
          "Profilda «Sotuvchi bo'lish»ni bosing, do'kon kartochkasini to'ldiring va mahsulotlarni yuklang. Tekshiruv — 2 ish kunigacha: hujjatlar va mahsulot kelib chiqishini ko'ramiz. Joylashtirish bepul; targ'ibot va tahlil bilan pullik tariflar — sotuvchi xohishiga ko'ra, sotuvdan foizsiz.",
        ],
      },
      {
        h: 'Savollar qoldimi?',
        p: ["Telegramda yozing: @sevimli_uz — tez va odamiy javob beramiz."],
      },
    ],
  },
}

export default async function HelpPage() {
  const { lang } = await getT()
  const c = content[lang]
  return <InfoArticle title={c.title} subtitle={c.subtitle} sections={c.sections} />
}
