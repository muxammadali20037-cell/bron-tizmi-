import pytest

from telegram_guard.security.redaction import (
    REDACTED,
    TRUNCATED,
    is_sensitive_key,
    normalize_key,
    redact_mapping,
    redact_text,
)

from conftest import FAKE_API_HASH


def test_sensitive_fields_are_redacted_recursively():
    source = {
        "device": "My laptop",
        "phone": "+998901234567",
        "nested": {"api_hash": "secret-hash", "status": "active"},
        "items": [{"session": "secret-session"}],
    }
    result = redact_mapping(source)

    assert result["device"] == "My laptop"
    assert result["phone"] == "[REDACTED]"
    assert result["nested"]["api_hash"] == "[REDACTED]"
    assert result["nested"]["status"] == "active"
    assert result["items"][0]["session"] == "[REDACTED]"


@pytest.mark.parametrize(
    "key",
    [
        "api_hash",
        "API_HASH",
        "api-hash",
        "apiHash",
        "TG-API-HASH",
        "phone_code_hash",
        "phoneCodeHash",
        "auth_key",
        "bot_token",
        "client_secret",
        "2fa_password",
        "user_password",
        "string_session",
        "Set-Cookie",
    ],
)
def test_key_name_variants_are_sensitive(key):
    assert is_sensitive_key(key)
    assert redact_mapping({key: "value"})[key] == REDACTED


@pytest.mark.parametrize(
    "key",
    ["device_model", "platform", "app_name", "ip", "country", "country_code", "sessions", "status"],
)
def test_session_metadata_keys_stay_visible(key):
    assert not is_sensitive_key(key)
    assert redact_mapping({key: "value"})[key] == "value"


def test_session_list_metadata_is_not_hidden_wholesale():
    data = {"sessions": [{"device_model": "Pixel", "session": "s3cr3t"}]}
    result = redact_mapping(data)
    assert result["sessions"][0]["device_model"] == "Pixel"
    assert result["sessions"][0]["session"] == REDACTED


def test_normalize_key():
    assert normalize_key("apiHash") == "api_hash"
    assert normalize_key(" API-Hash ") == "api_hash"
    assert normalize_key(42) == "42"


def test_tuples_and_sets_are_walked():
    result = redact_mapping({"items": ({"token": "t"},), "tags": {"a"}})
    assert result["items"] == ({"token": REDACTED},)
    assert result["tags"] == ["a"]


def test_non_string_keys_do_not_crash():
    assert redact_mapping({1: "a", None: "b"}) == {1: "a", None: "b"}


def test_empty_and_none_sensitive_values_are_kept():
    assert redact_mapping({"password": None, "token": ""}) == {"password": None, "token": ""}


def test_cyclic_structures_are_truncated_not_crashing():
    data: dict = {"name": "loop"}
    data["self"] = data
    result = redact_mapping(data)
    flattened = repr(result)
    assert TRUNCATED in flattened


@pytest.mark.parametrize(
    ("text", "leaked"),
    [
        (f"api_hash={FAKE_API_HASH}", FAKE_API_HASH),
        (f"TG_API_HASH = {FAKE_API_HASH}", FAKE_API_HASH),
        ("{'password': 'hunter22'}", "hunter22"),
        ('{"bot_token": "123:ABC"}', "123:ABC"),
        ("login_code: 54321", "54321"),
        ("phone_code_hash=abcdef123", "abcdef123"),
        ('password="two words"', "two words"),
        ("call +998901234567 now", "+998901234567"),
        ("call +998 90 123 45 67 now", "90 123 45 67"),
        ("db postgres://admin:pa55word@db.local/app", "pa55word"),
    ],
)
def test_redact_text_scrubs_secrets(text, leaked):
    result = redact_text(text)
    assert leaked not in result
    assert REDACTED in result


def test_redact_text_removes_known_secret_values_anywhere():
    text = f"unexpected context {FAKE_API_HASH} in message"
    assert redact_text(text, secrets=[FAKE_API_HASH]) == f"unexpected context {REDACTED} in message"


def test_redact_text_ignores_too_short_known_secrets():
    assert redact_text("a b c", secrets=["a", ""]) == "a b c"


@pytest.mark.parametrize(
    "text",
    [
        "device_model=iPhone 15, platform=iOS",
        "status code: 404",
        "Found 3 active sessions",
        "user_id=123456789",
        "sqlite:///./data/telegram_guard.db",
    ],
)
def test_redact_text_leaves_ordinary_text_alone(text):
    assert redact_text(text) == text
