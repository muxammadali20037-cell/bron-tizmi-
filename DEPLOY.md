# Deploy: GitHub + Vercel + Supabase

Telegram Guard’ning serverless (webhook) versiyasini ishga tushirish. Bot `long-polling`
o‘rniga Vercel’da webhook funksiyasi sifatida ishlaydi, holat Supabase Postgres’da saqlanadi.
Akkauntga hech qachon ulanmaydi.

## Men allaqachon sozlab qo‘ygan narsalar

| Narsa | Qiymat / holat |
|-------|----------------|
| Supabase loyiha | `sat-master` (ref `ncqqnjnozrymrmblixra`), region eu-central-1 |
| Supabase jadval | `public.tg_guard_chat_state` yaratildi, RLS yoqilgan, sinovdan o‘tdi |
| `SUPABASE_URL` | `https://ncqqnjnozrymrmblixra.supabase.co` |
| Vercel loyiha | `telegram-guard` (id `prj_9XG1JDGuApiEF6nMRTeFLo1kDAxO`), jamoa `ali` |
| Vercel env (o‘rnatildi) | `SUPABASE_URL`, `WEBHOOK_SECRET` |
| `WEBHOOK_SECRET` qiymati | `ryKAAHdpObey7LQv9vo2p42R1DKU6ETWd8S9O9PcspQ` |
| Vercel SSO himoyasi | o‘chirildi (webhook/mini app ochiq bo‘lishi uchun) |

## Siz bajarishingiz kerak bo‘lgan qadamlar

Ushbu sessiyada men **yangi GitHub repo yarata olmadim** (muhit cheklovi) va sizdagi
maxfiy qiymatlarni (bot token, Supabase service kaliti) kirita olmadim. Quyidagilar qoladi.

### 1. GitHub repo yarating va kodni joylang

github.com da `telegram-guard` nomli **private** repo oching (README’siz). So‘ng shu papkada:

```bash
git init
git add .
git commit -m "Telegram Guard: bot + mini app (serverless)"
git branch -M main
git remote add origin https://github.com/muxammadali20037-cell/telegram-guard.git
git push -u origin main
```

### 2. Vercel’ni repo’ga ulang

Vercel panelida (`ali` jamoasi) → `telegram-guard` loyihasi → Settings → Git →
`muxammadali20037-cell/telegram-guard` repo’sini ulang. Keyingi har push avtomatik deploy bo‘ladi.

> Muqobil: repo’ni ulamasdan Vercel CLI bilan ham deploy qilsa bo‘ladi (`vercel --prod`).

### 3. Ikkita maxfiy env qo‘shing (Vercel → Settings → Environment Variables)

| Kalit | Qiymat | Qayerdan |
|-------|--------|----------|
| `BOT_TOKEN` | `123456789:ABC...` | @BotFather → botingiz → API Token |
| `SUPABASE_KEY` | `service_role` kaliti | Supabase → `sat-master` → Project Settings → API → `service_role` (secret) |

> `SUPABASE_KEY` aynan **service_role** bo‘lishi kerak: jadvalda RLS yoqilgan, backend uni
> service kaliti bilan yozadi. `anon` kaliti ishlamaydi. Bu kalitni hech kimga bermang.

Har uchala env `Production` (va xohlasangiz Preview) uchun belgilansin. So‘ng qayta deploy qiling.

### 4. Webhook’ni ro‘yxatdan o‘tkazing

Deploy tugab, URL ma’lum bo‘lgach (masalan `https://telegram-guard.vercel.app`):

```bash
BOT_TOKEN='123...:ABC' \
WEBHOOK_SECRET='ryKAAHdpObey7LQv9vo2p42R1DKU6ETWd8S9O9PcspQ' \
python scripts/set_webhook.py https://telegram-guard.vercel.app
```

Bu `https://<url>/api/webhook` manzilini o‘rnatadi va `secret_token` bilan himoyalaydi.

### 5. Mini App’ni ulang (ixtiyoriy, lekin tavsiya)

- Vercel env’ga `MINIAPP_URL=https://telegram-guard.vercel.app/` qo‘shing (bot tugmasi uchun), qayta deploy qiling.
- @BotFather → Bot Settings → Menu Button / Web App → o‘sha URL’ni kiriting.

## Tekshirish

1. `https://<url>/api/webhook` ga GET → `{"ok": true, "service": "telegram-guard-webhook"}`.
2. Botga `/start` yozing → salom + tekshiruv ro‘yxati keladi.
3. `/done 1` → qadam belgilanadi (Supabase’da `tg_guard_chat_state` ga yoziladi).
4. Mini App tugmasi → ro‘yxat ochiladi, belgilash saqlanadi.

## Arxitektura

```
Telegram  ──webhook POST──►  Vercel: api/webhook.py  ──►  Supabase (holat)
                                        │
                                        └──►  Bot API (javob)
Mini App (public/index.html) ──POST /api/state,/api/done──►  Vercel funksiyalari
                                   (initData imzosi tekshiriladi)
```

- `api/*.py` — Vercel Python funksiyalari (faqat stdlib + `telegram_guard` paketi).
- `src/telegram_guard/` — testlangan yadro (169 test). `includeFiles` orqali funksiyalarga qo‘shiladi.
- Yangi dependency yo‘q; akkauntga ulanish yo‘q.

## Xavfsizlik eslatmalari

- `BOT_TOKEN` va `SUPABASE_KEY` faqat Vercel env’da; repo’ga yoki chatga yozilmaydi.
- Webhook `WEBHOOK_SECRET` header bilan himoyalangan — begona POST’lar rad etiladi.
- Mini App har so‘rovda Telegram `initData` imzosini tekshiradi — faqat egasi o‘z holatini ko‘radi.
- Supabase jadvalida RLS yoqilgan; `anon`/`public` kalit bilan kirib bo‘lmaydi.
