"""Pure update dispatch: (update, store, context) -> outgoing messages.

No network and no I/O beyond the injected store, so the whole command surface is
unit-testable offline.
"""

from dataclasses import dataclass, field
from typing import Any

from telegram_guard.bot import messages
from telegram_guard.bot.content import CHECKLIST
from telegram_guard.bot.protocols import ChecklistStoreLike


@dataclass(frozen=True)
class WebAppButton:
    text: str
    url: str


@dataclass(frozen=True)
class OutgoingMessage:
    chat_id: int
    text: str
    parse_mode: str = "Markdown"
    web_app_button: WebAppButton | None = None


@dataclass(frozen=True)
class BotContext:
    miniapp_url: str | None = None
    extra_commands: dict[str, Any] = field(default_factory=dict)


def _parse_command(text: str) -> tuple[str, list[str]]:
    parts = text.strip().split()
    if not parts:
        return "", []
    command = parts[0].lstrip("/").split("@", 1)[0].lower()
    return command, parts[1:]


def _checklist_message(chat_id: int, store: ChecklistStoreLike, ctx: BotContext) -> OutgoingMessage:
    button = None
    if ctx.miniapp_url:
        button = WebAppButton("📋 Mini App’da ochish", ctx.miniapp_url)
    return OutgoingMessage(
        chat_id,
        messages.render_checklist(store.get_done(chat_id)),
        web_app_button=button,
    )


def handle_update(
    update: dict[str, Any], store: ChecklistStoreLike, ctx: BotContext | None = None
) -> list[OutgoingMessage]:
    ctx = ctx or BotContext()
    message = update.get("message") or update.get("edited_message")
    if not isinstance(message, dict):
        return []
    chat = message.get("chat")
    if not isinstance(chat, dict) or "id" not in chat:
        return []
    chat_id = chat["id"]
    text = message.get("text")
    if not isinstance(text, str) or not text.startswith("/"):
        return []

    command, args = _parse_command(text)

    if command == "start":
        return [
            OutgoingMessage(chat_id, messages.START_TEXT),
            _checklist_message(chat_id, store, ctx),
        ]
    if command == "help":
        return [OutgoingMessage(chat_id, messages.HELP_TEXT)]
    if command == "privacy":
        return [OutgoingMessage(chat_id, messages.PRIVACY_NOTE)]
    if command == "checklist":
        return [_checklist_message(chat_id, store, ctx)]
    if command == "status":
        return [OutgoingMessage(chat_id, messages.render_status(store.get_done(chat_id)))]
    if command == "reset":
        store.reset(chat_id)
        return [OutgoingMessage(chat_id, "🔄 Belgilashlar tozalandi.")]
    if command == "done":
        return _handle_done(chat_id, args, store)

    return [OutgoingMessage(chat_id, messages.render_unknown())]


def _handle_done(chat_id: int, args: list[str], store: ChecklistStoreLike) -> list[OutgoingMessage]:
    total = len(CHECKLIST)
    if not args or not args[0].isdigit():
        return [OutgoingMessage(chat_id, f"Qaysi qadam? Masalan: /done 1 (1–{total}).")]
    number = int(args[0])
    if not (1 <= number <= total):
        return [OutgoingMessage(chat_id, f"Raqam 1–{total} oralig‘ida bo‘lishi kerak.")]
    store.mark_done(chat_id, CHECKLIST[number - 1].id)
    return [OutgoingMessage(chat_id, messages.render_done_ack(number))]
