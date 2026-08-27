import type { Lang } from '@/lib/i18n'
import type { CommunityPost, PostComment, ProductQuestion, ProductAnswer, Review } from '@/lib/types'

/**
 * Узбекские версии демо-контента сообщества (посты, комментарии, Q&A, отзывы).
 * Пользовательский контент (созданный в демо через композер) не переводится —
 * показывается как написан, это нормально для UGC-ленты.
 */

const POST_UZ: Record<string, string> = {
  cp1: "Qizlar, nihoyat original COSRXni normal narxda qayerdan olishni topdim 🙌 Mucinli essensiya — teri bir haftada rostdan ham namlanib qoldi. SEVIMLIdan oldim, himoya stikeri bilan keldi.",
  cp2: "Yog'li teri uchun oq iz qoldirmaydigan sanskrin maslahat berasizlarmi? Koreyscha narsa xohlayman 🌸",
  cp3: "Parvarish bo'yicha layfhak: Anua Heartleaf tonerini paxta disk bilan surtmasdan, qo'lda yengil urib suring — ta'sirlanish kamroq bo'ladi. Sezgir terim uchun holy-grail 💚",
  cp4: "SEVIMLIdan Aurora ko'ylagi — bu pulga sifati zo'r. Ikki haftadan beri kiyyapman, mato g'ijimlanmaydi. Yoz uchun tavsiya qilaman! 👗",
  cp5: "Kim Numbuzin No.3 ni sinab ko'rgan? Yuz rangiga rostdan yordam beradimi yoki shunchaki marketingmi? Blogerlar emas, oddiy odamlarning fikri kerak 🙏",
  cp6: "Beauty of Joseon sanskrini — 10/10. Oq iz yo'q, makiyaj ostiga ideal. Tushlikda buyurtma qildim — kechqurun bepul olib kelishdi 🚚 Narxi instadagi qizdan olganimdan ham arzon.",
  cp7: "SEVIMLI orqali yozilib Malika Beautyga bordim — manikyur olov, usta ozoda, yozilish qo'ng'iroqsiz va kutishsiz. Qoplama ikki haftadan beri turibdi 💅",
  cp8: "Uy shinamligi uchun maslahat: to'qilgan pled + bir-ikki aromatik sham — kuz oqshomlari butunlay boshqacha bo'ladi ✨ SEVIMLIdagi Cozy pledi kutganimdan ham yumshoq, umuman qichitmaydi.",
  cp9: "Qizlar, bir yoshga to'layotgan qizchaga nima sovg'a qilsam bo'ladi? Rivojlantiruvchi gilamcha olsammi deb o'ylayapman — kimda bor, olishga arziydimi? Yoki boshqa narsa yaxshiroqmi? 🎁",
  cp10: "Original K-beautyni qanday ajratish mumkin: 1) qutida himoya stikeri 2) QR-kod brend saytiga olib boradi 3) batch-kod quti va flakonda bir xil 4) narx «bozordan 3 barobar arzon» emas. SEVIMLIda bularni sotuvdan oldin tekshirishadi — lekin o'zingiz ham tekshirib ko'rganingiz foydali 😉",
  cp11: "Qizlar, Oud Rose parfyumi — bu boshqa dunyo 😍 Sharqona, lekin og'ir emas, shleyfi nozik. Kechqurun buyurtma qildim — ertalab olib kelishdi. Bu narxga savdo markazida qaraydigan narsa ham yo'q.",
  cp12: "Kuzgi layfhak: ertalab bir qoshiq tog' asali + 95-ko'k choy — hech qanday shamollash yo'lamaydi. Asalni SEVIMLI orqali Yashil Bozordan olaman, o'sha kuniyoq olib kelishadi 🍯",
}

