import type { Lang } from '@/lib/i18n'

/**
 * Узбекские названия/описания демо-товаров и магазинов.
 * Названия-бренды (COSRX и т.п.) не переводятся — только описания.
 * При подключении реальной базы поля переедут в колонки name_uz/description_uz.
 */

const PRODUCT_UZ: Record<string, { name?: string; desc?: string }> = {
  p1: { name: "«Aurora» midi ko'ylagi", desc: "Viskozadan yengil ko'ylak, erkin bichim, midi uzunlik. Yoz uchun ideal." },
  p2: { name: '«Milano» ikki qismli kostyumi', desc: 'Pidjak va shim, kostyum matosi, pudra rangi.' },
  p3: { name: '«Bella» charm sumkasi', desc: 'Natural charm, sozlanadigan tasma.' },
  p4: { name: 'C vitaminli serum', desc: 'Yuz uchun yorqinlashtiruvchi serum, 30 ml.' },
  p5: { name: '«Nude 12» soyalar palitrasi', desc: '12 mat va shimmer rang.' },
  p6: { name: "Makiyaj cho'tkalari to'plami", desc: "G'ilofda 10 ta professional cho'tka." },
  p7: { name: "«Roza» ichki kiyim to'plami", desc: "To'rli to'plam, S–XL o'lchamlar." },
  p8: { name: 'Shoyi pijama', desc: "Sun'iy shoyidan uy kostyumi." },
  p9: { name: 'Chaqaloq kombinezoni', desc: 'Yumshoq paxta, 0–6 oy.' },
  p10: { name: 'Rivojlantiruvchi gilamcha', desc: "Ravoqlar va o'yinchoqli o'yin gilamchasi." },
  p11: { name: "«Cozy» to'qilgan pled", desc: 'Akrildan issiq pled, 150×200 sm.' },
  p12: { name: "Aromatik shamlar to'plami", desc: '3 ta sham: vanil, lavanda, sandal.' },
  p13: { name: "Bo'shashtiruvchi massaj, 60 daq", desc: 'Butun tana massaji seansi. Salon orqali yozilish.' },
  p14: { name: 'Manikyur + gel-lak qoplama', desc: 'Kompleks parvarish va qoplama.' },
  k1: { desc: '96% shilliqqurt mucinli essensiya. Namlash, tiklash, yaltiroqlik. 100 ml. Rasmiy original.' },
  k2: { desc: 'Guruch va probiotikli quyoshdan himoyalovchi yengil krem. Oq iz qoldirmaydi. 50 ml.' },
  k3: { desc: '77% xauttyuyniya ekstraktli tinchlantiruvchi toner. Sezgir teri uchun. 250 ml.' },
  k4: { desc: "Kislotalar va choy daraxtli toner-eksfoliant. Yallig'lanishga qarshi. 150 ml." },
  k5: { desc: '5D gialuron kislotali serum. Chuqur namlash. 50 ml.' },
  k6: { desc: "G'ovaklarni toraytiruvchi va yumshoq eksfoliatsiya qiluvchi padlar. 70 dona." },
  k7: { desc: 'Tekis teri rangi uchun niatsinamid va ekstraktli serum. 50 ml.' },
  k8: { desc: 'Tokto dengiz suvi va pantenolli namlovchi toner. 200 ml.' },
  p15: { name: '«Ivory» shoyi bluzkasi', desc: "Sun'iy shoyidan oquvchan bluzka, erkin bichim. S–XL." },
  p16: { name: '«Nilufar» plisse yubkasi', desc: 'Midi plisse yubka, yengil mato, belida rezinka.' },
  p17: { name: '«Grace» tuflisi', desc: 'Klassik tufli, 7 sm poshna, ekocharm. 35–40.' },
  p18: { name: '«Street» oq krossovkasi', desc: 'Har kun uchun universal oq krossovka. 35–41.' },
  p19: { name: '«Tashkent» kuzgi paltosi', desc: "Aralash jundan to'g'ri bichimli palto, kamari bilan. Kemel rang." },
  p20: { name: "«Atlas» shoyi ro'moli", desc: "Milliy naqshli natural shoyi ro'mol, 90×90 sm." },
  p21: { name: 'Volume Pro kiprik tushi', desc: "Hajm beruvchi tush, to'kilmaydi, 12 soat chidamli." },
  p22: { name: "Shi moyli qo'l kremi", desc: "Oziqlantiruvchi qo'l kremi, 75 ml. Yopishqoqlik qoldirmay singadi." },
  p23: { name: '«Oud Rose» parfyumi, 50 ml', desc: 'Sharqona ifor: atirgul, ud, vanil. 8+ soat chidamli.' },
  p24: { name: "Matoli niqoblar to'plami, 10 dona", desc: 'Aloe va gialuronli namlovchi matoli niqoblar.' },
  p25: { name: '«Zaytun» shoyi romperi', desc: "Sun'iy shoyidan uy romperi, kamari bilan, zaytun rang. S–XL." },
  p26: { name: "«Tinch» zig'ir pijamasi", desc: "Nafas oluvchi zig'ir, erkin bichim — issiq tunlar uchun. S–XL." },
  p27: { name: 'Kechki makiyaj', desc: "To'liq kechki obraz: ton, ko'zlar, lablar. Vizajist ishi, 60–90 daq." },
  p28: { name: 'Soch turmagi + parvarish', desc: 'Yuvish, parvarish niqobi va istalgan uzunlikdagi sochga turmak, 45–60 daq.' },
  p29: { name: "Yog'och konstruktor, 60 detal", desc: "Ekologik yog'och kubiklar, motorikani rivojlantiradi. 1,5 yoshdan." },
  p30: { name: "Bolalar bayram ko'ylagi", desc: "Fatin yubkali bashang ko'ylak. Bo'y 92–128 sm." },
  p31: { name: 'Bolalar plyush pledi', desc: 'Yumshoq plyush pled 100×120 sm. Elektrlanmaydi, mashinada yuviladi.' },
  p32: { name: "«Quyoncha» yumshoq o'yinchoq", desc: 'Plyush quyoncha 35 sm, gipoallergen tolali.' },
  p33: { name: '«Oq gul» keramik vazasi', desc: "Qo'l ishi, mat keramika, balandligi 25 sm." },
  p34: { name: "Satin choyshab to'plami, yevro", desc: "Premium satin, 4 jildli. O'ngmaydi, g'ijimlanmaydi." },
  p35: { name: '«Samarkand» gilami 160×230', desc: 'Sharqona naqshli gilam, kalta pat, oson tozalanadi.' },
  p36: { name: "Keramik idishlar to'plami, 12 predmet", desc: "4 kishilik ovqatlanish to'plami: tarelkalar, salat idishlari, krujkalar." },
  p37: { name: 'Omega-3 1000 mg, 60 kapsula', desc: 'Yuqori tozalikdagi baliq moyi. Yurak, teri va soch uchun.' },
  p38: { name: 'Soch va tirnoq vitaminlari, 30 tab.', desc: "Biotin, rux va selen. Bir oylik kurs — mustahkam tirnoq va yaltiroq soch uchun." },
  p39: { name: 'Sezgir teri uchun dorixona kremi', desc: 'Hidsiz dermokosmetika, teri baryerini tiklaydi. 50 ml.' },
  p40: { name: 'D3 vitamini 2000 XB, 90 kapsula', desc: 'Immunitet va kayfiyat uchun. Kuniga 1 kapsuladan.' },
  p41: { name: "Tog' asali, 0,5 kg", desc: "Shu yilgi hosildan natural tog' asali. Shakar va qo'shimchalarsiz." },
  p42: { name: 'Pushti pomidor, 1 kg', desc: 'Toshkent viloyati fermalaridan mavsumiy pushti pomidor. Shirin, seret.' },
  p43: { name: "Ko'k choy №95, 200 g", desc: "Klassik o'zbek ko'k choyi, yirik barg." },
  p44: { name: 'Mavsumiy anor, 1 kg', desc: 'Quvadan shirin anorlar. Saralangan mevalar, sharbati — yoqut.' },
}

