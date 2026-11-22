import type { Lang } from '@/lib/i18n'
import type { CommunityPost, PostComment, ProductQuestion, ProductAnswer, Review } from '@/lib/types'

/** В демо ключ = id (cp1…), у демо-сида в базе — колонка demo_key, у живого UGC — ничего. */
const key = (x: { id: string; demo_key?: string | null }) => x.demo_key ?? x.id

/**
 * Узбекские версии демо-контента сообщества (посты, комментарии, Q&A, отзывы).
 * Пользовательский контент (созданный в демо через композер) не переводится —
 * показывается как написан, это нормально для UGC-ленты.
 */

const POST_UZ: Record<string, string> = {
  cp1: "Qizlar, nihoyat original COSRXni normal narxda qayerdan olishni topdim 🙌 Mucinli essensiya — teri bir haftada rostdan ham namlanib qoldi. SEVIMLIdan oldim: qutidagi yaroqlilik muddati kartochkadagi bilan mos keldi.",
  cp2: "Yog'li teri uchun oq iz qoldirmaydigan sanskrin maslahat berasizlarmi? Koreyscha narsa xohlayman 🌸",
  cp3: "Parvarish bo'yicha layfhak: Anua Heartleaf tonerini paxta disk bilan surtmasdan, qo'lda yengil urib suring — ta'sirlanish kamroq bo'ladi. Sezgir terim uchun holy-grail 💚",
  cp4: "SEVIMLIdan Aurora ko'ylagi — bu pulga sifati zo'r. Ikki haftadan beri kiyyapman, mato g'ijimlanmaydi. Yoz uchun tavsiya qilaman! 👗",
  cp5: "Kim Numbuzin No.3 ni sinab ko'rgan? Yuz rangiga rostdan yordam beradimi yoki shunchaki marketingmi? Blogerlar emas, oddiy odamlarning fikri kerak 🙏",
  cp6: "Beauty of Joseon sanskrini — 10/10. Oq iz yo'q, makiyaj ostiga ideal. Tushlikda buyurtma qildim — kechqurun bepul olib kelishdi 🚚 Narxi instadagi qizdan olganimdan ham arzon.",
  cp7: "SEVIMLI orqali yozilib Malika Beautyga bordim — manikyur olov, usta ozoda, yozilish qo'ng'iroqsiz va kutishsiz. Qoplama ikki haftadan beri turibdi 💅",
  cp8: "Uy shinamligi uchun maslahat: to'qilgan pled + bir-ikki aromatik sham — kuz oqshomlari butunlay boshqacha bo'ladi ✨ SEVIMLIdagi Cozy pledi kutganimdan ham yumshoq, umuman qichitmaydi.",
  cp9: "Qizlar, bir yoshga to'layotgan qizchaga nima sovg'a qilsam bo'ladi? Rivojlantiruvchi gilamcha olsammi deb o'ylayapman — kimda bor, olishga arziydimi? Yoki boshqa narsa yaxshiroqmi? 🎁",
  cp10: "K-beauty olganda nimani tekshiraman: 1) quti va flakondagi partiya kodi bir xil 2) yaroqlilik muddati tugab qolmagan 3) plyonka va qadoq butun 4) narx «bozordan 3 barobar arzon» emas. SEVIMLIda yaroqlilik muddati mahsulot kartochkasidayoq ko'rinadi — qulay 😉",
  cp11: "Qizlar, Oud Rose parfyumi — bu boshqa dunyo 😍 Sharqona, lekin og'ir emas, shleyfi nozik. Kechqurun buyurtma qildim — ertalab olib kelishdi. Bu narxga savdo markazida qaraydigan narsa ham yo'q.",
  cp12: "Kuzgi layfhak: ertalab bir qoshiq tog' asali + 95-ko'k choy — hech qanday shamollash yo'lamaydi. Asalni SEVIMLI orqali Yashil Bozordan olaman, o'sha kuniyoq olib kelishadi 🍯",
}