const COMMENT_UZ: Record<string, string> = {
  cc1: "Originalni qalbakidan qanday ajratsa bo'ladi?",
  cc2: "Rasmiysida QR-kod va stiker bo'ladi, bunda hammasi bor edi 👍",
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

const QUESTION_UZ: Record<string, string> = {
  q1: "Bu aniq originalmi? Xitoydan qalbaki emasmi?",
  q2: "Qishda quruq teriga to'g'ri keladimi?",
  q3: "Yetkazib berish rostdan bepulmi? Qanchalik tez?",
}

const ANSWER_UZ: Record<string, string> = {
  qa1: "Ha, 100% original — to'g'ridan-to'g'ri rasmiy import. Har bir qadoqda himoya stikeri va ishlab chiqaruvchi QR-kodi bor. Asllik kafolatini beramiz.",
  qa2: "Meniki quruq, qishda krem ostiga suraman — qutqaradi 🙌",
  qa3: "Ha, Toshkent bo'ylab bepul, odatda 1 kun ichida yetkazamiz.",
}

const REVIEW_UZ: Record<string, string> = {
  r1: "Ko'ylak zo'r, matosi yoqimli, quyib qo'ygandek o'tirdi!",
  r2: "Chiroyli, lekin yetkazib berish biroz kechikdi.",
  r3: "2 haftada teri sezilarli darajada tekislandi. Tavsiya qilaman!",
  r4: "100% original, qutisi himoya stikeri va QR bilan keldi. Birinchi surtishdayoq teri namlandi.",
  r5: "Eng zo'r sanskrin! Bu yerda oflayn do'konlardan rostdan ham arzon. Bir kunda bepul olib kelishdi.",
  r6: "Ifori maftunkor, ertalabdan kechgacha turadi. Turmush o'rtog'imga ham yoqdi 😄",
  r7: "Qulay, yengil, o'lchami aniq. Ikki haftadan beri kiyyapman — hali ham oppoq 😅",
  r8: "Asal haqiqiy, quyuq, xushbo'y. Qishloqdagi buvimnikidek!",
  r9: "Pled mayin-mayin, qizim faqat shu bilan uxlaydi. Yuvilgandan keyin ham yangidek.",
  r10: "Kapsulalarda baliq ta'mi yo'q, bir oydan beri ichyapman — tirnoqlarim sezilarli mustahkamlandi.",
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

/** Текст поста на текущем языке (UGC остаётся как написан). */
export function postText(post: Pick<CommunityPost, 'id' | 'text'>, lang: Lang): string {
  return lang === 'uz' ? (POST_UZ[post.id] ?? post.text) : post.text
}

/** Текст комментария на текущем языке. */
export function commentText(c: Pick<PostComment, 'id' | 'text'>, lang: Lang): string {
  return lang === 'uz' ? (COMMENT_UZ[c.id] ?? c.text) : c.text
}

/** Текст вопроса о товаре. */
export function questionText(q: Pick<ProductQuestion, 'id' | 'text'>, lang: Lang): string {
  return lang === 'uz' ? (QUESTION_UZ[q.id] ?? q.text) : q.text
}

/** Текст ответа на вопрос. */
export function answerText(a: Pick<ProductAnswer, 'id' | 'text'>, lang: Lang): string {
  return lang === 'uz' ? (ANSWER_UZ[a.id] ?? a.text) : a.text
}

/** Текст отзыва. */
export function reviewText(r: Pick<Review, 'id' | 'text'>, lang: Lang): string | null {
  const base = r.text ?? null
  return lang === 'uz' ? (REVIEW_UZ[r.id] ?? base) : base
}

/** Подпись тега (фильтрация всегда идёт по исходному значению). */
export function tagLabel(tag: string, lang: Lang): string {
  return lang === 'uz' ? (TAG_UZ[tag] ?? tag) : tag
}

/** Имя героини демо-данных латиницей для UZ. */
export function personName(name: string, lang: Lang): string {
  return lang === 'uz' ? (NAME_UZ[name] ?? name) : name
}
