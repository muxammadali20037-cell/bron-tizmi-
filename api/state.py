"""Vercel serverless function: mini app state.

Returns the signed-in user's checklist. Requires a valid Telegram initData
signature, so only the real Telegram user (for this bot token) can read it.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from telegram_guard.deploy.supabase_store import SupabaseStore
from telegram_guard.miniapp.auth import InitDataError, validate_init_data
from telegram_guard.miniapp.view import state_payload

MAX_BODY = 64 * 1024


class ConfigError(RuntimeError):
    pass


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ConfigError(f"Missing environment variable: {name}")
    return value


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        return

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0 or length > MAX_BODY:
            self._json(400, {"error": "bad request"})
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            user = validate_init_data(body.get("initData", ""), _require("BOT_TOKEN"))
            store = SupabaseStore(_require("SUPABASE_URL"), _require("SUPABASE_KEY"))
            payload = state_payload(user, store)
        except InitDataError as exc:
            self._json(403, {"error": str(exc)})
            return
        except ConfigError as exc:
            self._json(500, {"error": str(exc)})
            return
        except ValueError:
            self._json(400, {"error": "bad request"})
            return
        self._json(200, payload)
