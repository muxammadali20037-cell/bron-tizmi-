# Telegram Guard — Phase 0 tekshiruv hisoboti

**Sana:** 2026-11-07 · **Holat:** Phase 0 yakunlandi · **Phase 1:** boshlanmagan (alohida rozilik kerak)

## Qisqa xulosa

Asl Phase 0 kodida **1 ta bloklovchi xato**, **2 ta maxfiy ma’lumot sizib chiqish yo‘li**,
**4 ta o‘rta** va **3 ta past** darajali muammo topildi. Hammasi tuzatildi va har biri test bilan
qoplandi. Testlar soni 4 tadan 91 taga oshdi. Yangi regression testlarning 19 tasi asl kodda
yiqiladi, tuzatilgan kodda esa hammasi o‘tadi — demak testlar haqiqiy xatolarni ushlaydi.

## Topilgan muammolar

| # | Daraja | Muammo | Isbot (asl kodda) | Tuzatish | Test |
|---|--------|--------|-------------------|----------|------|
| 1 | KRITIK | README oqimi ishlamaydi: `cp .env.example .env` dan keyin `doctor` va `config-check` traceback bilan yiqiladi | `TG_API_ID=` bo‘sh qiymati int sifatida o‘qiladi → `ValidationError`, exit 1 | `env_ignore_empty=True` | `test_shipped_env_example_loads`, `test_commands_work_with_shipped_env_example` |
| 2 | YUQORI | Xato xabarida maxfiy qiymat chiqadi | Hash adashib `TG_API_ID` ga yozilsa, pydantic uni `input_value='…'` ko‘rinishida to‘liq chiqaradi | `hide_input_in_errors=True`; CLI faqat maydon nomi va sababni chiqaradi | `test_validation_errors_never_echo_input`, `test_invalid_config_fails_cleanly_without_leaking` |
| 3 | YUQORI | Traceback’da lokal o‘zgaruvchilar (`.env` qiymatlari bilan) chiqadi | `typer>=0.12` ruxsat berilgan; typer 0.12.5 da `LOG_LEVEL=info` xatosi `TG_API_HASH` ni ekranga to‘liq chiqardi | `pretty_exceptions_show_locals=False` + config xatolari ushlanadi | `test_tracebacks_never_show_local_variables` |
| 4 | O‘RTA | Avto-tugatish himoyasini runtime’da chetlab o‘tish mumkin | `settings.auto_terminate_sessions = True` validatorsiz qabul qilindi | `frozen=True` | `test_settings_are_immutable_at_runtime` |
| 5 | O‘RTA | "Xavfsiz loglash" amalda ulanmagan | `redaction` moduli hech qayerda ishlatilmagan, loglar filtrsiz | `RedactingFormatter`: har bir log yozuvi (traceback bilan) tozalanadi, API hash qiymati aniq almashtiriladi | `tests/test_logging.py` |
| 6 | O‘RTA | Redaction’da bo‘shliqlar bor | 11 ta kalit varianti (`apiHash`, `api-hash`, `phone_code_hash`, `auth_key`, `bot_token`…) yashirilmadi; tuple ichiga kirmaydi; `int` kalitda `AttributeError`; siklik ma’lumotda `RecursionError` | Kalitlarni normallashtirish, xavfli fragmentlar, tuple/set, chuqurlik cheklovi | `tests/test_redaction.py` |
| 7 | O‘RTA | Dependency nomuvofiqligi | `typer` 0.12–0.15.x + `click>=8.2` → `--help` `TypeError` bilan yiqiladi (eng past versiyalarda sinab tasdiqlangan) | `typer>=0.16,<1` | eng past versiyalar bilan to‘liq test |
| 8 | PAST | pytest zaifligi CVE-2025-71176 | `pytest<9` cheklovi tuzatilgan 9.0.3 ni bloklab turgan | `pytest>=9.0.3,<10` | `pip-audit` |
| 9 | PAST | setuptools zaifliklari CVE-2026-59890, GHSA-xmj3-9gf7-h52w | venv’dagi setuptools 79.0.1 | build talabi `setuptools>=84.1`; README’da `pip install --upgrade pip setuptools` | `pip-audit` |
| 10 | PAST | Mayda kamchiliklar | `LOG_LEVEL=info` (kichik harf) yiqitardi; `TG_API_HASH` formati tekshirilmasdi; testlar dasturchining haqiqiy `.env` va muhit o‘zgaruvchilarini o‘qishi mumkin edi; `.gitignore` da `*.log` yo‘q edi | Normallashtirish; 32 ta hex belgi tekshiruvi; `conftest.py` izolyatsiyasi; `.gitignore` | `tests/test_config.py` |

## Qo‘shilgan imkoniyat

`doctor` endi haqiqiy lokal tekshiruvlarni bajaradi: Python versiyasi, `.env` mavjudligi va
ruxsatlari (macOS/Linux da `chmod 600` tavsiya qilinadi), papkada `*.session` fayllar yo‘qligi.
`.env` mazmuni o‘qilmaydi.

