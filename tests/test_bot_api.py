import io
import json

import pytest

import telegram_guard.bot.api as api_module
from telegram_guard.bot.api import BotAPIError, HttpBotAPI, build_reply_markup
from telegram_guard.bot.handlers import OutgoingMessage, WebAppButton

from conftest import FAKE_BOT_TOKEN


def test_reply_markup_none_without_button():
    assert build_reply_markup(OutgoingMessage(1, "hi")) is None


def test_reply_markup_builds_web_app_button():
    msg = OutgoingMessage(1, "hi", web_app_button=WebAppButton("Open", "https://x.example/app"))
    markup = build_reply_markup(msg)
    button = markup["inline_keyboard"][0][0]
    assert button["text"] == "Open"
    assert button["web_app"] == {"url": "https://x.example/app"}


class _FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


def test_send_builds_request_without_hitting_network(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout=None):
        captured["url"] = request.full_url
        captured["body"] = json.loads(request.data.decode())
        captured["method"] = request.method
        return _FakeResponse(json.dumps({"ok": True, "result": {"message_id": 7}}).encode())

    monkeypatch.setattr(api_module.urllib.request, "urlopen", fake_urlopen)
    client = HttpBotAPI(FAKE_BOT_TOKEN)
    result = client.send(OutgoingMessage(555, "salom", parse_mode="Markdown"))

    assert result == {"message_id": 7}
    assert captured["method"] == "POST"
    assert captured["url"].endswith("/sendMessage")
    assert FAKE_BOT_TOKEN in captured["url"]  # token in URL path (expected, never logged)
    assert captured["body"]["chat_id"] == 555
    assert captured["body"]["text"] == "salom"
    assert captured["body"]["disable_web_page_preview"] is True


def test_api_error_message_never_contains_token(monkeypatch):
    def fake_urlopen(request, timeout=None):
        return _FakeResponse(json.dumps({"ok": False, "description": "Unauthorized"}).encode())

    monkeypatch.setattr(api_module.urllib.request, "urlopen", fake_urlopen)
    client = HttpBotAPI(FAKE_BOT_TOKEN)
    with pytest.raises(BotAPIError) as excinfo:
        client.send(OutgoingMessage(1, "x"))
    assert FAKE_BOT_TOKEN not in str(excinfo.value)


def test_get_updates_passes_offset(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout=None):
        captured["body"] = json.loads(request.data.decode())
        return _FakeResponse(json.dumps({"ok": True, "result": []}).encode())

    monkeypatch.setattr(api_module.urllib.request, "urlopen", fake_urlopen)
    HttpBotAPI(FAKE_BOT_TOKEN).get_updates(offset=42, timeout=5)
    assert captured["body"]["offset"] == 42
    assert captured["body"]["allowed_updates"] == ["message"]
