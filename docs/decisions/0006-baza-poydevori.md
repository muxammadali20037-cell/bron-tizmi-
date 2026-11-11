# 0006. Baza poydevori: tenant izolyatsiyasi, RLS va bron himoyasi

- Holat: qabul qilindi (2026-11-11), Sprint 2'da amalga oshirildi
- Bog‘liq: ADR 0001 (stack), "SOFRIVA — Audit, Product Architecture va MVP reja" (DB bo‘limi)
- Migratsiyalar: `supabase/migrations/20261111044933_…` — `20261111045832_…`
- Testlar: `supabase/tests/` (pgTAP, 98 ta tekshiruv)

## Kontekst

SOFRIVA'da bir bazada ko‘p restoran bor. Bir restoran xodimi boshqa restoran ma’lumotini ko‘rmasligi,
bitta stol bir vaqtda ikki marta band qilinmasligi va mijoz ilovasi bazani chetlab o‘ta olmasligi kerak.
Bu qoidalar faqat frontend yoki server kodida bo‘lsa, bitta xato butun himoyani buzadi.

## Qaror

1. **Restoran identifikatori har bir ichki jadvalda.** `restaurant_id` filial, zal, stol, bron,
   media va boshqa jadvallarda takrorlanadi va tarkibli tashqi kalit bilan bog‘lanadi, masalan
   `(branch_id, restaurant_id) → restaurant_branches(id, restaurant_id)`. Natijada boshqa restoranning
   zali yoki stoliga havola qilib bo‘lmaydi — baza buni o‘zi rad etadi (23503).
2. **Yordamchi funksiyalar `private` sxemasida.** `is_super_admin`, `has_restaurant_role`,
   `is_restaurant_member`, `is_reservation_customer` va boshqalar API orqali ochilmaydi,
   `security definer` va `search_path = ''` bilan yozilgan.
3. **RLS hamma jadvalda, ruxsat ustun darajasida.** `anon`/`authenticated` rollaridan barcha
   huquqlar olib tashlanadi, keyin faqat kerakli `select` va ayrim ustunlarga `update/insert`
   qaytariladi. Yangi jadval avtomatik huquq olmaydi (default privileges bekor qilingan).
   Siyosatlarda `(select auth.uid())` ishlatiladi (har qatorda qayta hisoblanmaydi).
4. **Bron va uning bog‘liq jadvallariga mijoz to‘g‘ridan-to‘g‘ri yoza olmaydi.** `reservations`,
   `reservation_guests`, `reservation_status_history`, `table_allocations` uchun faqat `select`.
   Yozish Sprint 7'dagi server funksiyasi (`create_reservation` va boshqalar) orqali bo‘ladi.
5. **Ikki marta bron qilishni baza taqiqlaydi.**
   `table_allocations` jadvalida `exclude using gist (table_id with =, period with &&) where (active)`.
   Oraliqlar `tstzrange` `[)`: 19:00–21:00 va 21:00–23:00 kesishmaydi.
6. **Bron holatlari bazada tekshiriladi.** Trigger ruxsat etilmagan o‘tishni rad etadi, vaqt
   belgilarini (`confirmed_at`, `cancelled_at`, …) qo‘yadi, tarixni yozadi va yakuniy holatda
   stol bandligini o‘chiradi. O‘tishlar jadvali `src/lib/booking/statuses.ts` bilan bir xil —
   buni ikki tomonlama test tekshiradi (pgTAP va Vitest).
7. **Ko‘p tilli matn `jsonb` `{"uz","ru","en"}`**, `private.is_i18n_text` bilan tekshiriladi;
   telefonlar E.164 formatida (`private.is_e164`).
8. **Faqat server ishlatadigan jadvallar** (`notifications`) uchun aniq "hech narsa mumkin emas"
   siyosati yoziladi — niyat ko‘rinib turishi uchun.
9. **Muhim o‘zgarishlar audit jurnaliga** (`audit_logs`) trigger orqali yoziladi.

## Oqibatlar

- Server kodidagi xato boshqa restoranning ma’lumotini ochib qo‘ya olmaydi: RLS va tarkibli
  kalitlar ikkinchi himoya qatori.
- Har yangi jadvalga RLS va grant qo‘lda yoziladi; `001_schema` testi RLS'siz yoki siyosatsiz
  jadval qolsa yiqiladi.
- Sxema o‘zgarishi faqat migratsiya orqali. Staging bazasi (`sofriva-staging`) va lokal test bazasi
  bir xil migratsiyalardan quriladi; sxema izi (fingerprint) mos kelishi tekshirildi.
- PostGIS hozircha o‘rnatilmadi: MVP'da masofa bo‘yicha qidiruv yo‘q, koordinatalar oddiy
  `latitude/longitude` ustunlarida. Kerak bo‘lsa, alohida migratsiya bilan qo‘shiladi.
- Production uchun alohida Supabase loyihasi pilotdan oldin ochiladi; hozir Vercel'dagi barcha
  muhitlar staging bazasiga ulangan.