## O‘zgartirilgan fayllar

- **O‘zgartirildi:** `pyproject.toml`, `README.md`, `.gitignore`, `src/telegram_guard/cli.py`,
  `config.py`, `logging_config.py`, `security/redaction.py`, `tests/test_config.py`,
  `tests/test_redaction.py`
- **Yangi:** `src/telegram_guard/health.py`, `tests/conftest.py`, `tests/test_cli.py`,
  `tests/test_health.py`, `tests/test_logging.py`, `tests/test_no_network.py`, `PHASE0_REPORT.md`
- **O‘zgarmadi:** `.env.example`, `CLAUDE_TASK_PHASE0.md`, `__init__.py` fayllari

## Tekshiruv natijalari

Toza nusxada README’dagi buyruqlar aynan bajarildi (Python 3.11, Linux):

| Tekshiruv | Natija |
|-----------|--------|
| `pip install -e ".[dev]"` | muvaffaqiyatli |
| `telegram-guard doctor` | exit 0, barcha tekshiruvlar OK |
| `telegram-guard config-check` | exit 0 |
| `pytest` (Python 3.11, eng yangi dependency’lar) | **91 passed** |
| `pytest` (Python 3.13) | **91 passed** |
| `pytest` (eng past ruxsat etilgan versiyalar: pydantic 2.7.0, pydantic-settings 2.2.0, typer 0.16.0, rich 13.7.0) | **91 passed** |
| `ruff check .` (bandit xavfsizlik qoidalari `S` bilan) | All checks passed |
| `ruff format --check .` | barcha fayllar formatlangan |
| `pip-audit --skip-editable` | No known vulnerabilities found |
| Wheel tarkibi | faqat paket fayllari; `.env` va testlar yo‘q |
| `strace` — `doctor` va `config-check` tarmoq syscall’lari | **0** |
| Tarmoqsiz muhitda (`unshare -n`) ikkala buyruq | ishlaydi |
| Yaratilgan `*.session` fayllar | **0** |

## Qat’iy cheklovlarga rioya

- Telegram’ga ulanish yo‘q — strace, tarmoqsiz muhit va `test_no_network.py` bilan tasdiqlangan.
- Login kodi, 2FA paroli yoki session so‘ralmadi va yaratilmadi.
- `.env` qiymatlari loglarga va xato xabarlariga chiqmaydi — testlar bilan tasdiqlangan.
- `.env.example` da `AUTO_TERMINATE_SESSIONS=false` o‘zgarmagan; `true` qiymat har qanday manbadan
  (`.env`, muhit o‘zgaruvchisi, runtime’da o‘zgartirish) rad etiladi.
- Yashirin kuzatuv, boshqa akkauntga kirish yoki himoyani chetlab o‘tish funksiyasi qo‘shilmagan.
- Testlarda faqat aniq soxta qiymatlar ishlatilgan.

## Ma’lum cheklovlar

- `redact_text` heuristik xavfsizlik to‘ri: u kafolat emas. Kod sirlarni loggerga umuman uzatmasligi kerak.
- `TG_API_HASH` uchun 32 ta hex belgi tekshiruvi my.telegram.org beradigan formatga asoslangan.
  Phase 1 da haqiqiy qiymat bilan lokal tasdiqlang (Claude chatiga yubormasdan).
- Windows’da testlar ishga tushirilmagan; u yerda `.env` ruxsatlari tekshiruvi o‘tkazilmaydi.
- Hash bilan qotirilgan lock fayl yo‘q: dependency’lar faqat diapazon bilan berilgan.

## Phase 1 uchun bloklovchi masalalar

1. **Foydalanuvchidan alohida, aniq rozilik** (CLAUDE_TASK_PHASE0.md talabi).
2. **Session fayl siyosati:** Telethon session fayli akkauntga to‘liq kirish huquqini beradi.
   Joylashuvi (loyiha papkasidan tashqarida), `0600` ruxsat, shifrlash yoki OS keychain va Git’ga
   tushmasligi oldindan hal qilinishi kerak.
3. **Read-only kafolati:** faqat `GetAuthorizationsRequest` ga ruxsat beruvchi allowlist wrapper
   hamda `ResetAuthorizationRequest` chaqirilmasligini tekshiruvchi test.
4. **Telethon versiyasini tanlash va pin qilish**, hash’li lock fayl (supply chain himoyasi).
5. **Ma’lumotlar bazasi:** `data/` ruxsatlari, qaysi shaxsiy ma’lumotlar (IP, joylashuv)
   saqlanishi, saqlash muddati, `DATABASE_URL` validatsiyasi.
6. **CI:** har push’da `pytest`, `ruff`, `pip-audit` (hozircha yo‘q).
7. **Windows’da testlarni ishga tushirish.**
