import type { Metadata } from 'next'
import { getT } from '@/lib/lang-server'
import InfoArticle, { type InfoSection } from '@/components/InfoArticle'

export const metadata: Metadata = { title: 'Публичная оферта · Ommaviy oferta' }

const content: Record<string, { title: string; subtitle: string; sections: InfoSection[] }> = {
  ru: {
    title: 'Публичная оферта',
    subtitle:
      'Условия пользования платформой SEVIMLI. Редакция от 1 августа 2026 года.',
    sections: [
      {
        h: '1. Термины',
        p: [
          '- «Платформа» — сайт и приложение SEVIMLI: электронная торговая площадка (маркетплейс).',
          '- «Покупатель» — дееспособное физическое лицо, оформившее заказ.',
          '- «Продавец» — магазин или салон, размещающий свои товары и услуги на Платформе и торгующий от своего имени.',
          '- «Заказ» — оформленная Покупателем заявка на покупку товара у Продавца или запись на его услугу.',
        ],
      },
      {
        h: '2. Роль платформы',
        p: [
          'Платформа — информационный сервис, который связывает Покупателей и Продавцов: витрина, корзина, заказы, записи, сообщество и программа лояльности. Платформа не является продавцом, не производит, не хранит и не доставляет товары и не оказывает услуги салонов.',
          'Договор купли-продажи товара (оказания услуги) заключается напрямую между Покупателем и Продавцом. Обязательства по качеству, срокам, доставке, гарантии и возврату несёт Продавец.',
          'Отношения сторон регулируются Гражданским кодексом Республики Узбекистан, законами «О защите прав потребителей» и «Об электронной коммерции». Оформление заказа означает принятие условий настоящей оферты.',
        ],
      },
      {
        h: '3. Цены и оплата',
        p: [
          '- Цены устанавливают Продавцы; все цены указаны в сумах и включают налоги.',
          '- Цена фиксируется в момент оформления заказа.',
          '- Оплата: онлайн (Uzcard, Humo, Visa, Mastercard) или при получении, если Продавец поддерживает такой способ. Получателем оплаты за товар является Продавец.',
          '- Зачёркнутая цена — прежняя или рыночная цена того же товара по данным Продавца.',
        ],
      },
      {
        h: '4. Доставка',
        p: [
          'Доставку организует Продавец; условия и сроки указываются на странице товара и при оформлении заказа. Риск случайной гибели товара переходит к Покупателю в момент передачи заказа.',
        ],
      },
      {
        h: '5. Возврат',
        p: [
          'Возврат и обмен осуществляет Продавец по правилам, описанным на странице «Доставка и оплата», в соответствии с Законом «О защите прав потребителей». Косметика надлежащего качества возврату не подлежит. Платформа содействует Покупателю в коммуникации с Продавцом при спорах.',
        ],
      },
      {
        h: '6. Маркировка «100% оригинал» и проверка продавцов',
        p: [
          'Платформа проверяет Продавцов при подключении (регистрационные документы, происхождение товара). Маркировка «100% оригинал» присваивается товарам, официальное происхождение которых Продавец подтвердил документами.',
          'Если подлинность такого товара не подтверждается, Продавец навсегда отключается от Платформы, информация о нём передаётся уполномоченным органам, а Платформа содействует Покупателю в возврате средств от Продавца.',
        ],
      },
      {
        h: '7. Сообщество',
        p: [
          'Публикуя посты и отзывы, пользователь гарантирует, что содержание не нарушает закон и права третьих лиц, и передаёт Платформе право показывать этот контент. Запрещены реклама без пометки, оскорбления и заведомо ложные отзывы; такие публикации удаляются.',
        ],
      },
      {
        h: '8. Ответственность и споры',
        p: [
          'Претензии по товарам и услугам направляются Продавцу; претензии к работе Платформы — на hello@sevimli.uz, рассматриваются до 10 рабочих дней. Неурегулированные споры решаются в порядке, установленном законодательством Республики Узбекистан.',
        ],
      },
    ],
  },
  uz: {
    title: 'Ommaviy oferta',
    subtitle:
      'SEVIMLI platformasidan foydalanish shartlari. 2026-yil 1-avgust tahriri.',
    sections: [
      {
        h: '1. Atamalar',
        p: [
          '- «Platforma» — SEVIMLI sayti va ilovasi: elektron savdo maydoni (marketpleys).',
          '- «Xaridor» — buyurtma rasmiylashtirgan muomalaga layoqatli jismoniy shaxs.',
          "- «Sotuvchi» — Platformada o'z tovar va xizmatlarini joylashtirib, o'z nomidan savdo qiluvchi do'kon yoki salon.",
          "- «Buyurtma» — Xaridor tomonidan rasmiylashtirilgan, Sotuvchidan tovar xaridi yoki uning xizmatiga yozilish arizasi.",
        ],
      },
      {
        h: '2. Platformaning roli',
        p: [
          "Platforma — Xaridor va Sotuvchilarni bog'lovchi axborot xizmati: vitrina, savat, buyurtmalar, yozilishlar, hamjamiyat va sodiqlik dasturi. Platforma sotuvchi emas, tovarlarni ishlab chiqarmaydi, saqlamaydi, yetkazmaydi va salon xizmatlarini ko'rsatmaydi.",
          "Tovar oldi-sotdisi (xizmat ko'rsatish) shartnomasi to'g'ridan-to'g'ri Xaridor va Sotuvchi o'rtasida tuziladi. Sifat, muddat, yetkazib berish, kafolat va qaytarish majburiyatlari Sotuvchi zimmasida.",
          "Tomonlar munosabatlari O'zbekiston Respublikasi Fuqarolik kodeksi, «Iste'molchilar huquqlarini himoya qilish to'g'risida» va «Elektron tijorat to'g'risida»gi qonunlar bilan tartibga solinadi. Buyurtma rasmiylashtirish ushbu oferta shartlarini qabul qilishni anglatadi.",
        ],
      },
      {
        h: "3. Narxlar va to'lov",
        p: [
          "- Narxlarni Sotuvchilar belgilaydi; barcha narxlar so'mda va soliqlarni o'z ichiga oladi.",
          '- Narx buyurtma rasmiylashtirilgan paytda qayd etiladi.',
          "- To'lov: onlayn (Uzcard, Humo, Visa, Mastercard) yoki Sotuvchi qo'llab-quvvatlasa — qabul qilishda. Tovar to'lovini oluvchi — Sotuvchi.",
          "- Chizilgan narx — Sotuvchi ma'lumotlariga ko'ra o'sha tovarning avvalgi yoki bozor narxi.",
        ],
      },
      {
        h: '4. Yetkazib berish',
        p: [
          "Yetkazib berishni Sotuvchi tashkil qiladi; shartlar va muddatlar tovar sahifasida va buyurtma rasmiylashtirishda ko'rsatiladi. Tovarning tasodifiy nobud bo'lish xavfi buyurtma topshirilgan paytda Xaridorga o'tadi.",
        ],
      },
      {
        h: '5. Qaytarish',
        p: [
          "Qaytarish va almashtirishni Sotuvchi «Yetkazib berish va to'lov» sahifasida tavsiflangan qoidalar bo'yicha, «Iste'molchilar huquqlarini himoya qilish to'g'risida»gi qonunga muvofiq amalga oshiradi. Sifatli kosmetika qaytarilmaydi. Nizolarda Platforma Xaridorga Sotuvchi bilan muloqotda ko'maklashadi.",
        ],
      },
      {
        h: '6. «100% original» belgisi va sotuvchilarni tekshirish',
        p: [
          "Platforma Sotuvchilarni ulanishda tekshiradi (ro'yxat hujjatlari, tovar kelib chiqishi). «100% original» belgisi Sotuvchi rasmiy kelib chiqishini hujjatlar bilan tasdiqlagan tovarlarga beriladi.",
          "Agar bunday tovarning aslligi tasdiqlanmasa, Sotuvchi Platformadan butunlay o'chiriladi, u haqidagi ma'lumot vakolatli organlarga beriladi, Platforma esa Xaridorga Sotuvchidan pulni qaytarib olishda ko'maklashadi.",
        ],
      },
      {
        h: '7. Hamjamiyat',
        p: [
          "Post va sharh e'lon qilar ekan, foydalanuvchi mazmun qonun va uchinchi shaxslar huquqlarini buzmasligini kafolatlaydi hamda Platformaga ushbu kontentni ko'rsatish huquqini beradi. Belgisiz reklama, haqorat va bila turib yolg'on sharhlar taqiqlanadi; bunday e'lonlar o'chiriladi.",
        ],
      },
      {
        h: '8. Javobgarlik va nizolar',
        p: [
          "Tovar va xizmatlar bo'yicha da'volar Sotuvchiga yo'llanadi; Platforma ishiga oid da'volar — hello@sevimli.uz manziliga, 10 ish kunigacha ko'rib chiqiladi. Hal etilmagan nizolar O'zbekiston Respublikasi qonunchiligida belgilangan tartibda hal qilinadi.",
        ],
      },
    ],
  },
}

export default async function TermsPage() {
  const { lang } = await getT()
  const c = content[lang]
  return <InfoArticle title={c.title} subtitle={c.subtitle} sections={c.sections} />
}