const PRODUCT_EN: Record<string, { name?: string; desc?: string }> = {
  p1: { name: '“Aurora” midi dress', desc: 'Lightweight viscose, relaxed fit and midi length. Perfect for summer.' },
  p2: { name: '“Milano” two-piece suit', desc: 'Blazer and trousers in soft blush suiting fabric.' },
  p3: { name: '“Bella” leather bag', desc: 'Genuine leather with an adjustable strap.' },
  p4: { name: 'Vitamin C serum', desc: 'Brightening facial serum, 30 ml.' },
  p5: { name: '“Nude 12” eyeshadow palette', desc: '12 matte and shimmer shades.' },
  p6: { name: 'Makeup brush set', desc: '10 professional brushes in a case.' },
  p7: { name: '“Roza” lingerie set', desc: 'Lace set, sizes S–XL.' },
  p8: { name: 'Silk-look pajamas', desc: 'Lounge set made from soft satin.' },
  p9: { name: 'Newborn romper', desc: 'Soft cotton, sizes 0–6 months.' },
  p10: { name: 'Activity play mat', desc: 'Play mat with arches and toys.' },
  p11: { name: '“Cozy” knitted blanket', desc: 'Warm acrylic blanket, 150×200 cm.' },
  p12: { name: 'Scented candle set', desc: 'Three candles: vanilla, lavender and sandalwood.' },
  p13: { name: 'Relaxing massage, 60 min', desc: 'Full-body massage session. Book through the salon.' },
  p14: { name: 'Manicure with gel polish', desc: 'Complete nail care and gel polish.' },
  k1: { desc: 'Essence with 96% snail mucin for hydration, skin support and radiance. 100 ml.' },
  k2: { desc: 'Light sunscreen with rice and probiotics. No white cast. 50 ml.' },
  k3: { desc: 'Soothing toner with 77% heartleaf extract for sensitive skin. 250 ml.' },
  k4: { desc: 'Exfoliating toner with acids and tea tree. 150 ml.' },
  k5: { desc: 'Serum with 5D hyaluronic acid for deep hydration. 50 ml.' },
  k6: { desc: 'Gentle exfoliating toner pads to help refine the look of pores. 70 pads.' },
  k7: { desc: 'Serum with niacinamide and botanical extracts for a more even-looking tone. 50 ml.' },
  k8: { desc: 'Hydrating toner with Dokdo deep-sea water and panthenol. 200 ml.' },
  p15: { name: '“Ivory” silk-look blouse', desc: 'Flowy blouse with a relaxed fit. Sizes S–XL.' },
  p16: { name: '“Nilufar” pleated midi skirt', desc: 'Lightweight pleated midi skirt with an elastic waist.' },
  p17: { name: '“Grace” pumps', desc: 'Classic pumps with a 7 cm heel. Sizes 35–40.' },
  p18: { name: '“Street” white sneakers', desc: 'Everyday white sneakers. Sizes 35–41.' },
  p19: { name: '“Tashkent” autumn coat', desc: 'Straight-cut wool blend coat with a belt, in camel.' },
  p20: { name: '“Atlas” silk scarf', desc: 'Natural silk scarf with a traditional pattern, 90×90 cm.' },
  p21: { name: 'Volume Pro mascara', desc: 'Volumizing mascara with up to 12-hour wear.' },
  p22: { name: 'Shea butter hand cream', desc: 'Nourishing hand cream, 75 ml. Absorbs without a sticky feel.' },
  p23: { name: '“Oud Rose” perfume, 50 ml', desc: 'An oriental blend of rose, oud and vanilla. 8+ hour wear.' },
  p24: { name: 'Sheet mask set, 10 pcs', desc: 'Hydrating sheet masks with aloe and hyaluronic acid.' },
  p25: { name: '“Zaytun” satin romper', desc: 'Olive satin lounge romper with a belt. Sizes S–XL.' },
  p26: { name: '“Tinch” linen pajamas', desc: 'Breathable linen and a relaxed fit for warm nights. Sizes S–XL.' },
  p27: { name: 'Evening makeup', desc: 'Full evening look: complexion, eyes and lips. 60–90 min.' },
  p28: { name: 'Hair styling and care', desc: 'Wash, conditioning mask and styling for any hair length. 45–60 min.' },
  p29: { name: 'Wooden building blocks, 60 pcs', desc: 'Eco-friendly wooden blocks to help develop motor skills. Ages 18 months+.' },
  p30: { name: 'Girls’ party dress', desc: 'Festive dress with a tulle skirt. Heights 92–128 cm.' },
  p31: { name: 'Kids’ plush blanket', desc: 'Soft 100×120 cm blanket. Machine washable and non-static.' },
  p32: { name: '“Bunny” plush toy', desc: '35 cm plush bunny with hypoallergenic filling.' },
  p33: { name: '“Oq gul” ceramic vase', desc: 'Handmade matte ceramic, 25 cm tall.' },
  p34: { name: 'Euro satin bedding set', desc: 'Premium satin, four pieces. Fade- and wrinkle-resistant.' },
  p35: { name: '“Samarkand” rug, 160×230 cm', desc: 'Oriental pattern with a low pile for easy cleaning.' },
  p36: { name: 'Ceramic dinnerware set, 12 pcs', desc: 'Service for four: plates, salad bowls and mugs.' },
  p37: { name: 'Omega-3 1000 mg, 60 capsules', desc: 'High-purity fish oil. 60 capsules.' },
  p38: { name: 'Hair and nail vitamins, 30 tablets', desc: 'Biotin, zinc and selenium for a one-month course.' },
  p39: { name: 'Pharmacy cream for sensitive skin', desc: 'Fragrance-free dermocosmetic cream to support the skin barrier. 50 ml.' },
  p40: { name: 'Vitamin D3 2000 IU, 90 capsules', desc: '90 capsules. Take one per day as directed on the package.' },
  p41: { name: 'Mountain honey, 0.5 kg', desc: 'Natural mountain honey from this year’s harvest, with no added sugar.' },
  p42: { name: 'Pink tomatoes, 1 kg', desc: 'Seasonal tomatoes from farms in Tashkent region.' },
  p43: { name: 'Uzbek green tea No. 95, 200 g', desc: 'Classic Uzbek loose-leaf green tea.' },
  p44: { name: 'Seasonal pomegranates, 1 kg', desc: 'Sweet pomegranates from Quva, hand selected.' },
}

