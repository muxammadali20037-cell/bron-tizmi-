"""Safe logging defaults.

Every record passes through ``RedactingFormatter``, which scrubs the fully
formatted output (message, arguments, exception traceback and stack info) with
``redact_text`` before it reaches any stream.
"""

import logging
from collections.abc import Iterable

from telegram_guard.config import Settings
from telegram_guard.security.redaction import redact_text

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


class RedactingFormatter(logging.Formatter):
    def __init__(self, fmt: str = LOG_FORMAT, secrets: Iterable[str] = ()) -> None:
        super().__init__(fmt)
        self._secrets = tuple(secrets)

    def format(self, record: logging.LogRecord) -> str:
        return redact_text(super().format(record), self._secrets)


def configure_logging(settings: Settings) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(RedactingFormatter(secrets=settings.secret_values()))
    # force=True replaces any pre-existing root handlers, so no unredacted
    # handler can stay attached.
    logging.basicConfig(
        level=getattr(logging, settings.log_level),
        handlers=[handler],
        force=True,
    )
    # Avoid verbose third-party logs accidentally exposing request details.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("telethon").setLevel(logging.WARNING)
