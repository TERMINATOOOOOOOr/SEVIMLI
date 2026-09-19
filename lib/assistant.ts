import type { Lang } from '@/lib/i18n'

/**
 * «Севиля» — помощница по подбору ухода. Демо-режим: экспертная система
 * (правила косметолога: тип кожи + задача → активы → товары из каталога).
 * В проде поверх этих же правил подключается LLM (Claude API) — правила
 * остаются как guardrails, чтобы ИИ рекомендовал только реальные товары.
 */

export type SkinType = 'dry' | 'oily' | 'combo' | 'sensitive' | 'normal'
export type Concern = 'acne' | 'pigment' | 'pores' | 'dehydrated' | 'dull' | 'aging' | 'spf'

export const SKIN_OPTIONS: { id: SkinType; label: Record<Lang, string> }[] = [
  { id: 'dry', label: { ru: 'Сухая', uz: 'Quruq' } },
  { id: 'oily', label: { ru: 'Жирная', uz: "Yog'li" } },
  { id: 'combo', label: { ru: 'Комбинированная', uz: 'Aralash' } },
  { id: 'sensitive', label: { ru: 'Чувствительная', uz: 'Sezgir' } },
  { id: 'normal', label: { ru: 'Нормальная', uz: 'Normal' } },
]

export const CONCERN_OPTIONS: { id: Concern; label: Record<Lang, string> }[] = [
  { id: 'acne', label: { ru: 'Акне и воспаления', uz: 'Husnbuzar' } },
  { id: 'pigment', label: { ru: 'Пигментация, неровный тон', uz: "Dog'lar, notekis rang" } },
  { id: 'pores', label: { ru: 'Расширенные поры', uz: 'Kengaygan teshiklar' } },
  { id: 'dehydrated', label: { ru: 'Обезвоженность', uz: 'Suvsizlanish' } },
  { id: 'dull', label: { ru: 'Тусклость, нет сияния', uz: "Xiralik, yaltiroq yo'q" } },
  { id: 'aging', label: { ru: 'Первые морщинки', uz: 'Ilk ajinlar' } },
  { id: 'spf', label: { ru: 'Защита от солнца', uz: 'Quyoshdan himoya' } },
]

/** Рекомендация: id товара + почему именно он (на обоих языках). */
export interface Recommendation {
  productId: string
  reason: Record<Lang, string>
}

const R = (productId: string, ru: string, uz: string): Recommendation => ({
  productId,
  reason: { ru, uz },
})

/** Правила: задача → приоритетные товары. */
const CONCERN_RULES: Record<Concern, Recommendation[]> = {
  acne: [
    R('k4', 'кислоты AHA-BHA-PHA мягко чистят кожу и снимают воспаления', "AHA-BHA-PHA kislotalari terini yumshoq tozalaydi va yallig'lanishni bosadi"),
    R('k3', 'хауттюйния 77% успокаивает раздражённую кожу', "xauttyuyniya 77% ta'sirlangan terini tinchlantiradi"),
  ],
  pigment: [
    R('k7', 'ниацинамид выравнивает тон и осветляет пятна', "niatsinamid rangni tekislaydi va dog'larni oqartiradi"),
    R('p4', 'витамин C — классика против пигментации', 'vitamin C — pigmentatsiyaga qarshi klassika'),
  ],
  pores: [
    R('k6', 'пэды с BHA сужают поры и убирают чёрные точки', 'BHA padlari teshiklarni toraytiradi'),
    R('k4', 'кислотный тонер регулирует себум', 'kislotali toner sebumni boshqaradi'),
  ],
  dehydrated: [
    R('k5', '5 видов гиалуроновой кислоты наполняют кожу влагой', '5 xil gialuron kislota terini namlik bilan toʻldiradi'),
    R('k1', 'муцин улитки удерживает влагу и восстанавливает', 'shilliq mucini namlikni ushlab, tiklaydi'),
  ],
  dull: [
    R('k1', 'эссенция с муцином возвращает сияние за 1–2 недели', 'mucin essensiyasi 1–2 haftada yaltiroqni qaytaradi'),
    R('k7', 'ниацинамид даёт эффект «стеклянной кожи»', 'niatsinamid «shisha teri» effektini beradi'),
  ],
  aging: [
    R('k5', 'глубокое увлажнение — база анти-эйдж ухода', 'chuqur namlash — anti-age parvarish asosi'),
    R('k1', 'муцин стимулирует восстановление кожи', 'mucin teri tiklanishini qoʻllab-quvvatlaydi'),
  ],
  spf: [
    R('k2', 'SPF50+ без белых следов, под макияж', 'SPF50+ oq iz qoldirmaydi, makiyaj ostiga'),
  ],
}

