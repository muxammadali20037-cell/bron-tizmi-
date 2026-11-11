# SOFRIVA arxitekturasi (qisqa)

To‘liq hujjat: "SOFRIVA — Audit, Product Architecture va MVP reja" (Claude Docs, 2026-11-11).
Bu fayl kod bilan birga yashaydigan qisqa nusxa. Ziddiyat bo‘lsa, to‘liq hujjat ustun.

## Umumiy ko‘rinish

- Bitta Next.js 16 ilova, uchta qism: Customer Platform (`/uz`, `/ru`, `/en`), Restaurant OS (`/os`),
  Super Admin (`/admin`). Telegram Mini App keyinroq shu ilova ichida bo‘ladi.
- Bitta Supabase loyiha (Frankfurt, eu-central-1): PostgreSQL + RLS, Auth, Realtime, Storage, pg_cron.
- Muhim qoidalar (bron himoyasi, ruxsatlar) PostgreSQL ichida: RLS, baza funksiyalari,
  exclusion constraint. Server kodi ularni chetlab o‘ta olmaydi.
- Tashqi xizmatlar: Eskiz (SMS kod), Telegram bot (xabarlar), Cloudflare Stream (video, ADR 0005).

## Bron himoyasi

Har bir band stol oralig‘i (bron yoki vaqtincha yopish) `table_allocations` jadvalida alohida qator.
Constraint bitta stol uchun kesishgan ikki faol oraliqni qabul qilmaydi:

```sql
constraint table_allocations_no_overlap
  exclude using gist (table_id with =, period with &&) where (active)
```

Mijoz ilovasi bron jadvallariga to‘g‘ridan-to‘g‘ri yoza olmaydi (faqat o‘qiydi). Bron Sprint 7'da
`create_reservation()` server funksiyasi orqali bitta tranzaksiyada yaratiladi.
Baza tuzilishi va RLS qoidalari: ADR 0006.

## Bron holatlari

`pending` | `awaiting_payment` (V1) | `confirmed` | `checked_in` — stolni band qiladi.
`expired` | `rejected` | `cancelled` | `no_show` | `completed` — yakuniy, stolni bo‘shatadi.
Ruxsat etilgan o‘tishlar: `src/lib/booking/statuses.ts` va bazadagi `private.can_transition`
(trigger). Ikkalasi bir xil ekanini Vitest va pgTAP testlari tekshiradi.

## Stol holatlari (tanlangan vaqt uchun)

`available` | `reserved` | `occupied` | `blocked` | `unavailable`.

## Rollar

Platforma: Customer, Super Admin (`platform_admins` jadvali). Restoran ichida: Owner, Manager,
Host, Staff (`staff_members`).

## Bosqichlar (MVP — 12 sprint)

1. Brend va design system · 2. Baza poydevori va RLS · 3. Login va rollar · 4. Restoran onboarding va
   admin tasdig‘i · 5. Zallar, stollar, xarita muharriri · 6. Foto va video · 7. Bron dvigateli · 8. Mijozning bron oqimi · 9. Restaurant OS jonli bronlar · 10. Qidiruv va bosh sahifa · 11. Telegram bildirishnomalari · 12. Super Admin va pilotga tayyorgarlik.