const PRODUCT_EN_BY_NAME: Record<string, { name: string; desc?: string }> = {
  'Сыворотка с витамином C': { name: 'Vitamin C serum', desc: 'Brightening facial serum, 30 ml.' },
  'Палетка теней «Nude 12»': { name: '“Nude 12” eyeshadow palette', desc: '12 matte and shimmer shades.' },
  'Комплект белья «Роза»': { name: '“Roza” lace lingerie set', desc: 'Lace set, sizes S–XL.' },
  'Комбинезон для новорождённых': { name: 'Newborn romper', desc: 'Soft cotton, sizes 0–6 months.' },
  'Набор свечей ароматических': { name: 'Scented candle set', desc: 'Three candles: vanilla, lavender and sandalwood.' },
  'Набор кистей для макияжа': { name: 'Makeup brush set', desc: '10 professional brushes in a case.' },
  'Маникюр + покрытие гель-лак': { name: 'Manicure with gel polish', desc: 'Complete nail care and gel polish.' },
  'Блузка шёлковая «Ivory»': { name: '“Ivory” silk-look blouse', desc: 'Flowy blouse with a relaxed fit. Sizes S–XL.' },
  'Платье миди «Aurora»': { name: '“Aurora” midi dress', desc: 'Lightweight viscose, relaxed fit and midi length. Perfect for summer.' },
  'Пижама льняная «Tinch»': { name: '“Tinch” linen pajamas', desc: 'Breathable linen and a relaxed fit for warm nights. Sizes S–XL.' },
  'Успокаивающий тонер с экстрактом хауттюйнии 77%': {
    name: 'Anua Heartleaf 77% Soothing Toner',
    desc: 'Soothing toner with 77% heartleaf extract for sensitive skin. 250 ml.',
  },
  'Парфюм «Oud Rose» 50 мл': {
    name: '“Oud Rose” perfume, 50 ml',
    desc: 'An oriental blend of rose, oud and vanilla. 8+ hour wear.',
  },
  'Мёд горный, 0,5 кг': {
    name: 'Mountain honey, 0.5 kg',
    desc: 'Natural mountain honey from this year’s harvest, with no added sugar.',
  },
  'Развивающий коврик': { name: 'Activity play mat', desc: 'Play mat with arches and toys.' },
  'Плед вязаный «Cozy»': {
    name: '“Cozy” knitted blanket',
    desc: 'Warm acrylic blanket, 150×200 cm.',
  },
  'COSRX Advanced Snail 96 Mucin Power Essence': {
    name: 'COSRX Advanced Snail 96 Mucin Power Essence',
    desc: 'Essence with 96% snail mucin for hydration, skin support and radiance. 100 ml.',
  },
  'Beauty of Joseon Relief Sun SPF50+ PA++++': {
    name: 'Beauty of Joseon Relief Sun SPF50+ PA++++',
    desc: 'Light sunscreen with rice and probiotics. No white cast. 50 ml.',
  },
  'Anua Heartleaf 77% Soothing Toner': {
    name: 'Anua Heartleaf 77% Soothing Toner',
    desc: 'Soothing toner with 77% heartleaf extract for sensitive skin. 250 ml.',
  },
  'SOME BY MI AHA-BHA-PHA 30 Days Miracle Toner': {
    name: 'SOME BY MI AHA-BHA-PHA 30 Days Miracle Toner',
    desc: 'Exfoliating toner with acids and tea tree. 150 ml.',
  },
  'Torriden DIVE-IN Low Molecular Hyaluronic Serum': {
    name: 'Torriden DIVE-IN Low Molecular Hyaluronic Serum',
    desc: 'Serum with 5D hyaluronic acid for deep hydration. 50 ml.',
  },
  'medicube Zero Pore Pad 2.0': {
    name: 'medicube Zero Pore Pad 2.0',
    desc: 'Gentle exfoliating toner pads to help refine the look of pores. 70 pads.',
  },
  'numbuzin No.3 Skin Softening Serum': {
    name: 'numbuzin No.3 Skin Softening Serum',
    desc: 'Serum with niacinamide and botanical extracts for a more even-looking tone. 50 ml.',
  },
  'ROUND LAB 1025 Dokdo Toner': {
    name: 'ROUND LAB 1025 Dokdo Toner',
    desc: 'Hydrating toner with Dokdo deep-sea water and panthenol. 200 ml.',
  },
}

