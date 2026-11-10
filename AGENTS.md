<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## SOFRIVA loyiha qoidalari

- Foydalanuvchiga hisobotlar sodda o‘zbek tilida yoziladi; kod va identifikatorlar inglizcha.
- Har bir yangi UI matni `src/messages/{uz,ru,en}.json` ga uchala tilda qo‘shiladi. Istisno: ichki `/design` sahifasining izohlari (faqat o‘zbekcha).
- Brend nomi, slogan va ranglar faqat `src/config/brand.ts` va `globals.css` tokenlari orqali; HEX kodni komponentga yozmang.
- Playfair Display (`font-display`) faqat 24 px va undan katta sarlavhalarda.
- Soxta ma’lumot yo‘q: KPI va ro‘yxatlar faqat bazadan; ma’lumot bo‘lmasa bo‘sh holat ko‘rsatiladi.
- Bazaga murojaat faqat serverda; RLS har doim yoqiq; `service_role`/secret kalit brauzerga chiqmaydi.
- Sxema o‘zgarishi faqat `supabase/migrations/` orqali; qo‘lda dashboard'da o‘zgartirilmaydi.
- Bron himoyasi bazada (exclusion constraint) — frontend tekshiruvi yetarli emas.
- Muhim qarorlar `docs/decisions/` ga ADR sifatida yoziladi.
- Har o‘zgarishdan keyin: `npm run check` va `npm run build`.
