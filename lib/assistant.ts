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
  { id: 'dry', label: { ru: 'Сухая', uz: 'Quruq', en: 'Dry' } },
  { id: 'oily', label: { ru: 'Жирная', uz: "Yog'li", en: 'Oily' } },
  { id: 'combo', label: { ru: 'Комбинированная', uz: 'Aralash', en: 'Combination' } },
  { id: 'sensitive', label: { ru: 'Чувствительная', uz: 'Sezgir', en: 'Sensitive' } },
  { id: 'normal', label: { ru: 'Нормальная', uz: 'Normal', en: 'Normal' } },
]

export const CONCERN_OPTIONS: { id: Concern; label: Record<Lang, string> }[] = [
  { id: 'acne', label: { ru: 'Акне и воспаления', uz: 'Husnbuzar', en: 'Acne and blemishes' } },
  { id: 'pigment', label: { ru: 'Пигментация, неровный тон', uz: "Dog'lar, notekis rang", en: 'Dark spots and uneven tone' } },
  { id: 'pores', label: { ru: 'Расширенные поры', uz: 'Kengaygan teshiklar', en: 'Visible pores' } },
  { id: 'dehydrated', label: { ru: 'Обезвоженность', uz: 'Suvsizlanish', en: 'Dehydration' } },
  { id: 'dull', label: { ru: 'Тусклость, нет сияния', uz: "Xiralik, yaltiroq yo'q", en: 'Dullness and lack of glow' } },
  { id: 'aging', label: { ru: 'Первые морщинки', uz: 'Ilk ajinlar', en: 'Fine lines' } },
  { id: 'spf', label: { ru: 'Защита от солнца', uz: 'Quyoshdan himoya', en: 'Sun protection' } },
]

/** Рекомендация: id товара + почему именно он (на обоих языках). */
export interface Recommendation {
  productId: string
  reason: Record<Lang, string>
}

const R = (productId: string, ru: string, uz: string, en: string): Recommendation => ({
  productId,
  reason: { ru, uz, en },
})

/** Правила: задача → приоритетные товары. */
const CONCERN_RULES: Record<Concern, Recommendation[]> = {
  acne: [
    R('k4', 'кислоты AHA-BHA-PHA мягко чистят кожу и снимают воспаления', "AHA-BHA-PHA kislotalari terini yumshoq tozalaydi va yallig'lanishni bosadi", 'AHA-BHA-PHA acids gently exfoliate and help soothe blemish-prone skin'),
    R('k3', 'хауттюйния 77% успокаивает раздражённую кожу', "xauttyuyniya 77% ta'sirlangan terini tinchlantiradi", '77% heartleaf helps soothe irritated skin'),
  ],
  pigment: [
    R('k7', 'ниацинамид выравнивает тон и осветляет пятна', "niatsinamid rangni tekislaydi va dog'larni oqartiradi", 'Niacinamide helps even the look of skin tone and dark spots'),
    R('p4', 'витамин C — классика против пигментации', 'vitamin C — pigmentatsiyaga qarshi klassika', 'Vitamin C is a classic ingredient for uneven tone'),
  ],
  pores: [
    R('k6', 'пэды с BHA сужают поры и убирают чёрные точки', 'BHA padlari teshiklarni toraytiradi', 'BHA pads exfoliate and help clear the look of clogged pores'),
    R('k4', 'кислотный тонер регулирует себум', 'kislotali toner sebumni boshqaradi', 'An exfoliating toner helps manage excess oil'),
  ],
  dehydrated: [
    R('k5', '5 видов гиалуроновой кислоты наполняют кожу влагой', '5 xil gialuron kislota terini namlik bilan toʻldiradi', 'Five types of hyaluronic acid help hydrate the skin'),
    R('k1', 'муцин улитки удерживает влагу и восстанавливает', 'shilliq mucini namlikni ushlab, tiklaydi', 'Snail mucin helps retain moisture and support the skin barrier'),
  ],
  dull: [
    R('k1', 'эссенция с муцином возвращает сияние за 1–2 недели', 'mucin essensiyasi 1–2 haftada yaltiroqni qaytaradi', 'Snail mucin essence helps restore a hydrated, radiant look'),
    R('k7', 'ниацинамид даёт эффект «стеклянной кожи»', 'niatsinamid «shisha teri» effektini beradi', 'Niacinamide helps create a smoother, more radiant look'),
  ],
  aging: [
    R('k5', 'глубокое увлажнение — база анти-эйдж ухода', 'chuqur namlash — anti-age parvarish asosi', 'Deep hydration is a good foundation for a mature-skin routine'),
    R('k1', 'муцин стимулирует восстановление кожи', 'mucin teri tiklanishini qoʻllab-quvvatlaydi', 'Snail mucin helps support the skin barrier'),
  ],
  spf: [
    R('k2', 'SPF50+ без белых следов, под макияж', 'SPF50+ oq iz qoldirmaydi, makiyaj ostiga', 'SPF 50+ with no white cast, suitable under makeup'),
  ],
}

