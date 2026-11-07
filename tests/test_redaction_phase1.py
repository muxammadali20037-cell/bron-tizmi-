from telegram_guard.security.redaction import REDACTED, redact_mapping, redact_text

from conftest import FAKE_BOT_TOKEN


def test_bot_token_is_scrubbed_from_free_text():
    text = f"starting bot with {FAKE_BOT_TOKEN} now"
    result = redact_text(text)
    assert FAKE_BOT_TOKEN not in result
    assert REDACTED in result


def test_bot_token_in_url_is_scrubbed():
    text = f"GET https://api.telegram.org/bot{FAKE_BOT_TOKEN}/getUpdates"
    assert FAKE_BOT_TOKEN not in redact_text(text)


def test_bot_token_key_is_sensitive():
    assert redact_mapping({"bot_token": FAKE_BOT_TOKEN})["bot_token"] == REDACTED


def test_ordinary_numbers_are_not_touched():
    assert redact_text("update_id 123456789 chat 42") == "update_id 123456789 chat 42"
