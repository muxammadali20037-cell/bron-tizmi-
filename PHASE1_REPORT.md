# Telegram Guard — Phase 1 hisoboti (xavfsiz rejim)

**Sana:** 2026-11-07 · **Versiya:** 0.2.0

## Maqsad va qaror

Talab: «begona sessiyalar kira olmasin va men habardor bo‘lib turay», hamma ishlata olsin.

Qaror: akkauntga **kirmaydigan** mahsulot qurildi. Botlar texnik jihatdan foydalanuvchining
seanslarini o‘qiy olmaydi, va ko‘p odamning login kodi/sessiyasini bir joyga yig‘adigan
dastur — niyat qanday bo‘lishidan qat’i nazar — aynan akkaunt egallash vositasining o‘zi.
Shuning uchun `telethon`/foydalanuvchi-login umuman qo‘shilmadi. Uning o‘rniga:

- **Begona kira olmasligi** Telegram’ning 2FA + Qurilmalar sozlamalari orqali ta’minlanadi;
  bot shularni yoqishga yo‘naltiradi.
- **Habardorlik** Telegram’ning o‘z yangi-login xabarlari + botning eslatma va tekshiruv
  ro‘yxati orqali ta’minlanadi.

## Qurilgan narsa

| Komponent | Fayl(lar) | Akkauntga tegadimi? |
|-----------|-----------|---------------------|
| Xavfsizlik ro‘yxati va matnlar | `bot/content.py` | Yo‘q |
| Xabar shakllantirish (pure) | `bot/messages.py` | Yo‘q |
| Buyruqlar mantig‘i (pure) | `bot/handlers.py` | Yo‘q |
| Chat holati (lokal SQLite) | `bot/store.py` | Yo‘q |
| Bot API transport | `bot/api.py` | Faqat Bot API (bot sifatida) |
| Long-polling halqasi | `bot/runner.py` | Faqat Bot API |
| Mini App imzo tekshiruvi | `miniapp/auth.py` | Yo‘q |
| Mini App lokal server | `miniapp/server.py` | Faqat lokal HTTP |
| Mini App sahifa | `miniapp/static/index.html` | Yo‘q |
| Konfiguratsiya kengaytmasi | `config.py` | — |
| CLI buyruqlari | `cli.py` | `bot`/`miniapp` faqat Bot API |

## Xavfsizlik xususiyatlari va isbotlar

| Xususiyat | Qanday ta’minlangan | Test |
|-----------|---------------------|------|
| Akkauntga ulanmaydi | `telethon`/`pyrogram` kod ichida yo‘q (AST tekshiruvi) | `test_account_clients_are_absent_everywhere` |
| Tarmoq faqat 3 ta modulda | Yadro modullari `socket`/`urllib.request`/`http.client` import qilmaydi | `test_only_transport_modules_use_networking` |
| Offline buyruqlar tarmoqqa chiqmaydi | `doctor`, `config-check`, `checklist` | `test_offline_commands_make_no_network_calls` + strace = 0 |
| Mini App soxta ma’lumotni rad etadi | HMAC-SHA256 imzo + muddat tekshiruvi | `test_miniapp_auth.py` (10 ta holat) |
| initData uchidan-uchiga ishlaydi | Haqiqiy lokal server bilan | `test_miniapp_server.py` |
| Bot tokeni logga/xatoga chiqmaydi | redaction namunasi + `hide_input_in_errors` | `test_redaction_phase1.py`, qo‘lda tekshiruv |
| Sozlamalar o‘zgartirib bo‘lmaydi | `frozen=True` | `test_auto_termination_still_frozen_and_rejected` |
| Avtomatik tugatish taqiqlangan | validator + frozen | `test_config_phase1.py` |
| Bir chat boshqasini ko‘rmaydi | holat chat_id bo‘yicha alohida | `test_done_state_is_per_chat` |
| Lokal fayl ruxsatlari | DB `0600`, papka `0700` | `test_persists_to_disk_and_hardens_permissions` |

### Mini App `initData` tekshiruvi

Telegram’ning rasmiy sxemasi bo‘yicha:
`secret = HMAC_SHA256("WebAppData", bot_token)`, so‘ng
`hash == HMAC_SHA256(secret, data_check_string)`, hamda `auth_date` muddati tekshiriladi.
Testda bu formula mustaqil ravishda qayta yozilib, to‘g‘ri namuna yasaladi; so‘ng
o‘zgartirilgan payload, noto‘g‘ri token, yo‘q hash, o‘tgan va kelajak `auth_date`,
bo‘sh kirish va `signature` maydoni holatlari tekshiriladi.

## Tekshiruv natijalari

| Tekshiruv | Natija |
|-----------|--------|
| `pytest` (Python 3.11, eng yangi deps) | **159 passed** |
| `pytest` (Python 3.13) | **159 passed** |
| `pytest` (eng past ruxsat etilgan deps: pydantic 2.7, pydantic-settings 2.2, typer 0.16, rich 13.7) | **159 passed** |
| `ruff check` (xavfsizlik `S` qoidalari bilan) | All checks passed |
| `ruff format --check` | barcha fayllar formatlangan |
| `pip-audit --skip-editable` | No known vulnerabilities found |
| Wheel tarkibi | paket + `miniapp/static/index.html`; `.env`/testlar yo‘q |
| `strace`: doctor/config-check/checklist | **0** tarmoq syscall |
| Yangi dependency | **yo‘q** (hammasi stdlib: urllib, http.server, sqlite3, hmac) |

## O‘zgartirilgan / yangi fayllar

- **Yangi:** `bot/` (7 fayl), `miniapp/` (auth, server, static/index.html),
  `tests/test_bot_*.py` (4), `tests/test_miniapp_auth.py`, `tests/test_miniapp_server.py`,
  `tests/test_config_phase1.py`, `tests/test_redaction_phase1.py`, `PHASE1_REPORT.md`
- **O‘zgartirildi:** `__init__.py` (0.2.0), `config.py`, `cli.py`, `health.py`,
  `security/redaction.py`, `pyproject.toml`, `.env.example`, `README.md`,
  `tests/conftest.py`, `tests/test_no_network.py`, `tests/test_cli.py`
- **Phase 0 testlari:** hammasi saqlanib, o‘tmoqda.

## Ma’lum cheklovlar

- Bot foydalanuvchi seanslarini **ko‘ra olmaydi** (Telegram cheklovi) — bu kamchilik emas,
  xavfsizlik tanlovi. «Yangi sessiya» ogohlantirishini Telegram’ning o‘zi beradi.
- Mini App’ni ommaviy ishlatish uchun HTTPS hosting (reverse proxy) kerak; serverning o‘zi
  lokalga bog‘lanadi.
- Mini App `initData` tekshiruvi HMAC usulida; Telegram’ning yangi Ed25519 `signature`
  maydoni e’tiborsiz qoldiriladi (HMAC yetarli va standart).

## Keyingi qadamlar (ixtiyoriy)

1. Botga ixtiyoriy eslatma jadvali (masalan, har hafta «qurilmalarni tekshiring»).
2. Mini App’ni deploy qilish uchun namunaviy reverse-proxy konfiguratsiyasi.
3. CI: har push’da `pytest` + `ruff` + `pip-audit`.
4. Ko‘p tillilik (hozir faqat o‘zbekcha).
