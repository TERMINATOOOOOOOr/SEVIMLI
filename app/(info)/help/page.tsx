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
          'У конкретного магазина — его название видно на карточке товара и в заказе. Магазин отвечает за качество, доставку и возврат. Если возник спор, платформа поможет связаться с продавцом и проследит за решением.',
        ],
      },
      {
        h: 'Как убедиться, что косметика — оригинал?',
        p: [
          'Магазины с маркировкой «100% оригинал» подтвердили платформе официальное происхождение товара документами. Плюс проверяйте сами: защитная наклейка, QR-код производителя, совпадение батч-кодов. Если подлинность не подтвердится — магазин отключается от площадки навсегда.',
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
          'Откройте страницу салона, выберите услугу, дату и время. Подтверждение придёт в Telegram, запись видна в профиле. Отмена и перенос — по правилам салона, обычно бесплатно за 3 часа.',
        ],
      },
      {
        h: 'Как работает карта лояльности?',
        p: [
          'Баллы начисляются с каждого заказа у любого магазина площадки: от 1% (Bronze) до 5% (Platinum). 1 балл = 1 сум, оплачивайте баллами до 50% следующего заказа.',
        ],
      },
      {
        h: 'Как стать продавцом?',
        p: [
          'Нажмите «Стать продавцом» в профиле, заполните карточку магазина и загрузите товары. Модерация — 1 рабочий день: проверяем документы и происхождение товара. Комиссия площадки фиксированная, без скрытых платежей.',
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
          "«100% original» belgili do'konlar mahsulotning rasmiy kelib chiqishini platformaga hujjatlar bilan tasdiqlagan. O'zingiz ham tekshiring: himoya stikeri, ishlab chiqaruvchi QR-kodi, batch-kodlar mosligi. Asllik tasdiqlanmasa — do'kon platformadan butunlay o'chiriladi.",
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
          "Salon sahifasini oching, xizmat, sana va vaqtni tanlang. Tasdiq Telegramga keladi, yozilish profilda ko'rinadi. Bekor qilish va ko'chirish — salon qoidalari bo'yicha, odatda 3 soat oldin bepul.",
        ],
      },
      {
        h: 'Sodiqlik kartasi qanday ishlaydi?',
        p: [
          "Ballar platformadagi istalgan do'kondagi har bir buyurtmadan hisoblanadi: 1% (Bronze) dan 5% (Platinum) gacha. 1 ball = 1 so'm, keyingi buyurtmaning 50% gachasini ballar bilan to'lang.",
        ],
      },
      {
        h: "Qanday sotuvchi bo'laman?",
        p: [
          "Profilda «Sotuvchi bo'lish»ni bosing, do'kon kartochkasini to'ldiring va mahsulotlarni yuklang. Moderatsiya — 1 ish kuni: hujjatlar va mahsulot kelib chiqishini tekshiramiz. Platforma komissiyasi qat'iy, yashirin to'lovlarsiz.",
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