const SHOP_UZ: Record<string, string> = {
  s1: "Istanbuldan ayollar kiyimi va aksessuarlari. Har hafta yangi kolleksiyalar.",
  s2: 'Original koreys va Yevropa kosmetikasi.',
  s3: 'Ayollar uchun ichki kiyim va uy kiyimlari.',
  s4: "Go'zallik saloni: manikyur, qosh, makiyaj, massaj. Onlayn yozilish.",
  s5: "Chaqaloqlar uchun hamma narsa: kiyim, o'yinchoqlar, aravachalar.",
  s6: "Shinam uy uchun dekor va uy tekstili.",
  s7: "Koreys kosmetikasi importi: mahsulot kelib chiqishi hujjatlar bilan tasdiqlangan (demo-do'kon).",
  s8: "Litsenziyalangan dorixona: vitaminlar, dermokosmetika, salomatlik mahsulotlari. Chatda farmatsevt maslahati.",
  s9: "Bozordagidek fermer mahsulotlari: asal, yong'oqlar, mavsumiy mevalar. Buyurtma kuni yetkazib berish.",
}

const SHOP_EN: Record<string, string> = {
  s1: 'Women’s clothing and accessories from Istanbul. New collections every week.',
  s2: 'Authentic Korean and European beauty products.',
  s3: 'Lingerie and loungewear for women.',
  s4: 'Beauty salon offering manicures, brows, makeup and massage. Book online.',
  s5: 'Everything for little ones: clothing, toys and strollers.',
  s6: 'Home decor and textiles for a cozy space.',
  s7: 'Korean beauty imports with product origin confirmed by documents (demo shop).',
  s8: 'Licensed pharmacy offering vitamins, dermocosmetics and wellness products. Ask a pharmacist in chat.',
  s9: 'Market-style farm goods: honey, nuts and seasonal fruit. Same-day delivery.',
}

