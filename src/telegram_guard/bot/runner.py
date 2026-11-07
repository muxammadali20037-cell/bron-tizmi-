"""Long-polling loop that ties the transport, dispatch and store together.

Thin by design: all decision logic lives in the pure ``handlers`` module.
"""

import logging
from collections.abc import Callable

from telegram_guard.bot.api import BotAPI
from telegram_guard.bot.handlers import BotContext, handle_update
from telegram_guard.bot.store import ChecklistStore

logger = logging.getLogger(__name__)


def process_updates(
    updates: list[dict],
    store: ChecklistStore,
    api: BotAPI,
    ctx: BotContext,
) -> int:
    """Handle a batch of updates; return the next polling offset."""
    next_offset = 0
    for update in updates:
        next_offset = max(next_offset, int(update.get("update_id", 0)) + 1)
        try:
            for message in handle_update(update, store, ctx):
                api.send(message)
        except Exception:
            logger.exception("Update ishlovida xatolik (update_id=%s)", update.get("update_id"))
    return next_offset


def run(
    api: BotAPI,
    store: ChecklistStore,
    ctx: BotContext,
    *,
    poll_timeout: int = 25,
    should_stop: Callable[[], bool] | None = None,
) -> None:
    should_stop = should_stop or (lambda: False)
    offset: int | None = None
    logger.info("Bot ishga tushdi (faqat Telegram Bot API; akkauntga ulanmaydi).")
    while not should_stop():
        updates = api.get_updates(offset, timeout=poll_timeout)
        if updates:
            offset = process_updates(updates, store, api, ctx)
