"""Minimal local server for the mini app.

Serves one static page and a tiny JSON API. Every API call must carry a valid
Telegram ``initData`` string, so only the real Telegram user (for this bot token)
can read or change their own checklist. No account data is ever accessed.

For production, run this behind an HTTPS reverse proxy (Telegram requires HTTPS for
the WebApp URL); the server itself binds to localhost by default.
"""

import json
import logging
from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from telegram_guard.bot.content import CHECKLIST
from telegram_guard.bot.store import ChecklistStore
from telegram_guard.miniapp.auth import InitDataError, MiniAppUser, validate_init_data
from telegram_guard.miniapp.view import state_payload as _state_payload

logger = logging.getLogger(__name__)
STATIC_DIR = Path(__file__).parent / "static"
MAX_BODY_BYTES = 64 * 1024


class MiniAppHandler(BaseHTTPRequestHandler):
    # Injected by the factory below.
    bot_token: str = ""
    store: ChecklistStore
    max_age: int = 86400
    owner_id: int | None = None

    def log_message(self, fmt: str, *args: object) -> None:  # silence default stderr logging
        logger.debug("miniapp %s", fmt % args)

    # --- helpers -------------------------------------------------------
    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0 or length > MAX_BODY_BYTES:
            raise ValueError("bad length")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def _authenticate(self, body: dict) -> MiniAppUser:
        user = validate_init_data(
            body.get("initData", ""), self.bot_token, max_age_seconds=self.max_age
        )
        if self.owner_id is not None and user.id != self.owner_id:
            raise InitDataError("Bu mini app faqat egasi uchun.")
        return user

    # --- routes --------------------------------------------------------
    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            self._serve_static("index.html", "text/html; charset=utf-8")
        elif path == "/health":
            self._send_json(200, {"ok": True})
        else:
            self._send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0]
        if path not in ("/api/state", "/api/done"):
            self._send_json(404, {"error": "not found"})
            return
        try:
            body = self._read_json()
            user = self._authenticate(body)
        except InitDataError as exc:
            self._send_json(403, {"error": str(exc)})
            return
        except ValueError:
            self._send_json(400, {"error": "yaroqsiz so‘rov"})
            return

        if path == "/api/done":
            item_id = body.get("id")
            if item_id not in {item.id for item in CHECKLIST}:
                self._send_json(400, {"error": "noma’lum qadam"})
                return
            self.store.mark_done(user.id, item_id)
        self._send_json(200, _state_payload(user, self.store))

    def _serve_static(self, name: str, content_type: str) -> None:
        file_path = (STATIC_DIR / name).resolve()
        if not file_path.is_file() or STATIC_DIR.resolve() not in file_path.parents:
            self._send_json(404, {"error": "not found"})
            return
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def build_server(
    host: str,
    port: int,
    *,
    bot_token: str,
    store: ChecklistStore,
    max_age: int = 86400,
    owner_id: int | None = None,
) -> ThreadingHTTPServer:
    handler = partial(MiniAppHandler)
    # Bind configuration onto the handler class (one server, one bot token).
    MiniAppHandler.bot_token = bot_token
    MiniAppHandler.store = store
    MiniAppHandler.max_age = max_age
    MiniAppHandler.owner_id = owner_id
    return ThreadingHTTPServer((host, port), handler)