/** Название товара на текущем языке. */
export function productName(p: { id: string; name: string }, lang: Lang): string {
  if (lang === 'en') return PRODUCT_EN[p.id]?.name ?? PRODUCT_EN_BY_NAME[p.name]?.name ?? p.name
  return lang === 'uz' ? (PRODUCT_UZ[p.id]?.name ?? p.name) : p.name
}

/** Описание товара на текущем языке. */
export function productDesc(
  p: { id: string; name?: string; description?: string | null },
  lang: Lang,
): string | null {
  const base = p.description ?? null
  if (lang === 'en') return PRODUCT_EN[p.id]?.desc ?? PRODUCT_EN_BY_NAME[p.name ?? '']?.desc ?? base
  return lang === 'uz' ? (PRODUCT_UZ[p.id]?.desc ?? base) : base
}

const CITY_UZ: Record<string, string> = {
  Ташкент: 'Toshkent',
  Самарканд: 'Samarqand',
  Бухара: 'Buxoro',
  Наманган: 'Namangan',
}

/** Название города на текущем языке. */
export function cityName(city: string, lang: Lang): string {
  if (lang === 'en') {
    const cityEn: Record<string, string> = {
      Ташкент: 'Tashkent', Самарканд: 'Samarkand', Бухара: 'Bukhara', Наманган: 'Namangan',
    }
    return cityEn[city] ?? city
  }
  return lang === 'uz' ? (CITY_UZ[city] ?? city) : city
}