/** Поправки по типу кожи. */
const SKIN_RULES: Record<SkinType, Recommendation[]> = {
  dry: [R('k5', 'для сухой кожи — гиалуроновая сыворотка утром и вечером', 'quruq teri uchun — gialuron serumi ertalab va kechqurun', 'For dry skin — use a hyaluronic serum morning and evening')],
  oily: [R('k6', 'для жирной кожи — пэды 2–3 раза в неделю', "yog'li teri uchun — padlar haftasiga 2–3 marta", 'For oily skin — try exfoliating pads 2–3 times a week')],
  combo: [R('k8', 'лёгкий тонер балансирует комбинированную кожу', 'yengil toner aralash terini muvozanatlaydi', 'A lightweight toner helps balance combination skin')],
  sensitive: [R('k3', 'для чувствительной кожи — успокаивающий тонер без спирта', 'sezgir teri uchun — spirtsiz tinchlantiruvchi toner', 'For sensitive skin — a soothing, alcohol-free toner')],
  normal: [R('k8', 'увлажняющий тонер поддержит баланс', 'namlovchi toner muvozanatni saqlaydi', 'A hydrating toner helps maintain balance')],
}

/** Итоговый подбор: 3–4 товара без повторов + SPF всегда в финале. */
export function recommend(skin: SkinType, concern: Concern): Recommendation[] {
  const picks = [...CONCERN_RULES[concern], ...SKIN_RULES[skin]]
  if (concern !== 'spf') picks.push(R('k2', 'SPF — обязательный финал любого ухода', 'SPF — har qanday parvarishning majburiy yakuni', 'Finish your morning routine with SPF'))
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
    label: { ru: 'Эссенция с муцином', uz: 'Mucin essensiyasi', en: 'Snail mucin essence' },
    note: { ru: 'после тонера, на влажную кожу', uz: 'tonerdan keyin, nam teriga', en: 'After toner, apply to damp skin' },
  },
  k2: {
    time: 'am', order: 6,
    label: { ru: 'Санскрин SPF50+', uz: 'SPF50+ sanskrin', en: 'SPF 50+ sunscreen' },
    note: { ru: 'финал утра; на солнце обновлять каждые 2–3 часа', uz: 'ertalabki oxirgi bosqich; quyoshda har 2–3 soatda yangilang', en: 'Last step in the morning; reapply every 2–3 hours outdoors' },
  },
  k3: {
    time: 'both', order: 2,
    label: { ru: 'Тонер с хауттюйнией', uz: 'Xauttyuyniya toneri', en: 'Heartleaf toner' },
    note: { ru: 'сразу после умывания', uz: 'yuvingandan keyin darhol', en: 'Apply right after cleansing' },
  },
  k4: {
    time: 'pm', order: 3, days: [1, 4],
    label: { ru: 'Кислотный тонер AHA-BHA-PHA', uz: 'AHA-BHA-PHA kislotali toner', en: 'AHA-BHA-PHA exfoliating toner' },
    note: { ru: '2 раза в неделю, только вечером', uz: 'haftasiga 2 marta, faqat kechqurun', en: 'Use only in the evening, twice a week' },
  },
  k5: {
    time: 'both', order: 5,
    label: { ru: 'Гиалуроновая сыворотка', uz: 'Gialuron serumi', en: 'Hyaluronic acid serum' },
    note: { ru: 'после тонера, на влажную кожу', uz: 'tonerdan keyin, nam teriga', en: 'After toner, apply to damp skin' },
  },
  k6: {
    time: 'pm', order: 3, days: [0, 3],
    label: { ru: 'BHA-пэды', uz: 'BHA padlari', en: 'BHA toner pads' },
    note: { ru: '2 раза в неделю вечером, не в один день с кислотами', uz: 'haftasiga 2 marta kechqurun, kislotalar bilan bir kunda emas', en: 'Use twice a week in the evening, not on the same day as other acids' },
  },
  k7: {
    time: 'both', order: 5,
    label: { ru: 'Сыворотка с ниацинамидом', uz: 'Niatsinamidli serum', en: 'Niacinamide serum' },
    note: { ru: 'после тонера', uz: 'tonerdan keyin', en: 'Apply after toner' },
  },
  k8: {
    time: 'both', order: 2,
    label: { ru: 'Увлажняющий тонер', uz: 'Namlovchi toner', en: 'Hydrating toner' },
    note: { ru: 'сразу после умывания', uz: 'yuvingandan keyin darhol', en: 'Apply right after cleansing' },
  },
  p4: {
    time: 'am', order: 5,
    label: { ru: 'Сыворотка с витамином C', uz: 'Vitamin C serumi', en: 'Vitamin C serum' },
    note: { ru: 'утром под SPF', uz: 'ertalab SPF ostiga', en: 'Apply in the morning before SPF' },
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
  { concern: 'acne', words: /акне|прыщ|воспал|husnbuzar|yallig|acne|pimples?|blemishes|breakouts?/i },
  { concern: 'pigment', words: /пигмент|пятн|тон\b|осветл|dog'|dog‘|ригм|pigment(?:ation)?|dark spots?|uneven tone/i },
  { concern: 'pores', words: /пор[ыа]|чёрны|черны|g'ovak|teshik|pores?|blackheads/i },
  { concern: 'dehydrated', words: /сух|обезвож|увлажн|стянут|quruq|namlik|suvsiz|dry|dehydrat(?:ed|ion)|hydration/i },
  { concern: 'dull', words: /туск|сияни|устал|xira|yaltir|dull(?:ness)?|no glow|lack of glow/i },
  { concern: 'aging', words: /морщин|возраст|упруг|ajin|yosh|wrinkles?|aging|ageing|fine lines/i },
  { concern: 'spf', words: /spf|солнц|санскрин|загар|quyosh|sun protection|sunscreen/i },
]

const SKIN_KEYWORDS: { skin: SkinType; words: RegExp }[] = [
  { skin: 'oily', words: /жирн|блест|yog'li|yogli|oily|oiliness|shiny/i },
  { skin: 'dry', words: /сух|quruq|dry/i },
  { skin: 'sensitive', words: /чувствит|раздраж|покрасн|sezgir|sensitive|irritat/i },
  { skin: 'combo', words: /комбинир|aralash|combination|combination skin|combination-type/i },
]

/** Отрицание перед найденным словом: «не сухая», «emas» — тогда слово не в счёт. */
function isNegatedAt(text: string, idx: number): boolean {
  const before = text.slice(Math.max(0, idx - 7), idx).toLowerCase()
  return /(^|\s)(не|нет|emas|not|no|isn't|isnt|don't|doesn't)\s*$/.test(before)
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
    words: /доставк|привез|когда получ|сколько.*(идёт|идет|дней|ждать)|yetkaz|dostavka|delivery|shipping|ship(?:ped|ping)?/i,
    answer: {
      ru: '🚚 Доставка: её выполняет магазин — своим курьером или через службу доставки. Стоимость и срок указывает магазин — точные условия видно при оформлении заказа.',
      uz: '🚚 Yetkazish: uni doʻkon bajaradi — oʻz kuryeri yoki yetkazib berish xizmati orqali. Narx va muddatni doʻkon belgilaydi — aniq shartlar buyurtma rasmiylashtirishda koʻrinadi.',
      en: '🚚 Delivery is handled by the shop, either with its own courier or a delivery service. The shop sets the cost and timing, which are shown at checkout.',
    },
  },
  {
    id: 'authentic',
    words: /оригинал|подлин|подделк|фейк|настоящ|asl|orijinal|soxta|haqiqiy|authentic(?:ity)?|counterfeit|fake|genuine/i,
    answer: {
      ru: '🛡️ Подлинность: метку «100% оригинал» получают товары магазинов, подтвердивших SEVIMLI происхождение товара документами; включает её администратор площадки. В карточке товара виден срок годности — при получении сверьте его и код партии на упаковке.',
      uz: '🛡️ Haqiqiylik: «100% original» belgisini kelib chiqishini SEVIMLIga hujjatlar bilan tasdiqlagan doʻkonlarning mahsulotlari oladi; belgini platforma administratori yoqadi. Mahsulot kartochkasida yaroqlilik muddati koʻrinadi — qabul qilishda uni va qadoqdagi partiya kodini solishtiring.',
      en: '🛡️ The “100% authentic” badge is awarded by SEVIMLI after a shop provides documents confirming product origin. The product page shows the expiry date; check it against the package when your order arrives.',
    },
  },
  {
    id: 'davra',
    words: /davra|давра|вскладчин|группов|круг подруг|birga/i,
    answer: {
      ru: '👛 Davra — групповые покупки: создаёте круг, зовёте подруг по ссылке, складываете товары в общую корзину. При сумме круга от 500 000 сум — скидка −10% каждой прямо в заказе. Каждая оформляет и платит свою часть сама.',
      uz: '👛 Davra — birgalikda xarid: doira yaratasiz, dugonalarni havola orqali chaqirasiz, mahsulotlarni umumiy savatga qoʻshasiz. 500 000 soʻmdan oshsa — har biriga −10% chegirma buyurtmada. Har biri oʻz ulushini oʻzi rasmiylashtiradi.',
      en: '👛 Davra lets friends shop together: create a group, invite friends and add items to a shared cart. When the total reaches UZS 500,000, each member gets a 10% shop discount in her own order.',
    },
  },
  {
    id: 'loyalty',
    words: /балл|кешб[эе]к|кешбек|лояльн|бонус|уровн|cashback|sodiqlik|loyalty|reward|points/i,
    answer: {
      ru: '💎 Лояльность: копите баллы с каждой завершённой покупки и открываете уровни — Bronze, Silver, Gold, Platinum. 1 балл за каждые 1 000 сум, а уровень добавляет бонус к баллам — от +1% до +5%. Скоро баллами можно будет оплачивать покупки.',
      uz: '💎 Sodiqlik: har yakunlangan xariddan ball toʻplab, darajalarni ochasiz — Bronze, Silver, Gold, Platinum. Har 1 000 soʻm uchun 1 ball, daraja esa ballarga +1% dan +5% gacha bonus qoʻshadi. Tez orada ballar bilan xaridlar uchun toʻlash mumkin boʻladi.',
      en: '💎 Earn loyalty points on completed purchases and progress through Bronze, Silver, Gold and Platinum tiers. Earn 1 point per UZS 1,000, with a tier bonus of 1–5%. Points cannot be used for payment yet.',
    },
  },
  {
    id: 'pay',
    words: /оплат|оплачив|картой|click|payme|uzcard|humo|наличн|to.?lov|payment|pay for|pay online|cash|card/i,
    answer: {
      ru: '💳 Оплата: заказ оплачивается магазину — при получении или онлайн через Payme/Click, если магазин подключил оплату. Способ видно при оформлении заказа.',
      uz: '💳 Toʻlov: buyurtma doʻkonga toʻlanadi — qabul qilishda yoki, agar doʻkon ulagan boʻlsa, Payme/Click orqali onlayn. Usul buyurtma rasmiylashtirishda koʻrinadi.',
      en: '💳 Pay the shop on delivery or online with Payme/Click if the shop supports it. Available payment methods are shown at checkout.',
    },
  },
  {
    id: 'return',
    words: /возврат|обмен|вернуть|не подош|брак|qaytar|almashtir|return|exchange|refund|defective/i,
    answer: {
      ru: '↩️ Возврат и обмен: оформляются через магазин-продавец по закону «О защите прав потребителей» — обмен товара надлежащего качества в течение 10 дней; косметика, парфюмерия, бельё и предметы гигиены обмену не подлежат, кроме брака. При споре платформа выступает медиатором между вами и магазином.',
      uz: '↩️ Qaytarish va almashtirish: sotuvchi doʻkon orqali «Isteʼmolchilar huquqlarini himoya qilish toʻgʻrisida»gi qonun boʻyicha — sifatli mahsulotni 10 kun ichida almashtirish mumkin; kosmetika, parfyumeriya, ichki kiyim va gigiyena buyumlari almashtirilmaydi (brakdan tashqari). Nizoda platforma siz bilan doʻkon oʻrtasida vositachi boʻladi.',
      en: '↩️ Returns and exchanges are handled by the seller under Uzbekistan’s consumer protection law. Some categories, including cosmetics, perfume, lingerie and hygiene products, cannot be exchanged unless defective. SEVIMLI can mediate disputes.',
    },
  },
  {
    id: 'howorder',
    words: /как\s+(заказ|купить|офор|добав)|корзин|оформ.*заказ|qanday.*(xarid|buyurtma|sotib)|how (?:do i|can i) (?:order|buy|shop|add)|place an order|add to (?:my )?cart/i,
    answer: {
      ru: '🛒 Как заказать: открываете товар → «В корзину» → в корзине проверяете и оформляете заказ. Можно добавить прямо из моего совета или из отзыва в сообществе. Для покупок вскладчину — «в корзину круга» Davra.',
      uz: '🛒 Buyurtma: mahsulotni ochasiz → «Savatga» → savatda tekshirib buyurtma berasiz. Mening tavsiyamdan yoki sharhdan ham qoʻshsa boʻladi. Birga xarid uchun — Davra doirasi savatiga.',
      en: '🛒 Open a product and tap “Add to cart”, then review your cart and place the order. You can also add items from recommendations or community posts. Use Davra to shop with friends.',
    },
  },
  {
    id: 'kbeauty',
    words: /k-?beauty|корейск|корея|koreys|koreya|korean (?:beauty|skincare)|korea/i,
    answer: {
      ru: '🇰🇷 K-beauty: корейская косметика от разных магазинов на одной площадке. Метку «100% оригинал» получают товары магазинов, подтвердивших происхождение документами; срок годности указан в карточке.',
      uz: '🇰🇷 K-beauty: turli doʻkonlarning koreys kosmetikasi bitta platformada. «100% original» belgisini kelib chiqishini hujjatlar bilan tasdiqlagan doʻkonlar mahsulotlari oladi; yaroqlilik muddati kartochkada.',
      en: '🇰🇷 K-beauty from different shops in one place. Shops that provide proof of origin can earn the “100% authentic” badge, and expiry information appears on each product page.',
    },
  },
  {
    id: 'salon',
    words: /салон|запис|маникюр|массаж|бров|макияж|укладк|salon|massaj|manikyur|book(?:ing)? (?:a )?salon|salon service|hair styling/i,
    answer: {
      ru: '💆 Салоны: в разделе «Салоны» выбираете услугу (маникюр, макияж, массаж, укладка) у салона и записываетесь онлайн — как обычный товар, через корзину.',
      uz: '💆 Salonlar: «Salonlar» boʻlimida salondan xizmat (manikyur, makiyaj, massaj) tanlab, onlayn yozilasiz — oddiy mahsulotdek savat orqali.',
      en: '💆 Choose a salon service such as a manicure, makeup, massage or hairstyling, then request a booking online. The salon will contact you to confirm.',
    },
  },
  {
    id: 'trust',
    words: /проверенн|надёжн|надежн|безопас|можно.*доверя|обман|ishonch|xavfsiz|verified|trust|safe|reliable/i,
    answer: {
      ru: '✅ Доверие: проверенные магазины отмечены значком, метку «100% оригинал» администратор включает после проверки документов магазина. В карточке виден срок годности — сверьте его с упаковкой при получении.',
      uz: '✅ Ishonch: tekshirilgan doʻkonlar belgi bilan ajratilgan, «100% original» belgisini administrator doʻkon hujjatlari tekshirilgach yoqadi. Kartochkada yaroqlilik muddati koʻrinadi — qabul qilishda uni qadoq bilan solishtiring.',
      en: '✅ Verified shops are marked. The “100% authentic” badge is awarded by an administrator after reviewing the shop’s documents. Check the expiry date against the package when your order arrives.',
    },
  },
  {
    id: 'about',
    words: /что\s+так(ое|ой)\s+sevimli|что\s+за\s+sevimli|кто\s+ты|что\s+(ты\s+)?умеешь|чем\s+помож|sevimli\s+nima|nima\s+qila|what is sevimli|what can you do|who are you/i,
    answer: {
      ru: '💗 Я Севиля — помощница SEVIMLI. SEVIMLI это «всё в одном» для женщин Узбекистана: магазины косметики и одежды, живое сообщество с отзывами, групповые покупки Davra, запись в салоны и лояльность. Помогаю подобрать уход и отвечаю на вопросы о площадке.',
      uz: '💗 Men Sevilyaman — SEVIMLI yordamchisi. SEVIMLI — ayollar uchun «hammasi birda»: kosmetika va kiyim doʻkonlari, sharhli hamjamiyat, Davra xaridlari, salonlarga yozilish va sodiqlik. Parvarish tanlashda yordam beraman.',
      en: '💗 I’m Sevilya, SEVIMLI’s assistant. SEVIMLI brings shops, community reviews, Davra group shopping, salon bookings and loyalty rewards together for women in Uzbekistan. I can help with skincare and questions about the platform.',
    },
  },
]

/** Ответ по площадке на свободный вопрос, если распознан интент. */
export function answerFaq(text: string, lang: Lang): string | null {
  const hit = FAQ_INTENTS.find((i) => i.words.test(text))
  return hit ? hit.answer[lang] : null
}