/** Поправки по типу кожи. */
const SKIN_RULES: Record<SkinType, Recommendation[]> = {
  dry: [R('k5', 'для сухой кожи — гиалуроновая сыворотка утром и вечером', 'quruq teri uchun — gialuron serumi ertalab va kechqurun')],
  oily: [R('k6', 'для жирной кожи — пэды 2–3 раза в неделю', "yog'li teri uchun — padlar haftasiga 2–3 marta")],
  combo: [R('k8', 'лёгкий тонер балансирует комбинированную кожу', 'yengil toner aralash terini muvozanatlaydi')],
  sensitive: [R('k3', 'для чувствительной кожи — успокаивающий тонер без спирта', 'sezgir teri uchun — spirtsiz tinchlantiruvchi toner')],
  normal: [R('k8', 'увлажняющий тонер поддержит баланс', 'namlovchi toner muvozanatni saqlaydi')],
}

/** Итоговый подбор: 3–4 товара без повторов + SPF всегда в финале. */
export function recommend(skin: SkinType, concern: Concern): Recommendation[] {
  const picks = [...CONCERN_RULES[concern], ...SKIN_RULES[skin]]
  if (concern !== 'spf') picks.push(R('k2', 'SPF — обязательный финал любого ухода', 'SPF — har qanday parvarishning majburiy yakuni'))
  const seen = new Set<string>()
  let list = picks.filter((p) => (seen.has(p.productId) ? false : (seen.add(p.productId), true)))
  // Чувствительной и сухой коже — не больше одного эксфолианта (пэды k6 мягче тонера k4)
  if ((skin === 'sensitive' || skin === 'dry') && list.some((p) => p.productId === 'k6')) {
    list = list.filter((p) => p.productId !== 'k4')
  }
  return list.slice(0, 4)
}

// ---------- График применения ----------

export type TimeOfDay = 'am' | 'pm' | 'both'

/** Как пользоваться средством: время суток, порядок шага, дни недели (если не ежедневно). */
interface UsageRule {
  time: TimeOfDay
  /** Порядок в ритуале: 2 тонер → 3 кислоты/пэды → 4 сыворотка/эссенция → 6 SPF. */
  order: number
  /** Индексы дней недели (0 = Пн) — только для не-ежедневных активов. */
  days?: number[]
  label: Record<Lang, string>
  note: Record<Lang, string>
}

const USAGE: Record<string, UsageRule> = {
  k1: {
    time: 'both', order: 4,
    label: { ru: 'Эссенция с муцином', uz: 'Mucin essensiyasi' },
    note: { ru: 'после тонера, на влажную кожу', uz: 'tonerdan keyin, nam teriga' },
  },
  k2: {
    time: 'am', order: 6,
    label: { ru: 'Санскрин SPF50+', uz: 'SPF50+ sanskrin' },
    note: { ru: 'финал утра; на солнце обновлять каждые 2–3 часа', uz: 'ertalabki oxirgi bosqich; quyoshda har 2–3 soatda yangilang' },
  },
  k3: {
    time: 'both', order: 2,
    label: { ru: 'Тонер с хауттюйнией', uz: 'Xauttyuyniya toneri' },
    note: { ru: 'сразу после умывания', uz: 'yuvingandan keyin darhol' },
  },
  k4: {
    time: 'pm', order: 3, days: [1, 4],
    label: { ru: 'Кислотный тонер AHA-BHA-PHA', uz: 'AHA-BHA-PHA kislotali toner' },
    note: { ru: '2 раза в неделю, только вечером', uz: 'haftasiga 2 marta, faqat kechqurun' },
  },
  k5: {
    time: 'both', order: 5,
    label: { ru: 'Гиалуроновая сыворотка', uz: 'Gialuron serumi' },
    note: { ru: 'после тонера, на влажную кожу', uz: 'tonerdan keyin, nam teriga' },
  },
  k6: {
    time: 'pm', order: 3, days: [0, 3],
    label: { ru: 'BHA-пэды', uz: 'BHA padlari' },
    note: { ru: '2 раза в неделю вечером, не в один день с кислотами', uz: 'haftasiga 2 marta kechqurun, kislotalar bilan bir kunda emas' },
  },
  k7: {
    time: 'both', order: 5,
    label: { ru: 'Сыворотка с ниацинамидом', uz: 'Niatsinamidli serum' },
    note: { ru: 'после тонера', uz: 'tonerdan keyin' },
  },
  k8: {
    time: 'both', order: 2,
    label: { ru: 'Увлажняющий тонер', uz: 'Namlovchi toner' },
    note: { ru: 'сразу после умывания', uz: 'yuvingandan keyin darhol' },
  },
  p4: {
    time: 'am', order: 5,
    label: { ru: 'Сыворотка с витамином C', uz: 'Vitamin C serumi' },
    note: { ru: 'утром под SPF', uz: 'ertalab SPF ostiga' },
  },
}

