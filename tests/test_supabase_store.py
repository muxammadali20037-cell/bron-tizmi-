"""SupabaseStore unit tests — no real network (urlopen is monkeypatched)."""

import io
import json

import pytest

import telegram_guard.deploy.supabase_store as store_module
from telegram_guard.bot.content import CHECKLIST
from telegram_guard.bot.protocols import ChecklistStoreLike
from telegram_guard.deploy.supabase_store import SupabaseStore, SupabaseStoreError

URL = "https://example.supabase.co"
KEY = "test-service-key"


class _Resp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


class FakeHTTP:
    """Records requests and replays canned GET rows."""

    def __init__(self):
        self.calls = []
        self.rows_by_chat: dict[int, list[str]] = {}

    def urlopen(self, request, timeout=None):
        self.calls.append(request)
        if request.method == "GET":
            chat_id = int(request.full_url.split("chat_id=eq.")[1].split("&")[0])
            rows = []
            if chat_id in self.rows_by_chat:
                rows = [{"done_ids": self.rows_by_chat[chat_id]}]
            return _Resp(json.dumps(rows).encode())
        # POST upsert
        payload = json.loads(request.data.decode())[0]
        self.rows_by_chat[payload["chat_id"]] = payload["done_ids"]
        return _Resp(b"")


@pytest.fixture
def http(monkeypatch):
    fake = FakeHTTP()
    monkeypatch.setattr(store_module.urllib.request, "urlopen", fake.urlopen)
    return fake


def test_satisfies_store_protocol():
    assert isinstance(SupabaseStore(URL, KEY), ChecklistStoreLike)


def test_requires_url_and_key():
    with pytest.raises(SupabaseStoreError):
        SupabaseStore("", KEY)
    with pytest.raises(SupabaseStoreError):
        SupabaseStore(URL, "")


def test_get_done_empty(http):
    assert SupabaseStore(URL, KEY).get_done(1) == set()


def test_mark_done_then_get(http):
    store = SupabaseStore(URL, KEY)
    first = CHECKLIST[0].id
    store.mark_done(100, first)
    assert store.get_done(100) == {first}


def test_mark_done_is_additive(http):
    store = SupabaseStore(URL, KEY)
    store.mark_done(7, CHECKLIST[0].id)
    store.mark_done(7, CHECKLIST[1].id)
    assert store.get_done(7) == {CHECKLIST[0].id, CHECKLIST[1].id}


def test_reset(http):
    store = SupabaseStore(URL, KEY)
    store.mark_done(5, CHECKLIST[0].id)
    store.reset(5)
    assert store.get_done(5) == set()


def test_unknown_item_rejected(http):
    with pytest.raises(KeyError):
        SupabaseStore(URL, KEY).mark_done(1, "nope")


def test_auth_headers_and_endpoint(http):
    SupabaseStore(URL, KEY).get_done(1)
    req = http.calls[-1]
    assert req.full_url.startswith(f"{URL}/rest/v1/tg_guard_chat_state")
    assert req.headers["Apikey"] == KEY
    assert req.headers["Authorization"] == f"Bearer {KEY}"


def test_stale_ids_filtered(http):
    http.rows_by_chat[9] = ["two_step", "ghost_item"]
    assert SupabaseStore(URL, KEY).get_done(9) == {"two_step"}


def test_http_error_is_wrapped(monkeypatch):
    import urllib.error

    def boom(request, timeout=None):
        raise urllib.error.HTTPError(request.full_url, 401, "No", {}, io.BytesIO(b"denied"))

    monkeypatch.setattr(store_module.urllib.request, "urlopen", boom)
    with pytest.raises(SupabaseStoreError, match="401"):
        SupabaseStore(URL, KEY).get_done(1)
