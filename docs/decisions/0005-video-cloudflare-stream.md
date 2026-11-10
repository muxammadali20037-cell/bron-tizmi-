# 0005. Restoran videolari: Cloudflare Stream

- Holat: qabul qilindi (2026-11-11); amalga oshirish Sprint 6'da
- Bog‘liq: master prompt, 2-bo‘lim "Visual Venue Experience"

## Kontekst

Master prompt MVP'da restoran, zal va bolalar maydonchasi videolarini talab qiladi va ular mobil
qurilmada tez ochilishi kerak. Supabase Storage videoni siqmaydi (transcoding yo‘q) va bepul
rejada bitta fayl 50 MB bilan cheklangan.

## Ko‘rib chiqilgan variantlar

1. Cloudflare Stream — yuklangan video avtomatik turli sifatlarga siqiladi (HLS/DASH).
   Narx (2026-11-11 holatiga, rasmiy sahifa): har 1000 daqiqa saqlash uchun oyiga $5,
   har 1000 daqiqa ko‘rish uchun $1; yuklash va kodlash bepul.
2. Supabase Storage'da qisqa MP4 — qo‘shimcha xizmat yo‘q, lekin mobil internetda sekin.
3. MVP'da faqat foto — master prompt talabiga zid.

## Qaror

Variant 1 — Cloudflare Stream. Egasi tanladi.

## Amalga oshirish qoidalari (Sprint 6)

- Restoran xodimi videoni to‘g‘ridan-to‘g‘ri Cloudflare'ga yuklaydi (bir martalik yuklash havolasi
  serverda yaratiladi; API token faqat serverda).
- Video holati webhook orqali yangilanadi; webhook imzosi tekshiriladi.
- `restaurant_media` jadvalida faqat video identifikatori, davomiyligi, poster va moderatsiya holati.
- Davomiylik va hajm chegarasi serverda tekshiriladi; poster rasmi sahifa tez ochilishi uchun.
