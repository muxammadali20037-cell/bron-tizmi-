"""Vercel serverless function: Telegram webhook.

Telegram POSTs each update here. We dispatch it with the shared pure handler,
persist checklist state in Supabase, and reply via the Bot API. This function
authenticates only as a bot and never touches a user account.
"""

import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from telegram_guard.bot.api import HttpBotAPI
from telegram_guard.bot.handlers import BotContext, handle_update
from telegram_guard.deploy.supabase_store import SupabaseStore

MAX_BODY = 1024 * 1024


class ConfigError(RuntimeError):
    pass


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ConfigError(f"Missing environment variable: {name}")
    return value


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args):  # keep platform logs quiet
        return

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        self._json(200, {"ok": True, "service": "telegram-guard-webhook"})

    def do_POST(self) -> None:
        secret = os.environ.get("WEBHOOK_SECRET")
        if secret:
            header = self.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
            if not hmac.compare_digest(header, secret):
                self._json(401, {"ok": False, "error": "unauthorized"})
                return

        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0 or length > MAX_BODY:
            self._json(400, {"ok": False, "error": "bad request"})
            return

        try:
            update = json.loads(self.rfile.read(length).decode("utf-8"))
        except ValueError:
            self._json(400, {"ok": False, "error": "invalid json"})
            return

        try:
            store = SupabaseStore(_require("SUPABASE_URL"), _require("SUPABASE_KEY"))
            api = HttpBotAPI(_require("BOT_TOKEN"))
            ctx = BotContext(miniapp_url=os.environ.get("MINIAPP_URL") or None)
            for message in handle_update(update, store, ctx):
                api.send(message)
        except ConfigError as exc:
            self._json(500, {"ok": False, "error": str(exc)})
            return
        except Exception:  # noqa: BLE001 - never 5xx-loop Telegram's retries
            self._json(200, {"ok": True})
            return

        self._json(200, {"ok": True})
