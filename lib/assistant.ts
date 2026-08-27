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

/** Разбор свободного вопроса: находим тип кожи и задачу, если упомянуты. */
export function parseFreeText(text: string): { skin: SkinType | null; concern: Concern | null } {
  const concern = KEYWORDS.find((k) => k.words.test(text))?.concern ?? null
  const skin = SKIN_KEYWORDS.find((k) => k.words.test(text))?.skin ?? null
  return { skin, concern }
}
