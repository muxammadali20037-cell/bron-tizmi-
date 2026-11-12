# 0007. Kirish (SMS kod) va rollar

- Holat: qabul qilindi (2026-11-12), Sprint 3
- Bog‘liq: ADR 0006 (baza poydevori), `docs/runbooks/sms-login.md`
- Migratsiya: `supabase/migrations/20261111060000_auth_staff.sql`
- Testlar: `supabase/tests/005_auth_staff.test.sql`, `src/lib/auth/*.test.ts`,
  `supabase/functions/send-sms/lib.test.ts`

## Kontekst

O‘zbekistonda odamlar telefon raqam bilan kirishga o‘rganishgan; parol va e-pochta qo‘shimcha
to‘siq. Restoran jamoasida 4 xil rol bor (egasi, menejer, administrator, xodim), platformada esa
administrator. SMS pullik, shuning uchun uni suiiste’mol qilishdan (SMS pumping) himoya kerak.

## Qaror

1. **Kirish — telefon + 6 xonali SMS kod** (Supabase Auth, `signInWithOtp` / `verifyOtp`).
   Yangi raqam bilan birinchi kirishda hisob avtomatik ochiladi. Parol yo‘q.
2. **SMS Eskiz orqali**, Supabase "Send SMS Hook" → Edge Function `send-sms`.
   - So‘rov Standard Webhooks imzosi bilan tekshiriladi.
   - Faqat `+998` raqamlarga yuboriladi.
   - Raqam bo‘yicha limit bazada: 10 daqiqada 3, soatda 5, kunda 10 ta SMS
     (`public.register_sms_attempt`, faqat `service_role`). Raqam ochiq saqlanmaydi — SHA-256 izi, 2 kun.
   - Bundan tashqari Supabase'ning o‘z limitlari ishlaydi (raqamga 60 soniyada 1 ta, loyiha bo‘yicha soatlik).
3. **Sessiya cookie'da** (`@supabase/ssr`). `proxy.ts` har so‘rovda tokenni yangilaydi va
   `getClaims()` bilan imzosini tekshiradi.
4. **Ruxsat uch qatlamda:**
   - proxy — kirmagan foydalanuvchini himoyalangan bo‘limdan kirish sahifasiga yuboradi (qulaylik);
   - `src/lib/auth/dal.ts` — har sahifa va Server Action rol va a’zolikni tekshiradi;
   - baza — RLS va `security definer` funksiyalar chaqiruvchining rolini o‘zi tekshiradi.
     Interfeysdagi tugmalarni yashirish faqat qulaylik.
5. **Rollar:**
   - mijoz — har bir kirgan foydalanuvchi;
   - egasi, menejer, administrator (host), xodim — `staff_members` jadvalida, restoran bo‘yicha;
   - super admin — `platform_admins` jadvalida.

   Boshqarish qoidasi bazada (`private.can_manage_role`) va ilovada (`src/lib/auth/permissions.ts`)
   bir xil, buni test tekshiradi:
   - egasi hammani boshqaradi;
   - menejer faqat administrator va xodimni boshqaradi;
   - rollarni faqat egasi o‘zgartiradi;
   - o‘z rolini yoki holatini hech kim o‘zgartira olmaydi;
   - oxirgi faol egasini olib tashlab bo‘lmaydi (trigger).

6. **Xodim taklifi telefon raqam bo‘yicha.** Taklif 7 kun amal qiladi. Shu raqam bilan kirgan
   foydalanuvchi `/os` sahifasida qabul yoki rad etadi. Egasini taklif bilan berib bo‘lmaydi.
   Hozircha taklif haqida SMS yuborilmaydi — egasi xodimga o‘zi aytadi (Telegram bildirishnomalari Sprint 9'da).
7. **Onboarding:** ism, til va maxfiylik siyosatiga rozilik. Rozilik vaqtini baza o‘zi yozadi
   (`complete_onboarding`); foydalanuvchi uni API orqali o‘zgartira olmaydi.
8. **`?next=` faqat shu saytning ichki sahifasi** (`safeNextPath`) — boshqa saytga yo‘naltirish mumkin emas.

## Oqibatlar

- SMS ishlashi uchun Eskiz akkaunti (yuridik shaxs), tasdiqlangan SMS shabloni va Supabase'da
  hook sozlamasi kerak. Eskiz test rejimida faqat o‘zining test matnlarini yuboradi.
- Staging'da sinov uchun Supabase "test raqamlari" (belgilangan kod) ishlatiladi. Ular faqat staging'da bo‘ladi.
- Birinchi super admin SQL bilan qo‘shiladi (runbook'da).
- Shaxsiy ma’lumotlar Germaniyada (Supabase, Frankfurt). 2026-yil martdagi o‘zgarishlardan keyin
  bu umumiy ma’lumotlar uchun ruxsat etilgan mamlakatlar ro‘yxatiga kiradi; pilotdan oldin
  huquqshunos tasdiqlashi kerak.
