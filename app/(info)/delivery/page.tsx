import type { Metadata } from 'next'
import { getT } from '@/lib/lang-server'
import InfoArticle, { type InfoSection } from '@/components/InfoArticle'

export const metadata: Metadata = { title: 'Доставка и оплата · Yetkazib berish' }

const content: Record<string, { title: string; subtitle: string; sections: InfoSection[] }> = {
  ru: {
    title: 'Доставка, оплата и возврат',
    subtitle:
      'SEVIMLI — площадка: товары продают и доставляют магазины. Здесь — общие правила, как это устроено.',
    sections: [
      {
        h: 'Доставка',
        p: [
          'Доставку выполняет магазин, у которого вы сделали заказ, — своими курьерами или через службы доставки. Точные условия и сроки указаны на странице магазина и при оформлении заказа.',
          '- Стоимость и срок доставки по Ташкенту указывает магазин.',
          '- Самовывоз с адреса магазина — бесплатно, если магазин его предлагает.',
          '- В другие города Узбекистана — почтовыми службами, по тарифам и срокам службы.',
          'После передачи заказа курьеру статус в профиле меняется на «Доставляется» — за ним можно следить в разделе «Мои заказы».',
        ],
      },
      {
        h: 'Оплата',
        p: [
          '- Онлайн через Payme или Click — если магазин подключил онлайн-оплату.',
          '- Наличными или картой курьеру при получении, если магазин поддерживает такой способ.',
          'Деньги за заказ получает магазин-продавец. Баллы лояльности начисляются автоматически после завершения заказа.',
        ],
      },
      {
        h: 'Возврат и обмен',
        p: [
          'Возврат оформляется у магазина-продавца в соответствии с Законом Республики Узбекистан «О защите прав потребителей». Ответственность за товар несёт продавец; платформа выступает медиатором и помогает связаться с магазином.',
          '- Непродовольственный товар надлежащего качества можно обменять в течение 10 дней (ст. 18 Закона), если он не был в употреблении и сохранены товарный вид и упаковка.',
          '- Косметика, парфюмерия, нижнее бельё и предметы гигиены надлежащего качества обмену и возврату не подлежат — кроме случаев брака или несоответствия описанию.',
          '- Товар с браком: напишите в поддержку и приложите фото — платформа передаст претензию магазину и поможет договориться.',
          'Деньги возвращает магазин — тем же способом, каким была оплата, в сроки, установленные законом.',
        ],
      },
      {
        h: 'Маркировка «100% оригинал»',
        p: [
          'Метку «100% оригинал» получают товары магазинов, которые подтвердили SEVIMLI происхождение товара документами; включает её администратор площадки. Если администратор снимает подтверждение импорта, метка пропадает со всех товаров магазина.',
        ],
      },
    ],
  },
  uz: {
    title: "Yetkazib berish, to'lov va qaytarish",
    subtitle:
      "SEVIMLI — platforma: mahsulotlarni do'konlar sotadi va yetkazadi. Bu yerda — bu qanday tuzilgani haqidagi umumiy qoidalar.",
    sections: [
      {
        h: 'Yetkazib berish',
        p: [
          "Yetkazib berishni siz buyurtma qilgan do'kon bajaradi — o'z kuryerlari yoki yetkazib berish xizmatlari orqali. Aniq shartlar va muddatlar do'kon sahifasida va buyurtma rasmiylashtirishda ko'rsatilgan.",
          "- Toshkent bo'ylab yetkazib berish narxi va muddatini do'kon belgilaydi.",
          "- Do'kon manzilidan olib ketish — bepul, agar do'kon buni taklif qilsa.",
          "- O'zbekistonning boshqa shaharlariga — pochta xizmatlari orqali, xizmat tariflari va muddatlari bo'yicha.",
          "Buyurtma kuryerga topshirilgach, profildagi holat «Yetkazilmoqda»ga o'zgaradi — uni «Buyurtmalarim» bo'limida kuzatish mumkin.",
        ],
      },
      {
        h: "To'lov",
        p: [
          "- Payme yoki Click orqali onlayn — agar do'kon onlayn to'lovni ulagan bo'lsa.",
          "- Do'kon qo'llab-quvvatlasa — qabul qilishda kuryerga naqd yoki karta orqali.",
          "Buyurtma pulini sotuvchi do'kon oladi. Sodiqlik ballari buyurtma yakunlangach avtomatik hisoblanadi.",
        ],
      },
      {
        h: 'Qaytarish va almashtirish',
        p: [
          "Qaytarish sotuvchi do'kon orqali, O'zbekiston Respublikasining «Iste'molchilar huquqlarini himoya qilish to'g'risida»gi qonuniga muvofiq rasmiylashtiriladi. Mahsulot uchun javobgarlik sotuvchida; platforma vositachi sifatida do'kon bilan bog'lanishga yordam beradi.",
          "- Sifatli nooziq-ovqat mahsulotini 10 kun ichida almashtirish mumkin (Qonunning 18-moddasi) — agar ishlatilmagan, tovar ko'rinishi va qadog'i saqlangan bo'lsa.",
          "- Sifatli kosmetika, parfyumeriya, ichki kiyim va gigiyena buyumlari almashtirilmaydi va qaytarilmaydi — brak yoki tavsifga mos kelmaslik holatlari bundan mustasno.",
          "- Nuqsonli mahsulot: foto bilan qo'llab-quvvatlashga yozing — platforma da'voni do'konga yetkazadi va kelishishga yordam beradi.",
          "Pulni do'kon to'lov qilingan usulda, qonunda belgilangan muddatlarda qaytaradi.",
        ],
      },
      {
        h: '«100% original» belgisi',
        p: [
          "«100% original» belgisini kelib chiqishini SEVIMLIga hujjatlar bilan tasdiqlagan do'konlarning mahsulotlari oladi; belgini platforma administratori yoqadi. Administrator import tasdig'ini olib tashlasa, belgi do'konning barcha mahsulotlaridan yo'qoladi.",
        ],
      },
    ],
  },
}

export default async function DeliveryPage() {
  const { lang } = await getT()
  const c = content[lang]
  return <InfoArticle title={c.title} subtitle={c.subtitle} sections={c.sections} />
}
