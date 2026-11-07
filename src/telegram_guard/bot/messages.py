"""Pure rendering of bot messages. No I/O, no network — fully testable."""

from telegram_guard.bot.content import CHECKLIST, HELP_TEXT, PRIVACY_NOTE, START_TEXT

__all__ = [
    "HELP_TEXT",
    "PRIVACY_NOTE",
    "START_TEXT",
    "render_checklist",
    "render_done_ack",
    "render_status",
    "render_unknown",
]


def render_checklist(done: set[str]) -> str:
    lines = ["🛡 *Xavfsizlik tekshiruv ro‘yxati*", ""]
    for index, item in enumerate(CHECKLIST, start=1):
        mark = "✅" if item.id in done else "⬜️"
        lines.append(f"{mark} *{index}. {item.title}*")
        lines.append(f"   {item.how}")
        lines.append("")
    completed = len(done & {item.id for item in CHECKLIST})
    lines.append(f"Bajarildi: {completed}/{len(CHECKLIST)}.")
    lines.append("Qadamni belgilash uchun: /done <raqam>, masalan /done 1.")
    return "\n".join(lines)


def render_status(done: set[str]) -> str:
    completed = len(done & {item.id for item in CHECKLIST})
    total = len(CHECKLIST)
    if completed == total:
        head = "✅ Barcha qadamlar bajarilgan. Akkauntingiz yaxshi himoyalangan."
    elif completed == 0:
        head = "⬜️ Hali birorta qadam belgilanmagan. /checklist bilan boshlang."
    else:
        head = f"⏳ {completed}/{total} qadam bajarilgan. Qolganini tugating."
    remaining = [item for item in CHECKLIST if item.id not in done]
    if remaining:
        head += "\n\nQolgan qadamlar:"
        for index, item in enumerate(CHECKLIST, start=1):
            if item.id in done:
                continue
            head += f"\n• {index}. {item.title}"
    return head


def render_done_ack(item_number: int) -> str:
    item = CHECKLIST[item_number - 1]
    return f"✅ «{item.title}» bajarildi deb belgilandi."


def render_unknown() -> str:
    return "Bu buyruqni tushunmadim. /help ni ko‘ring."
