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

const SHOP_UZ: Record<string, string> = {
  s1: "Istanbuldan ayollar kiyimi va aksessuarlari. Har hafta yangi kolleksiyalar.",
  s2: 'Original koreys va Yevropa kosmetikasi.',
  s3: 'Ayollar uchun ichki kiyim va uy kiyimlari.',
  s4: "Go'zallik saloni: manikyur, qosh, makiyaj, massaj. Onlayn yozilish.",
  s5: "Chaqaloqlar uchun hamma narsa: kiyim, o'yinchoqlar, aravachalar.",
  s6: "Shinam uy uchun dekor va uy tekstili.",
  s7: "Koreys kosmetikasining rasmiy importi. 100% original, asllik kafolati, Toshkent bo'ylab bepul yetkazib berish.",
  s8: "Litsenziyalangan dorixona: vitaminlar, dermokosmetika, salomatlik mahsulotlari. Chatda farmatsevt maslahati.",
  s9: "Bozordagidek fermer mahsulotlari: asal, yong'oqlar, mavsumiy mevalar. Buyurtma kuni yetkazib berish.",
}

/** Название товара на текущем языке. */
export function productName(p: { id: string; name: string }, lang: Lang): string {
  return lang === 'uz' ? (PRODUCT_UZ[p.id]?.name ?? p.name) : p.name
}

/** Описание товара на текущем языке. */
export function productDesc(
  p: { id: string; description?: string | null },
  lang: Lang,
): string | null {
  const base = p.description ?? null
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
  return lang === 'uz' ? (CITY_UZ[city] ?? city) : city
}

/** Описание магазина на текущем языке. */
export function shopDesc(
  s: { id: string; description?: string | null },
  lang: Lang,
): string | null {
  const base = s.description ?? null
  return lang === 'uz' ? (SHOP_UZ[s.id] ?? base) : base
}
