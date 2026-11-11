# Baza testlari (pgTAP)

Bu papkadagi testlar bazaning o‘zidagi himoyani tekshiradi: RLS, tenant izolyatsiyasi,
ikki marta bron qilishni taqiqlash va bron holatlari mashinasi. Har bir fayl o‘z tranzaksiyasida
ishlaydi va oxirida `rollback` qiladi — bazada hech narsa qolmaydi.

| Fayl                             | Nimani tekshiradi                                                           |
| -------------------------------- | --------------------------------------------------------------------------- |
| `001_schema.test.sql`            | Har jadvalda RLS va siyosat bor, mijoz rollariga yozish huquqi yo‘q         |
| `002_rls.test.sql`               | Mijoz, egasi, menejer, host, xodim, admin kim nimani ko‘ra/o‘zgartira oladi |
| `003_booking_integrity.test.sql` | Bir stolga kesishgan vaqtga ikkinchi bron yo‘q, boshqa restoran stoli yo‘q  |
| `004_triggers.test.sql`          | Profil sinxronlash, oxirgi egani o‘chirmaslik, audit, holat o‘tishlari      |
| `_fixtures.psql`                 | Umumiy test ma’lumotlari (`\ir` bilan ulanadi, alohida ishga tushmaydi)     |

## Lokal ishga tushirish

Docker va Supabase CLI kerak.

```bash
supabase start       # lokal bazani ko‘taradi va barcha migratsiyalarni qo‘llaydi
supabase test db     # shu papkadagi *.sql testlarni pg_prove bilan ishga tushiradi
```

Migratsiya o‘zgargandan keyin: `supabase db reset`, so‘ng yana `supabase test db`.

## CI

GitHub Actions'dagi `db` job har push va pull request'da xuddi shu ikki buyruqni bajaradi
(`.github/workflows/ci.yml`).

## Yangi test yozish qoidalari

- Fayl `begin;` bilan boshlanadi va `rollback;` bilan tugaydi.
- Foydalanuvchi nomidan tekshirish: `set local role authenticated;` va
  `select set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true);`,
  keyin `reset role;`.
- Har bir yangi jadval uchun kamida: begona foydalanuvchi ko‘rmaydi, begona restoran xodimi
  ko‘rmaydi, mijoz rollari to‘g‘ridan-to‘g‘ri yoza olmaydi.
