# SMS orqali kirishni yoqish (Supabase + Eskiz)

Bu qadamlar Supabase Dashboard va Eskiz kabinetida bir marta bajariladi. Kod tayyor:
Edge Function `send-sms` va bazadagi limit funksiyasi (`register_sms_attempt`).

Loyiha: `sofriva-staging` (`odieckgsvrigbmblnjqw`).

## 1. Eskiz (haqiqiy SMS uchun)

1. eskiz.uz'da yuridik shaxs nomidan ro‘yxatdan o‘ting va akkauntni faollashtiring.
   Test rejimida Eskiz faqat o‘zining test matnlarini yuboradi — kirish kodi bormaydi.
2. SMS shablonini moderatsiyaga yuboring. Matn kodda ishlatiladigan bilan aynan bir xil bo‘lsin:
   `SOFRIVA: kirish kodi 123456. Kodni hech kimga bermang.`
   Boshqa matn tasdiqlansa, uni `SMS_TEMPLATE` sirida `{code}` bilan yozing.
3. Jo‘natuvchi nomi (masalan `SOFRIVA`) tasdiqlansa — `ESKIZ_FROM` sirida yozing (standart `4546`).

## 2. Supabase: telefon orqali kirish

Dashboard → **Authentication → Sign In / Providers → Phone**:

- **Enable Phone provider** — yoqing.
- SMS provider (Twilio va boshqalar) — tanlamang; SMS hook orqali ketadi.
- **Phone confirmations** — yoqilgan qolsin.
- OTP uzunligi 6, amal qilish muddati — 300 soniya (5 daqiqa) tavsiya etiladi.

## 3. Supabase: Send SMS Hook

Dashboard → **Authentication → Hooks → Add hook → Send SMS hook**:

- Turi: **HTTPS**
- URL: `https://odieckgsvrigbmblnjqw.supabase.co/functions/v1/send-sms`
- **Generate secret** → hosil bo‘lgan `v1,whsec_...` kalitni nusxalang → **Create**.

## 4. Supabase: Edge Function sirlari

Dashboard → **Edge Functions → Secrets** (yoki **Project Settings → Edge Functions**):

| Nomi                   | Qiymat                                      |
| ---------------------- | ------------------------------------------- |
| `SEND_SMS_HOOK_SECRET` | 3-qadamdagi `v1,whsec_...`                  |
| `ESKIZ_EMAIL`          | Eskiz kabinet login (e-pochta)              |
| `ESKIZ_PASSWORD`       | Eskiz kabinet paroli                        |
| `ESKIZ_FROM`           | ixtiyoriy, tasdiqlangan jo‘natuvchi nomi    |
| `SMS_TEMPLATE`         | ixtiyoriy, `{code}` bilan tasdiqlangan matn |

Sirlarni hech qachon kodga, chatga yoki GitHub'ga yozmang.

## 5. Staging: test raqamlari (Eskiz tayyor bo‘lguncha)

**Phone** sozlamasida **Test Phone Numbers and OTPs**:
`998XXXXXXXXX=123456` (raqam `+`siz). Bu raqamlarga SMS ketmaydi — belgilangan kod ishlaydi.
Muddatini qisqa qo‘ying va production loyihada test raqam bo‘lmasin.

## 6. Limitlar

**Authentication → Rate Limits**: soatiga yuboriladigan SMS soni (pilot uchun 30–60).
Raqam bo‘yicha qo‘shimcha limit bazada: 10 daqiqada 3, soatda 5, kunda 10.

## 7. Birinchi super admin

Kerakli odam bir marta tizimga kirganidan keyin, SQL Editor'da (raqam `+`siz):

```sql
insert into public.platform_admins (user_id, note)
select id, 'Platforma egasi'
from auth.users
where phone = '998XXXXXXXXX';
```

## Tekshirish

1. `/uz/login` → raqam → "Kod yuborish" → SMS keladi → kod → `/uz/onboarding` → ism, rozilik.
2. Noto‘g‘ri kod → "Kod noto‘g‘ri yoki muddati o‘tgan".
3. Bir raqamga 10 daqiqada 4-marta kod so‘rash → "Bu raqamga juda ko‘p kod so‘raldi".
4. Muammo bo‘lsa: Dashboard → Edge Functions → `send-sms` → Logs (telefon va kod logga yozilmaydi).