/** Страны производства: значение хранится по-русски (так `/korean` находит «Корея»). */
export const COUNTRIES: { value: string; uz: string; en: string }[] = [
  { value: 'Корея', uz: 'Koreya', en: 'Korea' },
  { value: 'Япония', uz: 'Yaponiya', en: 'Japan' },
  { value: 'Китай', uz: 'Xitoy', en: 'China' },
  { value: 'Турция', uz: 'Turkiya', en: 'Türkiye' },
  { value: 'Россия', uz: 'Rossiya', en: 'Russia' },
  { value: 'Узбекистан', uz: "O'zbekiston", en: 'Uzbekistan' },
  { value: 'Франция', uz: 'Fransiya', en: 'France' },
  { value: 'Италия', uz: 'Italiya', en: 'Italy' },
  { value: 'Германия', uz: 'Germaniya', en: 'Germany' },
  { value: 'США', uz: 'AQSh', en: 'USA' },
]

/** Название страны на текущем языке. */
export function countryName(country: string, lang: Lang): string {
  if (lang === 'en') return COUNTRIES.find((c) => c.value === country)?.en ?? country
  if (lang !== 'uz') return country
  return COUNTRIES.find((c) => c.value === country)?.uz ?? country
}

/** Описание магазина на текущем языке. */
export function shopDesc(
  s: { id: string; description?: string | null },
  lang: Lang,
): string | null {
  const base = s.description ?? null
  if (lang === 'en') return SHOP_EN[s.id] ?? base
  return lang === 'uz' ? (SHOP_UZ[s.id] ?? base) : base
}
