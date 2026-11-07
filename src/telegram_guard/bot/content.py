"""Canonical, account-free security content shared by the bot and the mini app.

Nothing here accesses a Telegram account. These are instructions that point the
user at Telegram's own built-in settings.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ChecklistItem:
    id: str
    title: str
    how: str


# Ordered security checklist. Each item is an action the user performs inside
# the official Telegram app — Telegram Guard never does it for them.
CHECKLIST: tuple[ChecklistItem, ...] = (
    ChecklistItem(
        "two_step",
        "Ikki bosqichli tekshiruvni (2FA) yoqing",
        "Sozlamalar → Maxfiylik va xavfsizlik → Ikki bosqichli tekshiruv. "
        "Kuchli bulutli parol qo‘ying va tiklash uchun email ulang. "
        "Shunda kimdir SMS kodini bilsa ham, parolsiz kira olmaydi.",
    ),
    ChecklistItem(
        "review_devices",
        "Faol qurilmalarni ko‘rib chiqing",
        "Sozlamalar → Qurilmalar. Ro‘yxatdagi har bir seansni tanimasangiz, "
        "uni o‘zingiz tugating. Faqat o‘zingiz tanigan qurilmalar qolsin.",
    ),
    ChecklistItem(
        "auto_terminate",
        "Faol bo‘lmaganda avtomatik tugatishni qisqartiring",
        "Sozlamalar → Qurilmalar → Agar faol bo‘lmasa... muddatini 1 hafta yoki "
        "1 oyga qo‘ying. Tashlab ketilgan seanslar o‘zi yopiladi.",
    ),
    ChecklistItem(
        "login_alerts",
        "Yangi login xabarlari yoniqligiga ishonch hosil qiling",
        "Telegram har yangi qurilmada kirilganda rasmiy «Telegram» chatiga xabar "
        "yuboradi. O‘sha xabarlarni o‘chirib qo‘ymang — bu sizning asosiy ogohlantirishingiz.",
    ),
    ChecklistItem(
        "never_share_code",
        "Login kodi va parolni hech kimga bermang",
        "Telegram kodi yoki 2FA parolini hech kim — hatto «Telegram xodimi» yoki "
        "do‘stingiz deb yozgan odam ham — so‘ramaydi. Hech qachon ularni yubormang.",
    ),
    ChecklistItem(
        "beware_links",
        "Shubhali havola va «bepul Premium» botlariga ishonmang",
        "Akkauntlar ko‘pincha soxta havola orqali o‘g‘irlanadi. Telegramga o‘xshagan "
        "sahifaga login qilmang va noma’lum botga kod kiritmang.",
    ),
)

CHECKLIST_IDS: frozenset[str] = frozenset(item.id for item in CHECKLIST)

HELP_TEXT = (
    "🛡 *Telegram Guard* — akkauntingizni mustahkamlashga yordam beradi.\n\n"
    "Men sizning akkauntingizga *kirmayman* va kira olmayman — faqat Telegram’ning "
    "o‘z himoyasini to‘g‘ri yoqishga yordam beraman, shunda begona seanslar kira olmaydi.\n\n"
    "Buyruqlar:\n"
    "/checklist — xavfsizlik tekshiruv ro‘yxati\n"
    "/status — nechta qadamni bajardingiz\n"
    "/done <raqam> — qadamni bajarilgan deb belgilash\n"
    "/reset — belgilashlarni tozalash\n"
    "/help — shu yordam"
)

START_TEXT = (
    "Assalomu alaykum! 🛡\n\n"
    "Men Telegram Guard botiman. Akkauntingizni begona kirishlardan himoyalashning "
    "eng ishonchli yo‘li — Telegram’ning o‘z sozlamalarini to‘g‘ri yoqish. "
    "Sizga shuni bosqichma-bosqich ko‘rsataman.\n\n"
    "Boshlash uchun /checklist ni bosing."
)

PRIVACY_NOTE = (
    "ℹ️ Diqqat: men hech qachon login kodingizni, parolingizni yoki seansingizni "
    "so‘ramayman va ko‘rmayman. Agar biror bot bulardan birini so‘rasa — bu firibgarlik."
)
