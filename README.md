# Telegram Guard

Telegram akkauntingizni **begona kirishlardan himoyalashga** yordam beradigan bot va
Mini App. Eng muhim jihati:

> **Telegram Guard hech kimning akkauntiga kirmaydi.** U login kodi, 2FA paroli yoki
> session so‘ramaydi va ko‘rmaydi. Faqat bot sifatida (Bot API orqali) ishlaydi va
> sizga Telegram’ning o‘z himoyasini to‘g‘ri yoqishda yordam beradi.

Shuning uchun uni «buzib bo‘lmaydi» — chunki u sizning maxfiy ma’lumotlaringizni
umuman ushlab turmaydi.

## Nega aynan shunday?

Telegram botlari, texnik jihatdan, sizning faol seanslaringizni ko‘ra olmaydi — buni
Telegram cheklagan. Begona qurilma kira olmasligini va sizning habardor bo‘lishingizni
ta’minlaydigan yagona ishonchli yo‘l — **Telegram’ning o‘z sozlamalari**:

- **Ikki bosqichli tekshiruv (2FA)** — begona odam SMS kodini bilsa ham, parolsiz kira olmaydi.
- **Qurilmalar ro‘yxati** — notanish seanslarni o‘zingiz ko‘rib, tugatasiz.
- **Yangi login xabarlari** — Telegram har yangi kirishda rasmiy «Telegram» chatiga xabar yuboradi.

Telegram Guard ana shularni bosqichma-bosqich yoqib beradi, eslatib turadi va bir joyda
tekshiruv ro‘yxati sifatida ko‘rsatadi.

## Komponentlar

1. **Bot** (`telegram-guard bot`) — Bot API orqali ishlaydi. Buyruqlar: `/start`, `/help`,
   `/checklist`, `/status`, `/done <raqam>`, `/reset`. Har kim ishlatishi mumkin; har bir
   chatning holati alohida saqlanadi.
2. **Mini App** (`telegram-guard miniapp`) — tekshiruv ro‘yxatini chiroyli oynada ko‘rsatadi.
   Har bir so‘rovda Telegram `initData` imzosini tekshiradi, shuning uchun faqat haqiqiy
   egasi o‘z ma’lumotini ko‘radi.

## Talablar

- Python 3.11+ (3.11 va 3.13 da sinovdan o‘tgan)
- Bot uchun: @BotFather’dan olingan bot tokeni (bu akkaunt emas — botning o‘z tokeni)

## O‘rnatish

```bash
python3.11 -m venv .venv
source .venv/bin/activate            # Windows: .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools
pip install -e ".[dev]"
cp .env.example .env
chmod 600 .env                       # macOS/Linux
```

So‘ng `.env` ichiga @BotFather bergan tokenni yozing:

```
BOT_TOKEN=123456789:ABCdef...
```

## Ishlatish

Tokensiz, tarmoqsiz buyruqlar:

```bash
telegram-guard doctor         # lokal holat
telegram-guard config-check   # konfiguratsiya (maxfiy qiymatlarsiz)
telegram-guard checklist      # xavfsizlik ro‘yxatini chop etadi
pytest                        # testlar
```

Botni ishga tushirish (faqat Telegram Bot API’ga ulanadi):

```bash
telegram-guard bot
```

Mini App’ni lokal ishga tushirish (Telegram HTTPS talab qiladi — ommaviy chiqarish
uchun reverse proxy, masalan Caddy/Nginx, ishlating va `MINIAPP_URL` ni to‘ldiring):

```bash
telegram-guard miniapp
```

## Xavfsizlik kafolatlari

- **Akkauntga ulanish yo‘q.** Kod ichida `telethon`/`pyrogram` kabi foydalanuvchi-akkaunt
  kutubxonalari umuman yo‘q — buni `test_no_network.py` har ishga tushganda tekshiradi.
- **Tarmoq faqat bitta joyda.** Tarmoqqa chiqish faqat `bot/api.py`, `bot/runner.py` va
  `miniapp/server.py` ichida — qolgan hamma mantiq tarmoqsiz va testlanadi.
- **Maxfiylik.** Bot tokeni hech qachon logga yoki xato xabariga chiqmaydi (redaction +
  xato xabarlari qiymatni ko‘rsatmaydi). Sozlamalar yuklangandan keyin o‘zgartirib bo‘lmaydi.
- **Mini App imzosi.** `initData` HMAC-SHA256 bilan tekshiriladi; soxta yoki o‘zgartirilgan
  yoki muddati o‘tgan ma’lumot rad etiladi (`test_miniapp_auth.py`).
- **Lokal holat.** Chatlar holati faqat o‘zingizning kompyuteringizdagi SQLite faylida
  (`~/.telegram-guard/`, ruxsat `0600`) saqlanadi. Hech qanday markaziy server yo‘q.

## Loyiha tuzilmasi

```text
src/telegram_guard/
├── cli.py              # doctor, config-check, checklist, bot, miniapp
├── config.py           # typed, frozen konfiguratsiya
├── health.py           # lokal tekshiruvlar
├── logging_config.py   # maxfiylikni tozalovchi loglash
├── security/redaction.py
├── bot/
│   ├── content.py      # xavfsizlik ro‘yxati va matnlar (umumiy)
│   ├── messages.py     # xabarlarni shakllantirish (pure)
│   ├── handlers.py     # buyruqlar mantig‘i (pure)
│   ├── store.py        # chat holati (SQLite, lokal)
│   ├── api.py          # Bot API transport (urllib)
│   └── runner.py       # long-polling halqasi
└── miniapp/
    ├── auth.py         # initData imzo tekshiruvi (xavfsizlik yadrosi)
    ├── server.py       # lokal server
    └── static/index.html
```

## Xavfsizlik qoidalari (foydalanuvchi uchun)

1. Bot tokeningizni hech kimga bermang va Git’ga yuklamang (`.env` ignore qilingan).
2. Login kodi yoki 2FA parolini **hech kim** so‘ramaydi — hatto bu bot ham. So‘rasa, firibgarlik.
3. Telegram Guard akkauntga kira olmaydi; kira oladigan «guard» dasturlardan ehtiyot bo‘ling.
