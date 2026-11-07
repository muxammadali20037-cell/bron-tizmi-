import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import pytest

from telegram_guard.miniapp.auth import InitDataError, validate_init_data

from conftest import FAKE_BOT_TOKEN


def _sign(fields: dict[str, str], token: str) -> str:
    """Independently build a valid initData string (mirrors Telegram's spec)."""
    data_check_string = "\n".join(f"{k}={fields[k]}" for k in sorted(fields))
    secret_key = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    digest = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return urlencode({**fields, "hash": digest})


def _fields(user_id: int = 42, auth_date: int | None = None) -> dict[str, str]:
    return {
        "auth_date": str(auth_date if auth_date is not None else int(time.time())),
        "query_id": "AAEx",
        "user": json.dumps({"id": user_id, "first_name": "Ali", "username": "ali"}),
    }


def test_valid_init_data_is_accepted():
    init_data = _sign(_fields(user_id=777), FAKE_BOT_TOKEN)
    user = validate_init_data(init_data, FAKE_BOT_TOKEN)
    assert user.id == 777
    assert user.first_name == "Ali"
    assert user.username == "ali"


def test_tampered_payload_is_rejected():
    fields = _fields(user_id=42)
    init_data = _sign(fields, FAKE_BOT_TOKEN)
    # Flip the user id but keep the original hash.
    tampered = init_data.replace("%2242%22", "%2243%22").replace("id%22%3A+42", "id%22%3A+43")
    if tampered == init_data:
        tampered = init_data.replace("Ali", "Eve")
    with pytest.raises(InitDataError):
        validate_init_data(tampered, FAKE_BOT_TOKEN)


def test_wrong_token_is_rejected():
    init_data = _sign(_fields(), FAKE_BOT_TOKEN)
    other = "987654321:BBDifferentTokenValue_still_fake_000000000000"
    with pytest.raises(InitDataError):
        validate_init_data(init_data, other)


def test_missing_hash_is_rejected():
    fields = _fields()
    with pytest.raises(InitDataError, match="hash"):
        validate_init_data(urlencode(fields), FAKE_BOT_TOKEN)


def test_expired_init_data_is_rejected():
    old = int(time.time()) - 90000
    init_data = _sign(_fields(auth_date=old), FAKE_BOT_TOKEN)
    with pytest.raises(InitDataError, match="muddati"):
        validate_init_data(init_data, FAKE_BOT_TOKEN, max_age_seconds=86400)


def test_future_auth_date_is_rejected():
    future = int(time.time()) + 10000
    init_data = _sign(_fields(auth_date=future), FAKE_BOT_TOKEN)
    with pytest.raises(InitDataError):
        validate_init_data(init_data, FAKE_BOT_TOKEN)


def test_expiry_can_be_disabled():
    old = int(time.time()) - 90000
    init_data = _sign(_fields(auth_date=old), FAKE_BOT_TOKEN)
    user = validate_init_data(init_data, FAKE_BOT_TOKEN, max_age_seconds=None)
    assert user.id == 42


def test_empty_inputs_are_rejected():
    with pytest.raises(InitDataError):
        validate_init_data("", FAKE_BOT_TOKEN)
    with pytest.raises(InitDataError):
        validate_init_data(_sign(_fields(), FAKE_BOT_TOKEN), "")


def test_missing_user_is_rejected():
    fields = {"auth_date": str(int(time.time())), "query_id": "AAEx"}
    with pytest.raises(InitDataError, match="user"):
        validate_init_data(_sign(fields, FAKE_BOT_TOKEN), FAKE_BOT_TOKEN)


def test_signature_field_is_ignored_in_check():
    """A newer Ed25519 `signature` field must not break HMAC validation."""
    fields = _fields(user_id=5)
    # Build the HMAC over everything except hash/signature, then add signature.
    data_check = "\n".join(f"{k}={fields[k]}" for k in sorted(fields))
    secret = hmac.new(b"WebAppData", FAKE_BOT_TOKEN.encode(), hashlib.sha256).digest()
    digest = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
    init_data = urlencode({**fields, "signature": "abc", "hash": digest})
    user = validate_init_data(init_data, FAKE_BOT_TOKEN)
    assert user.id == 5