const POST_EN: Record<string, string> = {
  cp1: 'I finally found where to get authentic COSRX at a fair price 🙌 The snail mucin essence really made my skin feel more hydrated in a week. I ordered it on SEVIMLI, and the expiry date matched the packaging.',
  cp2: 'Can anyone recommend a sunscreen for oily skin that does not leave a white cast? I would love a Korean one 🌸',
  cp3: 'Skincare tip: pat Anua Heartleaf toner into your skin with your hands instead of using a cotton pad — it feels gentler. A holy grail for my sensitive skin 💚',
  cp4: 'The Aurora dress from SEVIMLI is great quality for the price. I have worn it for two weeks and the fabric barely wrinkles. Perfect for summer! 👗',
  cp5: 'Has anyone tried Numbuzin No.3? Does it really help even out skin tone, or is it just marketing? I want honest opinions, not influencer ads 🙏',
  cp6: 'Beauty of Joseon sunscreen is a 10/10. No white cast and perfect under makeup. I ordered at lunch and it arrived that evening 🚚 It was cheaper than the Instagram shop I used before.',
  cp7: 'I booked Malika Beauty Salon through SEVIMLI — amazing manicure, a clean studio, and booking without a phone call or waiting. The polish still looks great after two weeks 💅',
  cp8: 'Cozy home tip: a knitted blanket and a couple of scented candles make autumn evenings feel special ✨ The Cozy blanket from SEVIMLI is softer than I expected and not itchy at all.',
  cp9: 'What should I get for a little girl turning one? I am thinking about an activity play mat — does anyone have one? Is it worth it, or is there a better idea? 🎁',
  cp10: 'What I check when buying K-beauty: 1) the batch codes match on the box and bottle 2) it is not expired 3) the seal and packaging are intact 4) the price is not suspiciously low. On SEVIMLI, the expiry date is already on the product page — so handy 😉',
  cp11: 'Oud Rose perfume is something else 😍 It is warm and oriental but not too heavy, with a lovely soft trail. I ordered in the evening and it arrived in the morning. Great value!',
  cp12: 'Autumn tip: a spoonful of mountain honey with green tea in the morning is my favorite ritual. I order honey through SEVIMLI from Yashil Bozor and it arrives the same day 🍯',
}

const COMMENT_UZ: Record<string, string> = {
  cc1: "Originalni qalbakidan qanday ajratsa bo'ladi?",
  cc2: "Men quti va flakondagi partiya kodi bilan yaroqlilik muddatini solishtiraman — ular bir xil bo'lishi kerak. Bunda hammasi mos keldi 👍",
  cc3: "Beauty of Joseon Relief Sun — ideal! Shu yerda bor ekan.",
  cc4: "Qo'shilaman, maslahat bilan oldim, mamnunman ✨",
  cc5: "Qaysi o'lchamda oldingiz? O'lchami to'g'ri keldimi?",
  cc6: "M oldim, quyib qo'ygandek o'tirdi. O'lcham jadvali halol 👍",
  cc7: "Bir oydan beri ishlatyapman — rang rostdan tekisroq, lekin effekt to'planib boradi, 3–4 hafta kuting.",
  cc8: "Bo'ldi, olaman! Sharh uchun rahmat 💛",
  cc9: "Qaysi ustaga yozilgandingiz?",
  cc10: "Nargizaga, lekin hammasi zo'r deyishadi 😊",
  cc11: "Gilamcha — top, bizda ham bor. Ravoqlari yechiladi, uzoq vaqtga yetadi.",
  cc12: "Saqlab qo'ydim! Juda foydali 🙏",
  cc13: "Tasdiqlayman, menda ham xuddi shunday — chidamliligi super 👌",
}

const COMMENT_EN: Record<string, string> = {
  cc1: 'How can you tell the authentic product from a fake?',
  cc2: 'I compare the batch code on the box with the bottle and check the expiry date — they should match. Everything checked out here 👍',
  cc3: 'Beauty of Joseon Relief Sun is perfect! They have it here.',
  cc4: 'Agreed — I bought it after the recommendation and love it ✨',
  cc5: 'Which size did you get? Did it fit well?',
  cc6: 'I got an M and it fits perfectly. The size chart is accurate 👍',
  cc7: 'I have used it for a month. My skin tone does look more even, but it takes time — give it 3–4 weeks.',
  cc8: 'All right, I am getting it! Thanks for the review 💛',
  cc9: 'Which nail artist did you book with?',
  cc10: 'Nargiza — but I hear they are all great 😊',
  cc11: 'The play mat is great — we have one too. The arches come off, so it lasts a long time.',
  cc12: 'Saved this! Super helpful 🙏',
  cc13: 'Same experience here — it lasts so well 👌',
}

