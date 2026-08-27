import type { Metadata } from 'next'
import { getT } from '@/lib/lang-server'
import InfoArticle, { type InfoSection } from '@/components/InfoArticle'

export const metadata: Metadata = { title: 'Политика конфиденциальности · Maxfiylik siyosati' }

const content: Record<string, { title: string; subtitle: string; sections: InfoSection[] }> = {
  ru: {
    title: 'Политика конфиденциальности',
    subtitle: 'Действует с 1 августа 2026 года.',
    sections: [
      {
        h: '1. Общие положения',
        p: [
          'Настоящая Политика описывает, как платформа SEVIMLI (далее — «Платформа») собирает, использует и защищает персональные данные пользователей. Обработка данных ведётся в соответствии с Законом Республики Узбекистан «О персональных данных» (ЗРУ-547 от 02.07.2019).',
          'Используя Платформу, вы соглашаетесь с условиями настоящей Политики.',
        ],
      },
      {
        h: '2. Какие данные мы собираем',
        p: [
          '- Имя и контактные данные (телефон, e-mail), указанные при регистрации.',
          '- Адрес доставки и историю заказов.',
          '- Записи к салонам и содержимое ваших публикаций в сообществе.',
          '- Технические данные: cookie, IP-адрес, тип устройства — для работы сайта и статистики.',
        ],
      },
      {
        h: '3. Зачем мы их используем',
        p: [
          '- Выполнение заказов и доставка.',
          '- Работа личного кабинета, программы лояльности и сообщества.',
          '- Уведомления о статусе заказа (Telegram, SMS, e-mail).',
          '- Улучшение сервиса и защита от мошенничества.',
          'Мы не продаём и не передаём персональные данные третьим лицам для рекламы. Данные передаются только магазину-продавцу вашего заказа, службам доставки и платёжным провайдерам — в объёме, необходимом для выполнения заказа.',
        ],
      },
      {
        h: '4. Хранение и защита',
        p: [
          'Данные хранятся на защищённых серверах; доступ ограничен сотрудниками, которым он необходим для работы. Платёжные данные карт мы не храним — их обрабатывают сертифицированные платёжные провайдеры.',
        ],
      },
      {
        h: '5. Ваши права',
        p: [
          '- Запросить копию своих данных.',
          '- Исправить неточные данные в профиле.',
          '- Удалить аккаунт и данные (кроме тех, что мы обязаны хранить по закону).',
          '- Отозвать согласие на обработку, написав на privacy@sevimli.uz.',
        ],
      },
      {
        h: '6. Cookie',
        p: [
          'Cookie нужны для входа в аккаунт, корзины и запоминания языка интерфейса. Их можно отключить в настройках браузера, но часть функций перестанет работать.',
        ],
      },
      {
        h: '7. Изменения',
        p: [
          'Мы можем обновлять Политику; актуальная версия всегда опубликована на этой странице. О существенных изменениях уведомим в приложении или по e-mail.',
        ],
      },
    ],
  },
  uz: {
    title: 'Maxfiylik siyosati',
    subtitle: '2026-yil 1-avgustdan amal qiladi.',
    sections: [
      {
        h: '1. Umumiy qoidalar',
        p: [
          "Ushbu Siyosat SEVIMLI platformasi (keyingi o'rinlarda — «Platforma») foydalanuvchilarning shaxsiy ma'lumotlarini qanday yig'ishi, ishlatishi va himoya qilishini tavsiflaydi. Ma'lumotlar O'zbekiston Respublikasining «Shaxsga doir ma'lumotlar to'g'risida»gi qonuniga (O'RQ-547, 02.07.2019) muvofiq qayta ishlanadi.",
          'Platformadan foydalanish orqali siz ushbu Siyosat shartlariga rozilik bildirasiz.',
        ],
      },
      {
        h: "2. Qanday ma'lumotlarni yig'amiz",
        p: [
          "- Ro'yxatdan o'tishda ko'rsatilgan ism va aloqa ma'lumotlari (telefon, e-mail).",
          '- Yetkazib berish manzili va buyurtmalar tarixi.',
          '- Salonlarga yozilishlar va hamjamiyatdagi e\'lonlaringiz mazmuni.',
          "- Texnik ma'lumotlar: cookie, IP-manzil, qurilma turi — sayt ishlashi va statistika uchun.",
        ],
      },
      {
        h: '3. Ulardan nima uchun foydalanamiz',
        p: [
          '- Buyurtmalarni bajarish va yetkazib berish.',
          '- Shaxsiy kabinet, sodiqlik dasturi va hamjamiyat ishlashi.',
          '- Buyurtma holati haqida xabarlar (Telegram, SMS, e-mail).',
          '- Xizmatni yaxshilash va firibgarlikdan himoya.',
          "Shaxsiy ma'lumotlarni reklama uchun uchinchi shaxslarga sotmaymiz va bermaymiz. Ma'lumotlar faqat buyurtmangizni sotuvchi do'konga, yetkazib berish xizmatlari va to'lov provayderlariga — buyurtmani bajarish uchun zarur hajmda uzatiladi.",
        ],
      },
      {
        h: '4. Saqlash va himoya',
        p: [
          "Ma'lumotlar himoyalangan serverlarda saqlanadi; ularga kirish faqat ishi uchun zarur bo'lgan xodimlar bilan cheklangan. Karta to'lov ma'lumotlarini saqlamaymiz — ularni sertifikatlangan to'lov provayderlari qayta ishlaydi.",
        ],
      },
      {
        h: '5. Sizning huquqlaringiz',
        p: [
          "- O'z ma'lumotlaringiz nusxasini so'rash.",
          "- Profildagi noto'g'ri ma'lumotlarni tuzatish.",
          "- Akkaunt va ma'lumotlarni o'chirish (qonun bo'yicha saqlashimiz shart bo'lganlaridan tashqari).",
          "- privacy@sevimli.uz manziliga yozib, qayta ishlashga rozilikni qaytarib olish.",
        ],
      },
      {
        h: '6. Cookie',
        p: [
          "Cookie akkauntga kirish, savat va interfeys tilini eslab qolish uchun kerak. Ularni brauzer sozlamalarida o'chirish mumkin, lekin ayrim funksiyalar ishlamay qoladi.",
        ],
      },
      {
        h: "7. O'zgarishlar",
        p: [
          "Siyosatni yangilashimiz mumkin; dolzarb versiya doim shu sahifada e'lon qilinadi. Muhim o'zgarishlar haqida ilovada yoki e-mail orqali xabar beramiz.",
        ],
      },
    ],
  },
}

export default async function PrivacyPage() {
  const { lang } = await getT()
  const c = content[lang]
  return <InfoArticle title={c.title} subtitle={c.subtitle} sections={c.sections} />
}
