"""Helpers for masking sensitive values before display or logging.

Two layers:

* ``redact_mapping`` / ``redact_value`` mask structured data by key name.
* ``redact_text`` scrubs free text (log lines, tracebacks): known secret values,
  ``key=value`` pairs with sensitive keys, international phone numbers and
  credentials embedded in URLs.

Text redaction is a heuristic safety net, not a guarantee. Code must still avoid
passing secrets to loggers in the first place.
"""

import re
from collections.abc import Iterable, Mapping
from typing import Any

REDACTED = "[REDACTED]"
TRUNCATED = "[TRUNCATED]"
MAX_DEPTH = 20
MIN_SECRET_LENGTH = 6

# Exact key names (after normalisation, see ``normalize_key``).
SENSITIVE_KEYS = {
    "api_hash",
    "tg_api_hash",
    "api_key",
    "phone",
    "phone_number",
    "phone_code",
    "phone_code_hash",
    "password",
    "two_factor_password",
    "2fa_password",
    "login_code",
    "code",
    "otp",
    "session",
    "session_string",
    "string_session",
    "session_file",
    "auth_key",
    "authorization",
    "access_token",
    "refresh_token",
    "bot_token",
    "token",
    "secret",
    "client_secret",
    "cookie",
    "set_cookie",
    "private_key",
}

# Any normalised key containing one of these fragments is sensitive as well.
# Deliberately excludes generic words such as "session" or "code" so that
# metadata like ``sessions`` or ``country_code`` stays readable.
SENSITIVE_KEY_FRAGMENTS = (
    "password",
    "passwd",
    "secret",
    "token",
    "api_hash",
    "auth_key",
    "private_key",
    "cookie",
)

_CAMEL_BOUNDARY = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")
_NON_ALNUM = re.compile(r"[^a-z0-9]+")

_SENSITIVE_KEY_PATTERN = (
    r"[A-Za-z0-9_-]*"
    r"(?:api[_-]?hash|api[_-]?key|password|passwd|secret|token|auth[_-]?key|cookie"
    r"|session[_-]?string|string[_-]?session|login[_-]?code|phone[_-]?code(?:[_-]?hash)?)"
    r"[A-Za-z0-9_-]*"
)
_KEY_VALUE = re.compile(
    rf"(?i)(?<![A-Za-z0-9_-])(?P<key>{_SENSITIVE_KEY_PATTERN})(?P<kq>['\"]?)(?P<sep>\s*[=:]\s*)"
    r"(?:(?P<q>['\"])(?P<qval>[^'\"]*)(?P=q)|(?P<val>[^\s'\",;&})\]]+))"
)
_PHONE = re.compile(r"(?<![\w+])\+\d(?:[\s().-]{0,2}\d){6,14}(?!\d)")
_URL_CREDENTIALS = re.compile(r"(?i)(?P<scheme>\b[a-z][a-z0-9+.-]*://)[^\s:/@]+:[^\s@/]+@")
# Telegram bot token: numeric id, colon, long secret (@BotFather format).
# No leading \b so it is still caught when glued to text such as ".../bot<token>/".
_BOT_TOKEN = re.compile(r"(?<!\d)\d{6,12}:[A-Za-z0-9_-]{30,}(?![A-Za-z0-9_-])")


def normalize_key(key: Any) -> str:
    """Normalise ``apiHash``, ``API-HASH``, ``api hash`` etc. to ``api_hash``."""
    text = _CAMEL_BOUNDARY.sub("_", str(key))
    return _NON_ALNUM.sub("_", text.lower()).strip("_")


def is_sensitive_key(key: Any) -> bool:
    normalized = normalize_key(key)
    return normalized in SENSITIVE_KEYS or any(
        fragment in normalized for fragment in SENSITIVE_KEY_FRAGMENTS
    )


def redact_value(key: Any, value: Any, _depth: int = 0) -> Any:
    if _depth > MAX_DEPTH:
        return TRUNCATED
    if is_sensitive_key(key) and value is not None and value != "":
        return REDACTED
    if isinstance(value, Mapping):
        return redact_mapping(value, _depth=_depth + 1)
    if isinstance(value, list | tuple | set | frozenset):
        items = [redact_value(key, item, _depth + 1) for item in value]
        return tuple(items) if isinstance(value, tuple) else items
    return value


def redact_mapping(data: Mapping[Any, Any], _depth: int = 0) -> dict[Any, Any]:
    if _depth > MAX_DEPTH:
        return {"...": TRUNCATED}
    return {key: redact_value(key, value, _depth) for key, value in data.items()}


def _redact_key_value(match: re.Match[str]) -> str:
    quote = match.group("q") or ""
    return f"{match.group('key')}{match.group('kq')}{match.group('sep')}{quote}{REDACTED}{quote}"


def redact_text(text: str, secrets: Iterable[str] = ()) -> str:
    """Scrub secrets from free text such as a formatted log record."""
    for secret in sorted({s for s in secrets if s}, key=len, reverse=True):
        if len(secret) >= MIN_SECRET_LENGTH:
            text = text.replace(secret, REDACTED)
    text = _BOT_TOKEN.sub(REDACTED, text)
    text = _URL_CREDENTIALS.sub(rf"\g<scheme>{REDACTED}@", text)
    text = _KEY_VALUE.sub(_redact_key_value, text)
    return _PHONE.sub(REDACTED, text)
