<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## OneTable loyiha qoidalari

- Foydalanuvchiga hisobotlar sodda o‘zbek tilida yoziladi; kod va identifikatorlar inglizcha.
- Har bir yangi UI matni `src/messages/{uz,ru,en}.json` ga uchala tilda qo‘shiladi.
- Bazaga murojaat faqat serverda; RLS har doim yoqiq; `service_role`/secret kalit brauzerga chiqmaydi.
- Sxema o‘zgarishi faqat `supabase/migrations/` orqali; qo‘lda dashboard'da o‘zgartirilmaydi.
- Bron himoyasi bazada (exclusion constraint) — frontend tekshiruvi yetarli emas.
- Muhim qarorlar `docs/decisions/` ga ADR sifatida yoziladi.
- Har o‘zgarishdan keyin: `npm run check` va `npm run build`.