const QUESTION_UZ: Record<string, string> = {
  q1: "Bu aniq originalmi? Xitoydan qalbaki emasmi?",
  q2: "Qishda quruq teriga to'g'ri keladimi?",
  q3: "Yetkazib berish rostdan bepulmi? Qanchalik tez?",
}

const QUESTION_EN: Record<string, string> = {
  q1: 'Is this definitely authentic? Could it be a fake from China?',
  q2: 'Would this work for dry skin in winter?',
  q3: 'Is delivery really free? How long does it take?',
}

const ANSWER_UZ: Record<string, string> = {
  qa1: "Ha, bu original: import hujjatlarini SEVIMLIga ko'rsatganmiz. Yaroqlilik muddati mahsulot kartochkasida ko'rsatilgan — u qadoqdagi bilan bir xil.",
  qa2: "Meniki quruq, qishda krem ostiga suraman — qutqaradi 🙌",
  qa3: "Ha, Toshkent bo'ylab bepul, odatda 1 kun ichida yetkazamiz.",
}

const ANSWER_EN: Record<string, string> = {
  qa1: 'Yes, this is authentic: we shared our import documents with SEVIMLI. The expiry date is on the product page and matches the packaging.',
  qa2: 'My skin is dry too. I use it under a cream in winter — it helps a lot 🙌',
  qa3: 'Yes, delivery across Tashkent is free and usually arrives within a day.',
}

const REVIEW_UZ: Record<string, string> = {
  r1: "Ko'ylak zo'r, matosi yoqimli, quyib qo'ygandek o'tirdi!",
  r2: "Chiroyli, lekin yetkazib berish biroz kechikdi.",
  r3: "2 haftada teri sezilarli darajada tekislandi. Tavsiya qilaman!",
  r4: "Original, qutidagi yaroqlilik muddati kartochka bilan mos keldi. Birinchi surtishdayoq teri namlandi.",
  r5: "Eng zo'r sanskrin! Bu yerda oflayn do'konlardan rostdan ham arzon. Bir kunda bepul olib kelishdi.",
  r6: "Ifori maftunkor, ertalabdan kechgacha turadi. Turmush o'rtog'imga ham yoqdi 😄",
  r7: "Qulay, yengil, o'lchami aniq. Ikki haftadan beri kiyyapman — hali ham oppoq 😅",
  r8: "Asal haqiqiy, quyuq, xushbo'y. Qishloqdagi buvimnikidek!",
  r9: "Pled mayin-mayin, qizim faqat shu bilan uxlaydi. Yuvilgandan keyin ham yangidek.",
  r10: "Kapsulalarda baliq ta'mi yo'q, bir oydan beri ichyapman — tirnoqlarim sezilarli mustahkamlandi.",
}

const REVIEW_EN: Record<string, string> = {
  r1: 'Lovely dress, soft fabric and a perfect fit!',
  r2: 'Beautiful, but delivery was a little late.',
  r3: 'My skin looks noticeably more even after two weeks. Recommend!',
  r4: 'Authentic, and the expiry date on the package matched the product page. My skin felt hydrated after the first use.',
  r5: 'The best sunscreen! It really costs less here than at offline stores. Free delivery in one day.',
  r6: 'Such a lovely fragrance — it lasts all day. My husband likes it too 😄',
  r7: 'Comfortable and lightweight, with an accurate fit. I have worn it for two weeks and it is still bright white 😅',
  r8: 'Real mountain honey, thick and fragrant. Just like my grandmother’s!',
  r9: 'So soft — my daughter only wants to sleep with this blanket. It still looks new after washing.',
  r10: 'No fishy taste. After a month, my nails feel noticeably stronger.',
}

