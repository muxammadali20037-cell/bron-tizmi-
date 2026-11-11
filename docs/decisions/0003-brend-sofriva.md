# 0003. Brend: SOFRIVA

- Holat: qabul qilindi (2026-11-11)
- Bog‘liq: 0004 (design tokenlar)

## Kontekst

Loyiha "OneTable" ishchi nomi bilan boshlangan. Egasi yangi brend nomini — SOFRIVA — va master
prompt'ni berdi. Nom va slogan hali huquqiy tekshiruvdan o‘tmagan.

## Qaror

- Ishchi nom: **SOFRIVA**. Slogan: **"Every Table. Better Connected."** (master prompt'dan).
- Nom, slogan va ranglar bitta faylda: `src/config/brand.ts`. Nom o‘zgarsa,
  shu fayl va tarjima fayllaridagi `{brand}` atrofidagi matnlar tekshiriladi.
- Til cookie'si: `sofriva_locale` (avval `onetable_locale`).
- Logotip: egasi buyurtma qilib chizdirgan S monogramma (egasi 2026-11-11 da tasdiqladi:
  logotip uning buyurtmasi bilan chizilgan). Vektor shakli egasi yuborgan rasmdan avtomatik
  chizib olindi (`src/components/shared/logo-path.ts`, `public/brand/*.svg`). Och fonda Deep Forest,
  to‘q fonda Muted Gold rangda. Sprint 1'da noldan chizilgan 3 ta vaqtinchalik variant bekor qilindi.
- Dizaynerdan asl vektor fayl (SVG, AI yoki PDF) olinganda `logo-path.ts` almashtiriladi: chop
  etish va tovar belgisini ro‘yxatdan o‘tkazish uchun asl fayl kerak. Mualliflik huquqini
  egasiga o‘tkazish haqidagi hujjatni dizaynerdan olish tavsiya etiladi.
- Egasi ilhom uchun yuborgan boshqa rasmlardagi logotiplar, brend nomlari va raqamlar
  ishlatilmaydi (masalan, "1M+ Happy Guests", "5K+ Restaurants" — haqiqiy ma’lumot emas).
- Domen hali sotib olinmagan, kodda yozilmaydi.

## Oqibatlar

- Huquqiy tekshiruv salbiy bo‘lsa, nomni almashtirish bitta konfiguratsiya va tarjima fayllari bilan
  cheklanadi.
- Slogan hozircha uchala tilda inglizcha qoladi; uz/ru varianti egasi tasdiqlagach qo‘shiladi.
