# SOFRIVA

Restoranlarni topish, zal va stol tanlab real vaqtda bron qilish hamda restoranni boshqarish uchun
hospitality texnologiya platformasi. Birinchi bozor — O‘zbekiston (Toshkent).

> **Holat:** Sprint 2 — baza poydevori va RLS (staging). Login va interfeys hali ulanmagan;
> mahsulot hali ishga tushmagan.
> SOFRIVA — ishchi nom, huquqiy tekshiruv davom etmoqda (ADR 0003).

## Texnologiyalar

| Qatlam       | Texnologiya                                                               |
| ------------ | ------------------------------------------------------------------------- |
| Frontend     | Next.js 16 (App Router, Cache Components), React 19, TypeScript strict    |
| UI           | Tailwind CSS 4, Radix UI, Lucide, Inter + Playfair Display (ADR 0004)     |
| Baza va auth | Supabase (PostgreSQL 17, RLS, Auth, Realtime, Storage), Frankfurt regioni |
| Tarjima      | Next.js o‘rnatilgan i18n: `/uz`, `/ru`, `/en`                             |
| Test         | Vitest (unit), Playwright (E2E, Sprint 4+), pgTAP (RLS, Sprint 2+)        |
| Deploy       | Vercel + GitHub Actions                                                   |
| Monitoring   | Sentry (DSN berilganda yoqiladi)                                          |

## Ishga tushirish

Talab: Node.js 22 (`.nvmrc`).

```bash
npm install
cp .env.example .env.local   # qiymatlarni to‘ldiring
npm run dev                  # http://localhost:3000
```

## Buyruqlar

| Buyruq              | Nima qiladi                                       |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Lokal server                                      |
| `npm run build`     | Production build                                  |
| `npm run lint`      | ESLint                                            |
| `npm run typecheck` | TypeScript tekshiruvi                             |
| `npm test`          | Unit testlar                                      |
| `npm run check`     | lint + typecheck + test birga                     |
| `npm run format`    | Prettier bilan formatlash                         |
| `npm run db:types`  | Supabase sxemasidan TypeScript turlarini yaratish |

Baza testlari (pgTAP) qanday ishga tushiriladi: [supabase/tests/README.md](supabase/tests/README.md).

Ichki komponentlar namunasi: `/uz/design` (lokal `npm run dev` da doim ochiq; serverda faqat
`ENABLE_DESIGN_PAGE=true` bo‘lsa).

## Papkalar

```text
src/
  app/[locale]/        # sahifalar; til URL'da (/uz, /ru, /en)
  app/api/             # health, webhooklar
  components/ui/       # design system: Button, Field, Input, PhoneInput, Dialog, Tabs, ...
  components/booking/  # bron elementlari: SlotGrid, PartySizeStepper
  components/layout/   # sayt va dashboard qobiqlari
  components/shared/   # logo, til tanlash
  config/brand.ts      # brend nomi, slogan, ranglar (bitta joyda)
  features/            # modullar: auth, restaurants, reservations, ... (Sprint 2+)
  lib/                 # i18n, supabase klientlari, env, yordamchilar
  messages/            # tarjimalar: uz.json, ru.json, en.json
  proxy.ts             # til yo‘naltirish (Next.js 16'da middleware nomi)
supabase/
  migrations/          # SQL migratsiyalar (yagona haqiqat manbai)
  tests/               # pgTAP testlari
docs/                  # arxitektura va qarorlar (ADR)
```

## Asosiy qoidalar

1. Bazaga murojaat faqat serverda (`features/*/queries.ts`, `actions.ts`). Komponent bazaga to‘g‘ridan-to‘g‘ri bormaydi.
2. Har bir forma uchun bitta Zod sxema — frontendda ham, serverda ham.
3. Maxfiy kalitlar faqat serverda; `NEXT_PUBLIC_` prefiksli qiymatlar brauzerga chiqadi.
4. Yangi matn qo‘shilsa, uchala tarjima fayliga ham qo‘shiladi (test tekshiradi).
5. Har bir muhim qaror `docs/decisions/` ga yoziladi.

Batafsil: [docs/architecture.md](docs/architecture.md).
