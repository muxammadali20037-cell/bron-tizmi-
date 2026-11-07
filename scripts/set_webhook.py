#!/usr/bin/env python3
"""Register (or delete) the Telegram webhook for the deployed bot.

Run this locally once the Vercel deployment is live and BOT_TOKEN is set.
The token is read from the environment and never printed.

Usage:
    BOT_TOKEN=... WEBHOOK_SECRET=... python scripts/set_webhook.py https://<app>.vercel.app
    BOT_TOKEN=... python scripts/set_webhook.py --delete
"""

import json
import os
import sys
import urllib.request


def _call(token: str, method: str, payload: dict) -> dict:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/{method}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read())


def main() -> int:
    token = os.environ.get("BOT_TOKEN")
    if not token:
        print("BOT_TOKEN environment variable is required.", file=sys.stderr)
        return 1

    args = sys.argv[1:]
    if args and args[0] == "--delete":
        result = _call(token, "deleteWebhook", {"drop_pending_updates": False})
        print("deleteWebhook:", result.get("description", result))
        return 0

    if not args:
        print("Usage: python scripts/set_webhook.py https://<app>.vercel.app", file=sys.stderr)
        return 1

    base = args[0].rstrip("/")
    payload = {
        "url": f"{base}/api/webhook",
        "allowed_updates": ["message"],
        "max_connections": 40,
    }
    secret = os.environ.get("WEBHOOK_SECRET")
    if secret:
        payload["secret_token"] = secret

    result = _call(token, "setWebhook", payload)
    print("setWebhook:", result.get("description", result))
    info = _call(token, "getWebhookInfo", {})
    # getWebhookInfo echoes the URL (not the token), safe to show.
    print("getWebhookInfo:", json.dumps(info.get("result", {}), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
