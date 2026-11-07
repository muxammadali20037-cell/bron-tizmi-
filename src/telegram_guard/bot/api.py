"""Transport to the Telegram Bot API.

This is the only bot module that touches the network, and it reaches exactly one
host: api.telegram.org. It authenticates as a bot (token), never as a user, so it
cannot read anyone's account sessions. The token is never logged.
"""

import json
import urllib.error
import urllib.request
from typing import Any, Protocol

from telegram_guard.bot.handlers import OutgoingMessage

API_ROOT = "https://api.telegram.org"


class BotAPIError(RuntimeError):
    pass


def build_reply_markup(message: OutgoingMessage) -> dict[str, Any] | None:
    if message.web_app_button is None:
        return None
    return {
        "inline_keyboard": [
            [
                {
                    "text": message.web_app_button.text,
                    "web_app": {"url": message.web_app_button.url},
                }
            ]
        ]
    }


class BotAPI(Protocol):
    def send(self, message: OutgoingMessage) -> dict[str, Any]: ...

    def get_updates(self, offset: int | None, timeout: int) -> list[dict[str, Any]]: ...


class HttpBotAPI:
    """Calls the Bot API over HTTPS. One instance holds one bot token."""

    def __init__(self, token: str, *, api_root: str = API_ROOT) -> None:
        self._base = f"{api_root}/bot{token}/"

    def _call(self, method: str, payload: dict[str, Any], *, timeout: float) -> Any:
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(  # noqa: S310 - fixed https host, not user input
            self._base + method,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            # Never include self._base here: it embeds the token.
            raise BotAPIError(
                f"Bot API «{method}» chaqiruvi muvaffaqiyatsiz: {exc.reason}"
            ) from None
        if not body.get("ok", False):
            raise BotAPIError(f"Bot API «{method}» xatolik qaytardi: {body.get('description')}")
        return body.get("result")

    def send(self, message: OutgoingMessage) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "chat_id": message.chat_id,
            "text": message.text,
            "parse_mode": message.parse_mode,
            "disable_web_page_preview": True,
        }
        markup = build_reply_markup(message)
        if markup is not None:
            payload["reply_markup"] = markup
        return self._call("sendMessage", payload, timeout=20)

    def get_updates(self, offset: int | None, timeout: int) -> list[dict[str, Any]]:
        payload: dict[str, Any] = {"timeout": timeout, "allowed_updates": ["message"]}
        if offset is not None:
            payload["offset"] = offset
        return self._call("getUpdates", payload, timeout=timeout + 10)