export interface RoutineStep {
  productId: string
  label: Record<Lang, string>
  note: Record<Lang, string>
}

export interface RoutinePlan {
  am: RoutineStep[]
  pm: RoutineStep[]
  /** Не-ежедневные активы: какие дни недели (0 = Пн). */
  week: { productId: string; label: Record<Lang, string>; days: number[] }[]
}

/** Собирает график «когда что наносить» из подобранных товаров. */
export function buildRoutine(recs: Recommendation[]): RoutinePlan | null {
  const items = recs
    .map((r) => ({ id: r.productId, u: USAGE[r.productId] }))
    .filter((x): x is { id: string; u: UsageRule } => Boolean(x.u))
  if (items.length === 0) return null
  const step = (x: { id: string; u: UsageRule }): RoutineStep => ({
    productId: x.id, label: x.u.label, note: x.u.note,
  })
  const byOrder = (a: { u: UsageRule }, b: { u: UsageRule }) => a.u.order - b.u.order
  return {
    am: items.filter((x) => x.u.time !== 'pm').sort(byOrder).map(step),
    pm: items.filter((x) => x.u.time !== 'am').sort(byOrder).map(step),
    week: items
      .filter((x) => x.u.days)
      .map((x) => ({ productId: x.id, label: x.u.label, days: x.u.days! })),
  }
}

