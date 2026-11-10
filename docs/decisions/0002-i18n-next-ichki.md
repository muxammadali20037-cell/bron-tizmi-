# 0002. Tarjima uchun Next.js'ning o‘z vositalari

- Sana: 2026-11-11
- Holat: Qabul qilindi

## Qaror

Arxitektura hujjatida `next-intl` rejalashtirilgan edi. Uning o‘rniga Next.js 16'ning o‘rnatilgan usuli
ishlatiladi: `app/[locale]` root segmenti, `next/root-params` orqali til, JSON lug‘atlar va `proxy.ts`
orqali til yo‘naltirish.

## Sabab

- Qo‘shimcha kutubxona yo‘q — Next.js versiyasi yangilanganda moslik muammosi kamroq.
- Lug‘atlar faqat serverda yuklanadi, brauzerga JavaScript sifatida yuborilmaydi.
- Uch til, oddiy matnlar — murakkab ko‘plik (plural) qoidalari kerak bo‘lsa, `Intl.PluralRules` yetadi.

## Natija

- Til tanlash tartibi: URL → saqlangan cookie (`onetable_locale`) → brauzer tili → o‘zbekcha.
- Cookie faqat haqiqiy sahifa ochilishida yoki til tugmasi bosilganda yoziladi (prefetch yozmaydi).
- Uch lug‘atning kalitlari bir xilligini TypeScript va unit test tekshiradi.