const TAG_UZ: Record<string, string> = {
  уход: 'parvarish',
  корея: 'koreya',
  отзыв: 'sharh',
  вопрос: 'savol',
  совет: 'maslahat',
  spf: 'spf',
  сыворотка: 'serum',
  одежда: 'kiyim',
  салон: 'salon',
  маникюр: 'manikyur',
  дом: 'uy',
  уют: 'shinamlik',
  дети: 'bolalar',
  подарок: "sovg'a",
  оригинал: 'original',
  парфюм: 'parfyum',
  красота: "go'zallik",
  здоровье: 'salomatlik',
  продукты: 'oziq-ovqat',
}

const TAG_EN: Record<string, string> = {
  уход: 'skincare',
  корея: 'korea',
  отзыв: 'review',
  вопрос: 'question',
  совет: 'tip',
  сыворотка: 'serum',
  одежда: 'fashion',
  салон: 'salon',
  маникюр: 'manicure',
  дом: 'home',
  уют: 'cozy',
  дети: 'kids',
  подарок: 'gift',
  оригинал: 'authentic',
  парфюм: 'fragrance',
  красота: 'beauty',
  здоровье: 'wellness',
  продукты: 'groceries',
  spf: 'spf',
}

const NAME_UZ: Record<string, string> = {
  Нигора: 'Nigora',
  Малика: 'Malika',
  Севара: 'Sevara',
  Дилноза: 'Dilnoza',
  Камила: 'Kamila',
  Зарина: 'Zarina',
  Гульнора: 'Gulnora',
  Феруза: 'Feruza',
  Вы: 'Siz',
}

const NAME_EN: Record<string, string> = {
  Нигора: 'Nigora',
  Малика: 'Malika',
  Севара: 'Sevara',
  Дилноза: 'Dilnoza',
  Камила: 'Kamila',
  Зарина: 'Zarina',
  Гульнора: 'Gulnora',
  Феруза: 'Feruza',
  Вы: 'You',
}

/** Текст поста на текущем языке (UGC остаётся как написан). */
export function postText(post: Pick<CommunityPost, 'id' | 'text' | 'demo_key'>, lang: Lang): string {
  if (lang === 'en') return POST_EN[key(post)] ?? post.text
  return lang === 'uz' ? (POST_UZ[key(post)] ?? post.text) : post.text
}

/** Текст комментария на текущем языке. */
export function commentText(c: Pick<PostComment, 'id' | 'text' | 'demo_key'>, lang: Lang): string {
  if (lang === 'en') return COMMENT_EN[key(c)] ?? c.text
  return lang === 'uz' ? (COMMENT_UZ[key(c)] ?? c.text) : c.text
}

/** Текст вопроса о товаре. */
export function questionText(q: Pick<ProductQuestion, 'id' | 'text' | 'demo_key'>, lang: Lang): string {
  if (lang === 'en') return QUESTION_EN[key(q)] ?? q.text
  return lang === 'uz' ? (QUESTION_UZ[key(q)] ?? q.text) : q.text
}

/** Текст ответа на вопрос. */
export function answerText(a: Pick<ProductAnswer, 'id' | 'text' | 'demo_key'>, lang: Lang): string {
  if (lang === 'en') return ANSWER_EN[key(a)] ?? a.text
  return lang === 'uz' ? (ANSWER_UZ[key(a)] ?? a.text) : a.text
}

/** Текст отзыва. */
export function reviewText(r: Pick<Review, 'id' | 'text'>, lang: Lang): string | null {
  const base = r.text ?? null
  if (lang === 'en') return REVIEW_EN[r.id] ?? base
  return lang === 'uz' ? (REVIEW_UZ[r.id] ?? base) : base
}

/** Подпись тега (фильтрация всегда идёт по исходному значению). */
export function tagLabel(tag: string, lang: Lang): string {
  if (lang === 'en') return TAG_EN[tag] ?? tag
  return lang === 'uz' ? (TAG_UZ[tag] ?? tag) : tag
}

/** Имя героини демо-данных латиницей для UZ. */
export function personName(name: string, lang: Lang): string {
  if (lang === 'en') return NAME_EN[name] ?? name
  return lang === 'uz' ? (NAME_UZ[name] ?? name) : name
}
