# Claude uchun topshiriq — Telegram Guard Phase 0

Sen senior Python security engineer sifatida ishlaysan. Ushbu repozitoriyni avval to‘liq o‘rgan, keyin faqat Phase 0 doirasida ishlagin.

## Maqsad
Telegram akkaunt egasining ruxsati bilan ishlaydigan, manual tasdiqli xavfsizlik monitoringi mahsulotining xavfsiz boshlang‘ich karkasini tayyorlash.

## Qat'iy cheklovlar
- Phase 0 da Telegram'ga ulanma.
- Login kodi, 2FA paroli yoki session faylini so‘rama va yaratma.
- `.env` qiymatlarini hech qachon logga chiqarma.
- `AUTO_TERMINATE_SESSIONS` qiymatini `false` holatida saqla.
- Hech qanday yashirin kuzatuv, boshqa akkauntga kirish, phishing yoki himoyani chetlab o‘tish funksiyasini qo‘shma.
- Mavjud fayllarni o‘qimasdan ustidan yozma.
- Har bir o‘zgarishdan so‘ng testlarni ishga tushir va natijani ayt.

## Vazifalar
1. Barcha fayllarni ko‘rib chiq.
2. `telegram-guard doctor`, `telegram-guard config-check` buyruqlarini tekshir.
3. Testlarni ishga tushir.
4. Aniqlangan xatolarni tuzat.
5. README'dagi buyruqlarni real holatga mos saqla.
6. Yakunda o‘zgartirilgan fayllar, test natijasi va Phase 1 uchun bloklovchi masalalarni sanab ber.

## Phase 1 ga o‘tishdan oldin
Avval foydalanuvchidan alohida rozilik ol. Phase 1 faqat Telegram API orqali akkaunt egasining o‘z akkauntiga read-only ulanishni amalga oshiradi. Sessiyani tugatish funksiyasi keyinroq alohida tasdiqlanadi.
