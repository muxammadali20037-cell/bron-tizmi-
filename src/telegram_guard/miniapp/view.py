"""Shared mini app response shape, used by the local server and Vercel functions."""

from telegram_guard.bot.content import CHECKLIST
from telegram_guard.bot.protocols import ChecklistStoreLike
from telegram_guard.miniapp.auth import MiniAppUser

VALID_ITEM_IDS = frozenset(item.id for item in CHECKLIST)


def state_payload(user: MiniAppUser, store: ChecklistStoreLike) -> dict:
    done = store.get_done(user.id)
    items = [
        {
            "id": item.id,
            "number": index,
            "title": item.title,
            "how": item.how,
            "done": item.id in done,
        }
        for index, item in enumerate(CHECKLIST, start=1)
    ]
    return {
        "user": {"id": user.id, "first_name": user.first_name, "username": user.username},
        "checklist": items,
        "completed": sum(1 for i in items if i["done"]),
        "total": len(items),
    }
