import hashlib
import hmac
import json
import threading
import time
import urllib.request
from urllib.parse import urlencode

import pytest

from telegram_guard.bot.content import CHECKLIST
from telegram_guard.bot.store import ChecklistStore
from telegram_guard.miniapp.server import build_server

from conftest import FAKE_BOT_TOKEN


def _init_data(user_id: int, token: str = FAKE_BOT_TOKEN) -> str:
    fields = {
        "auth_date": str(int(time.time())),
        "user": json.dumps({"id": user_id, "first_name": "Ali"}),
    }
    data_check = "\n".join(f"{k}={fields[k]}" for k in sorted(fields))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    fields["hash"] = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
    return urlencode(fields)


@pytest.fixture
def server():
    store = ChecklistStore()
    srv = build_server("127.0.0.1", 0, bot_token=FAKE_BOT_TOKEN, store=store)
    thread = threading.Thread(target=srv.serve_forever, daemon=True)
    thread.start()
    host, port = srv.server_address
    yield f"http://{host}:{port}", store
    srv.shutdown()
    srv.server_close()
    store.close()


def _post(base: str, path: str, payload: dict):
    req = urllib.request.Request(
        base + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read())


def test_index_is_served(server):
    base, _ = server
    with urllib.request.urlopen(base + "/", timeout=5) as resp:
        body = resp.read().decode()
    assert "Telegram Guard" in body
    assert "telegram-web-app.js" in body


def test_state_requires_valid_init_data(server):
    base, _ = server
    status, body = _post(base, "/api/state", {"initData": "hash=deadbeef&auth_date=1"})
    assert status == 403
    assert "error" in body


def test_valid_init_data_returns_checklist(server):
    base, _ = server
    status, body = _post(base, "/api/state", {"initData": _init_data(1001)})
    assert status == 200
    assert body["user"]["id"] == 1001
    assert body["total"] == len(CHECKLIST)
    assert body["completed"] == 0


def test_marking_done_updates_state_for_that_user(server):
    base, store = server
    first = CHECKLIST[0].id
    status, body = _post(base, "/api/done", {"initData": _init_data(2002), "id": first})
    assert status == 200
    assert body["completed"] == 1
    assert first in store.get_done(2002)


def test_unknown_item_is_rejected(server):
    base, _ = server
    status, _ = _post(base, "/api/done", {"initData": _init_data(3003), "id": "bogus"})
    assert status == 400


def test_health_endpoint_leaks_nothing(server):
    base, _ = server
    with urllib.request.urlopen(base + "/health", timeout=5) as resp:
        body = json.loads(resp.read())
    assert body == {"ok": True}