/** Ключевые слова свободного текста → задача. */
const KEYWORDS: { concern: Concern; words: RegExp }[] = [
  { concern: 'acne', words: /акне|прыщ|воспал|husnbuzar|yallig/i },
  { concern: 'pigment', words: /пигмент|пятн|тон\b|осветл|dog'|dog‘|ригм/i },
  { concern: 'pores', words: /пор[ыа]|чёрны|черны|g'ovak|teshik/i },
  { concern: 'dehydrated', words: /сух|обезвож|увлажн|стянут|quruq|namlik|suvsiz/i },
  { concern: 'dull', words: /туск|сияни|устал|xira|yaltir/i },
  { concern: 'aging', words: /морщин|возраст|упруг|ajin|yosh/i },
  { concern: 'spf', words: /spf|солнц|санскрин|загар|quyosh/i },
]

const SKIN_KEYWORDS: { skin: SkinType; words: RegExp }[] = [
  { skin: 'oily', words: /жирн|блест|yog'li|yogli/i },
  { skin: 'dry', words: /сух|quruq/i },
  { skin: 'sensitive', words: /чувствит|раздраж|покрасн|sezgir/i },
  { skin: 'combo', words: /комбинир|aralash/i },
]

/** Отрицание перед найденным словом: «не сухая», «emas» — тогда слово не в счёт. */
function isNegatedAt(text: string, idx: number): boolean {
  const before = text.slice(Math.max(0, idx - 7), idx).toLowerCase()
  return /(^|\s)(не|нет|emas)\s*$/.test(before)
}

/** Разбор свободного вопроса: тип кожи и задача (с учётом отрицаний). */
export function parseFreeText(text: string): { skin: SkinType | null; concern: Concern | null } {
  let concern: Concern | null = null
  for (const k of KEYWORDS) {
    const m = text.match(k.words)
    if (m && !isNegatedAt(text, m.index ?? 0)) {
      concern = k.concern
      break
    }
  }
  let skin: SkinType | null = null
  for (const k of SKIN_KEYWORDS) {
    const m = text.match(k.words)
    if (m && !isNegatedAt(text, m.index ?? 0)) {
      skin = k.skin
      break
    }
  }
  return { skin, concern }
}

// ---------- База ответов по площадке (FAQ) ----------

/** Интент вопроса о SEVIMLI → готовый ответ (демо: правила, без LLM). */
const FAQ_INTENTS: { id: string; words: RegExp; answer: Record<Lang, string> }[] = [
  {
    id: 'delivery',
    words: /доставк|привез|когда получ|сколько.*(идёт|идет|дней|ждать)|yetkaz|dostavka/i,
    answer: {
      ru: '🚚 Доставка: её выполняет магазин — своим курьером или через службу доставки, обычно по Ташкенту за 1 день. Стоимость и срок указывает магазин; у многих бесплатно от 200 000 сум. Точные условия видно при оформлении заказа.',
      uz: '🚚 Yetkazish: uni doʻkon bajaradi — oʻz kuryeri yoki yetkazib berish xizmati orqali, odatda Toshkent boʻylab 1 kunda. Narx va muddatni doʻkon belgilaydi; koʻpchilikda 200 000 soʻmdan bepul. Aniq shartlar buyurtma rasmiylashtirishda koʻrinadi.',
    },
  },
  {
    id: 'authentic',
    words: /оригинал|подлин|подделк|фейк|настоящ|asl|orijinal|soxta|haqiqiy/i,
    answer: {
      ru: '🛡️ Подлинность: товары с меткой «100% оригинал» приходят с защитной наклейкой и уникальным кодом. Код проверяется на странице «Проверка подлинности» — увидите поставку и срок годности. За подделку продавца отключают навсегда.',
      uz: '🛡️ Haqiqiylik: «100% original» belgili mahsulotlar himoya stikeri va noyob kod bilan keladi. Kod «Haqiqiylikni tekshirish» sahifasida tekshiriladi. Soxta mahsulot uchun sotuvchi butunlay oʻchiriladi.',
    },
  },
  {
    id: 'davra',
    words: /davra|давра|вскладчин|группов|круг подруг|birga/i,
    answer: {
      ru: '👛 Davra — групповые покупки: создаёте круг, зовёте подруг по ссылке, складываете товары в общую корзину. При сумме круга от 500 000 сум — скидка −10% каждой прямо в заказе. Каждая оформляет и платит свою часть сама.',
      uz: '👛 Davra — birgalikda xarid: doira yaratasiz, dugonalarni havola orqali chaqirasiz, mahsulotlarni umumiy savatga qoʻshasiz. 500 000 soʻmdan oshsa — har biriga −10% chegirma buyurtmada. Har biri oʻz ulushini oʻzi rasmiylashtiradi.',
    },
  },
  {
    id: 'loyalty',
    words: /балл|кешб[эе]к|кешбек|лояльн|бонус|уровн|cashback|sodiqlik/i,
    answer: {
      ru: '💎 Лояльность: копите баллы с каждой завершённой покупки и открываете уровни — Bronze, Silver, Gold, Platinum. Кешбэк баллами растёт с 1% до 5%; баллами можно оплатить до 20% заказа, действуют 6 месяцев.',
      uz: '💎 Sodiqlik: har yakunlangan xariddan ball toʻplab, darajalarni ochasiz — Bronze, Silver, Gold, Platinum. Keshbek 1% dan 5% gacha; ballar bilan buyurtmaning 20% gacha toʻlash mumkin, ballar 6 oy amal qiladi.',
    },
  },
  {
    id: 'pay',
    words: /оплат|оплачив|картой|click|payme|uzcard|humo|наличн|to.?lov/i,
    answer: {
      ru: '💳 Оплата: заказ оплачивается магазину — при получении или по его ссылке Click/Payme; онлайн-оплата картой на площадке подключается. Баллами лояльности — до 20% заказа.',
      uz: '💳 Toʻlov: buyurtma doʻkonga toʻlanadi — qabul qilishda yoki uning Click/Payme havolasi orqali; platformada onlayn toʻlov ulanmoqda. Sodiqlik ballari bilan — buyurtmaning 20% gacha.',
    },
  },
  {
    id: 'return',
    words: /возврат|обмен|вернуть|не подош|брак|qaytar|almashtir/i,
    answer: {
      ru: '↩️ Возврат и обмен: оформляются через магазин-продавец по закону «О защите прав потребителей» — обмен товара надлежащего качества в течение 10 дней; косметика, парфюмерия, бельё и предметы гигиены обмену не подлежат, кроме брака. При споре платформа выступает медиатором между вами и магазином.',
      uz: '↩️ Qaytarish va almashtirish: sotuvchi doʻkon orqali «Isteʼmolchilar huquqlarini himoya qilish toʻgʻrisida»gi qonun boʻyicha — sifatli mahsulotni 10 kun ichida almashtirish mumkin; kosmetika, parfyumeriya, ichki kiyim va gigiyena buyumlari almashtirilmaydi (brakdan tashqari). Nizoda platforma siz bilan doʻkon oʻrtasida vositachi boʻladi.',
    },
  },
  {
    id: 'howorder',
    words: /как\s+(заказ|купить|офор|добав)|корзин|оформ.*заказ|qanday.*(xarid|buyurtma|sotib)/i,
    answer: {
      ru: '🛒 Как заказать: открываете товар → «В корзину» → в корзине проверяете и оформляете заказ. Можно добавить прямо из моего совета или из отзыва в сообществе. Для покупок вскладчину — «в корзину круга» Davra.',
      uz: '🛒 Buyurtma: mahsulotni ochasiz → «Savatga» → savatda tekshirib buyurtma berasiz. Mening tavsiyamdan yoki sharhdan ham qoʻshsa boʻladi. Birga xarid uchun — Davra doirasi savatiga.',
    },
  },
  {
    id: 'kbeauty',
    words: /k-?beauty|корейск|корея|koreys|koreya/i,
    answer: {
      ru: '🇰🇷 K-beauty: магазины с официальным импортом из Кореи — тот же оригинал, что в бутиках, но дешевле, потому что продавцы конкурируют прямо на площадке. Подделки исключены проверкой подлинности.',
      uz: '🇰🇷 K-beauty: Koreyadan rasmiy import qiluvchi doʻkonlar — butiklardagidek original, lekin arzonroq, chunki sotuvchilar platformada raqobatlashadi.',
    },
  },
  {
    id: 'salon',
    words: /салон|запис|маникюр|массаж|бров|макияж|укладк|salon|massaj|manikyur/i,
    answer: {
      ru: '💆 Салоны: в разделе «Салоны» выбираете услугу (маникюр, макияж, массаж, укладка) у проверенного салона и записываетесь онлайн — как обычный товар, через корзину.',
      uz: '💆 Salonlar: «Salonlar» boʻlimida ishonchli salondan xizmat (manikyur, makiyaj, massaj) tanlab, onlayn yozilasiz — oddiy mahsulotdek savat orqali.',
    },
  },
  {
    id: 'trust',
    words: /проверенн|надёжн|надежн|безопас|можно.*доверя|обман|ishonch|xavfsiz/i,
    answer: {
      ru: '✅ Доверие: на площадке только проверенные магазины, метку «оригинал» дают после подтверждения официального импорта документами. В основе — честные отзывы реальных девушек, а не реклама.',
      uz: '✅ Ishonch: platformada faqat tekshirilgan doʻkonlar, «original» belgisi hujjatlar bilan tasdiqlangach beriladi. Asosida — reklama emas, haqiqiy sharhlar.',
    },
  },
  {
    id: 'about',
    words: /что\s+так(ое|ой)\s+sevimli|что\s+за\s+sevimli|кто\s+ты|что\s+(ты\s+)?умеешь|чем\s+помож|sevimli\s+nima|nima\s+qila/i,
    answer: {
      ru: '💗 Я Севиля — помощница SEVIMLI. SEVIMLI это «всё в одном» для женщин Узбекистана: проверенные магазины и оригинальная косметика, живое сообщество с отзывами, групповые покупки Davra, запись в салоны и лояльность. Помогаю подобрать уход и отвечаю на вопросы о площадке.',
      uz: '💗 Men Sevilyaman — SEVIMLI yordamchisi. SEVIMLI — ayollar uchun «hammasi birda»: tekshirilgan doʻkonlar va original kosmetika, sharhli hamjamiyat, Davra xaridlari, salonlarga yozilish va sodiqlik. Parvarish tanlashda yordam beraman.',
    },
  },
]

/** Ответ по площадке на свободный вопрос, если распознан интент. */
export function answerFaq(text: string, lang: Lang): string | null {
  const hit = FAQ_INTENTS.find((i) => i.words.test(text))
  return hit ? hit.answer[lang] : null
}
