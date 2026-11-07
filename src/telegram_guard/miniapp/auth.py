"""Validate Telegram Mini App ``initData``.

Implements Telegram's documented HMAC-SHA256 scheme:

    secret_key   = HMAC_SHA256(key="WebAppData", msg=bot_token)
    data_check   = "\\n".join(f"{k}={v}" for k, v in sorted(pairs if k != "hash"))
    expected     = hex(HMAC_SHA256(key=secret_key, msg=data_check))
    valid        <=> constant_time_eq(expected, provided_hash)

A valid signature proves the data came from Telegram for this exact bot token and
was not tampered with. ``auth_date`` is additionally checked for freshness so a
captured initData string cannot be replayed indefinitely.
"""

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qsl


class InitDataError(ValueError):
    """Raised when initData is missing, malformed, stale or has a bad signature."""


@dataclass(frozen=True)
class MiniAppUser:
    id: int
    first_name: str
    username: str | None
    auth_date: int
    raw: dict[str, str]


def _data_check_string(pairs: list[tuple[str, str]]) -> str:
    return "\n".join(f"{key}={value}" for key, value in sorted(pairs))


def _expected_hash(bot_token: str, data_check_string: str) -> str:
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    return hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()


def validate_init_data(
    init_data: str,
    bot_token: str,
    *,
    max_age_seconds: int | None = 86400,
    now: float | None = None,
) -> MiniAppUser:
    if not init_data:
        raise InitDataError("initData bo‘sh.")
    if not bot_token:
        raise InitDataError("Bot token berilmagan.")

    pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=False)
    fields = dict(pairs)
    provided_hash = fields.pop("hash", None)
    if not provided_hash:
        raise InitDataError("initData ichida hash yo‘q.")

    # Exclude `hash` (and the Ed25519 `signature`, if present) from the check string.
    check_pairs = [(k, v) for k, v in pairs if k not in ("hash", "signature")]
    expected = _expected_hash(bot_token, _data_check_string(check_pairs))
    if not hmac.compare_digest(expected, provided_hash):
        raise InitDataError("initData imzosi noto‘g‘ri.")

    auth_date_raw = fields.get("auth_date", "")
    if not auth_date_raw.isdigit():
        raise InitDataError("auth_date yaroqsiz.")
    auth_date = int(auth_date_raw)
    if max_age_seconds is not None:
        current = time.time() if now is None else now
        if current - auth_date > max_age_seconds:
            raise InitDataError("initData muddati o‘tgan.")
        if auth_date - current > 300:
            raise InitDataError("auth_date kelajakda — soat noto‘g‘ri yoki soxta.")

    return _parse_user(fields, auth_date)


def _parse_user(fields: dict[str, str], auth_date: int) -> MiniAppUser:
    user_raw = fields.get("user")
    if not user_raw:
        raise InitDataError("initData ichida user yo‘q.")
    try:
        user: dict[str, Any] = json.loads(user_raw)
    except ValueError as exc:
        raise InitDataError("user JSON yaroqsiz.") from exc
    user_id = user.get("id")
    if not isinstance(user_id, int):
        raise InitDataError("user.id yaroqsiz.")
    return MiniAppUser(
        id=user_id,
        first_name=str(user.get("first_name", "")),
        username=user.get("username"),
        auth_date=auth_date,
        raw=fields,
    )
