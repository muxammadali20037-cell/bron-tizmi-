# 0003. Brend: SOFRIVA

- Holat: qabul qilindi (2026-11-11)
- Bog‘liq: 0004 (design tokenlar)

## Kontekst

Loyiha "OneTable" ishchi nomi bilan boshlangan. Egasi yangi brend nomini — SOFRIVA — va master
prompt'ni berdi. Nom va slogan hali huquqiy tekshiruvdan o‘tmagan.

## Qaror

- Ishchi nom: **SOFRIVA**. Slogan: **"Every Table. Better Connected."** (master prompt'dan).
- Nom, slogan, rang va logotip varianti bitta faylda: `src/config/brand.ts`. Nom o‘zgarsa,
  shu fayl va tarjima fayllaridagi `{brand}` atrofidagi matnlar tekshiriladi.
- Til cookie'si: `sofriva_locale` (avval `onetable_locale`).
- Logotip: noldan chizilgan S monogramma, 3 variant (`ring`, `dots`, `sofra`). S harfi ikki teng
  yoydan quriladi (markazlar 32;23 va 32;41, radius 9). Egasi bittasini tanlaguncha `ring`
  ishlatiladi; tanlovdan keyin qolgan ikkitasi o‘chiriladi.
- Egasi yuborgan namunaviy rasmlardagi logotiplar, brend nomlari va raqamlar ishlatilmaydi
  (masalan, "1M+ Happy Guests", "5K+ Restaurants" — haqiqiy ma’lumot emas).
- Domen hali sotib olinmagan, kodda yozilmaydi.

## Oqibatlar

- Huquqiy tekshiruv salbiy bo‘lsa, nomni almashtirish bitta konfiguratsiya va tarjima fayllari bilan
  cheklanadi.
- Slogan hozircha uchala tilda inglizcha qoladi; uz/ru varianti egasi tasdiqlagach qo‘shiladi.
