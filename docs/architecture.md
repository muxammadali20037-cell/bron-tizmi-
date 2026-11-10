# OneTable arxitekturasi (qisqa)

To‘liq hujjat: "OneTable — Audit va Tizim Arxitekturasi" (Claude Docs). Bu fayl kod bilan birga
yashaydigan qisqa nusxa.

## Umumiy ko‘rinish

- Bitta Next.js 16 ilova: mijoz sayti, restoran dashboardi, super admin. Keyinchalik Telegram Mini App
  shu ilovaning `(tma)` route guruhi bo‘ladi.
- Bitta Supabase loyiha (Frankfurt, eu-central-1): PostgreSQL + RLS, Auth, Realtime, Storage, pg_cron.
- Eng muhim qoidalar (bron himoyasi, ruxsatlar) PostgreSQL ichida: RLS, `has_permission()`, exclusion constraint.

## Bron himoyasi

Har bir band stol vaqti `reservation_tables` jadvalida alohida qator. Constraint bitta stol uchun
kesishgan ikki faol vaqtni qabul qilmaydi:

```sql
constraint no_double_booking exclude using gist (
  table_id with =,
  blocked_during with &&
) where (is_blocking)
```

## Bron holatlari

`pending` | `awaiting_payment` (Phase 2) | `confirmed` | `checked_in` — stolni band qiladi.
`expired` | `rejected` | `cancelled` | `no_show` | `completed` — yakuniy, stolni bo‘shatadi.

## Rollar

Platforma: mijoz, super admin. Restoran (MVP): Owner, General Manager, Administrator, Host.
Ruxsatlar rol emas, kod bo‘yicha tekshiriladi (`reservations.manage`).

## Bosqichlar

Phase 1 (MVP) — 10 sprint: poydevor → design system → DB va RLS → auth → onboarding → discovery →
booking engine → dashboard → bildirishnoma/admin → QA va ishga tushirish.
