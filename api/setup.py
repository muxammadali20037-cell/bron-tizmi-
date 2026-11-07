"""Vercel serverless function: one-click setup + diagnostics.

Open `GET /api/setup?secret=<WEBHOOK_SECRET>` once (in a browser) after the env
vars are set. It registers the Telegram webhook (so Telegram delivers updates to
/api/webhook) and reports which environment variables are missing and whether
Supabase is reachable. The bot token is read from the environment and never shown.
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from telegram_guard.deploy.supabase_store import SupabaseStore, SupabaseStoreError

REQUIRED = ("BOT_TOKEN", "SUPABASE_URL", "SUPABASE_KEY", "WEBHOOK_SECRET")


def _tg(token: str, method: str, params: dict) -> dict:
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(  # noqa: S310 - fixed api.telegram.org host
        f"https://api.telegram.org/bot{token}/{method}", data=data, method="POST"
    )
    with urllib.request.urlopen(req, timeout=20) as resp:  # noqa: S310
        return json.loads(resp.read())


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        return

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        secret_env = os.environ.get("WEBHOOK_SECRET")
        given = (query.get("secret") or [""])[0]
        if not secret_env or given != secret_env:
            self._json(403, {"ok": False, "error": "forbidden: ?secret noto‘g‘ri"})
            return

        missing = [name for name in REQUIRED if not os.environ.get(name)]
        if missing:
            self._json(
                400,
                {
                    "ok": False,
                    "missing_env": missing,
                    "hint": "Vercel → Settings → Environment Variables da qo‘shing, keyin qayta deploy qiling.",
                },
            )
            return

        # Supabase check (does the key work / table reachable?).
        supabase_ok, supabase_error = True, None
        try:
            SupabaseStore(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"]).get_done(0)
        except SupabaseStoreError as exc:
            supabase_ok, supabase_error = False, str(exc)

        token = os.environ["BOT_TOKEN"]
        base = f"https://{self.headers.get('Host')}"
        webhook_url = f"{base}/api/webhook"
        try:
            me = _tg(token, "getMe", {})
            set_res = _tg(
                token,
                "setWebhook",
                {
                    "url": webhook_url,
                    "secret_token": secret_env,
                    "allowed_updates": json.dumps(["message"]),
                },
            )
            info = _tg(token, "getWebhookInfo", {})
        except Exception as exc:  # noqa: BLE001
            self._json(502, {"ok": False, "error": f"Telegram xatosi: {exc}"})
            return

        self._json(
            200,
            {
                "ok": bool(set_res.get("ok")) and supabase_ok,
                "bot_username": me.get("result", {}).get("username"),
                "webhook_registered": set_res.get("description", set_res),
                "webhook_url": webhook_url,
                "supabase_ok": supabase_ok,
                "supabase_error": supabase_error,
                "webhook_info": info.get("result"),
                "next": "Telegram’da botга /start yozing.",
            },
        )
