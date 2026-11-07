"""Typed application configuration.

Phase 1 (safe profile) talks ONLY to the Telegram Bot API with a bot token, and
only when the user explicitly runs the ``bot`` or ``miniapp`` command. It never
logs into a user account, never asks for a login code or 2FA password, and never
creates a user session. The ``doctor`` and ``config-check`` commands stay fully
offline.
"""

import re
from functools import lru_cache
from pathlib import Path
from string import hexdigits
from typing import Any, Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = ".env"
API_HASH_LENGTH = 32
# A bot token from @BotFather looks like `123456789:AA...` (id, colon, 35-char secret).
BOT_TOKEN_RE = re.compile(r"\A\d{6,12}:[A-Za-z0-9_-]{30,}\Z")
DEFAULT_STATE_DIR = "~/.telegram-guard"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        # `.env.example` ships empty values (e.g. `BOT_TOKEN=`): empty means "not set".
        env_ignore_empty=True,
        extra="ignore",
        case_sensitive=False,
        # Settings are immutable after load, so validators (e.g. the auto-termination
        # guard) cannot be bypassed by attribute assignment at runtime.
        frozen=True,
        # Never echo raw input values in ValidationError text: a mistyped field may
        # contain a secret (for example a bot token pasted into the wrong field).
        hide_input_in_errors=True,
    )

    # --- Phase 0 scaffold (unused by the safe bot; kept for later, account-free) ---
    tg_api_id: int | None = None
    tg_api_hash: SecretStr | None = None
    guard_mode: Literal["manual"] = "manual"
    auto_terminate_sessions: bool = Field(default=False)
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    database_url: str = "sqlite:///./data/telegram_guard.db"

    # --- Phase 1: bot + mini app (no account access) ---
    bot_token: SecretStr | None = None
    # Optional: Telegram numeric user id to send proactive reminders to.
    bot_owner_id: int | None = None
    # Public HTTPS URL of the mini app, used for the WebApp button (optional).
    miniapp_url: str | None = None
    miniapp_host: str = "127.0.0.1"
    miniapp_port: int = 8720
    # Local directory for the bot's SQLite state (per-chat checklist progress).
    state_dir: str = DEFAULT_STATE_DIR
    # Reject auth_date older than this when validating mini app initData (seconds).
    miniapp_init_data_max_age: int = 86400

    @field_validator("guard_mode", mode="before")
    @classmethod
    def normalize_guard_mode(cls, value: Any) -> Any:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("log_level", mode="before")
    @classmethod
    def normalize_log_level(cls, value: Any) -> Any:
        return value.strip().upper() if isinstance(value, str) else value

    @field_validator("tg_api_id")
    @classmethod
    def api_id_must_be_positive(cls, value: int | None) -> int | None:
        if value is not None and value <= 0:
            raise ValueError("TG_API_ID musbat son bo‘lishi kerak.")
        return value

    @field_validator("tg_api_hash")
    @classmethod
    def api_hash_must_be_hex(cls, value: SecretStr | None) -> SecretStr | None:
        if value is None:
            return None
        raw = value.get_secret_value().strip()
        if not raw:
            return None
        if len(raw) != API_HASH_LENGTH or any(ch not in hexdigits for ch in raw):
            raise ValueError(
                f"TG_API_HASH {API_HASH_LENGTH} ta hex belgidan (0-9, a-f) iborat bo‘lishi kerak."
            )
        return SecretStr(raw)

    @field_validator("bot_token")
    @classmethod
    def bot_token_must_be_well_formed(cls, value: SecretStr | None) -> SecretStr | None:
        if value is None:
            return None
        raw = value.get_secret_value().strip()
        if not raw:
            return None
        if not BOT_TOKEN_RE.match(raw):
            # The message must never include the value itself.
            raise ValueError(
                "BOT_TOKEN formati noto‘g‘ri. @BotFather bergan `123456789:ABC...` "
                "ko‘rinishida bo‘lishi kerak."
            )
        return SecretStr(raw)

    @field_validator("bot_owner_id")
    @classmethod
    def owner_id_must_be_positive(cls, value: int | None) -> int | None:
        if value is not None and value <= 0:
            raise ValueError("BOT_OWNER_ID musbat son bo‘lishi kerak.")
        return value

    @field_validator("miniapp_port")
    @classmethod
    def port_must_be_valid(cls, value: int) -> int:
        if not (1 <= value <= 65535):
            raise ValueError("MINIAPP_PORT 1–65535 oralig‘ida bo‘lishi kerak.")
        return value

    @field_validator("auto_terminate_sessions")
    @classmethod
    def auto_termination_must_remain_disabled(cls, value: bool) -> bool:
        if value:
            raise ValueError(
                "Avtomatik sessiya tugatish taqiqlangan. "
                "AUTO_TERMINATE_SESSIONS=false bo‘lishi kerak."
            )
        return value

    @property
    def bot_configured(self) -> bool:
        return self.bot_token is not None

    def resolved_state_dir(self) -> Path:
        return Path(self.state_dir).expanduser()

    def state_db_path(self) -> Path:
        return self.resolved_state_dir() / "bot_state.sqlite3"

    def secret_values(self) -> tuple[str, ...]:
        """Raw secret strings that must never appear in logs or output."""
        secrets: list[str] = []
        if self.tg_api_hash is not None:
            secrets.append(self.tg_api_hash.get_secret_value())
        if self.bot_token is not None:
            secrets.append(self.bot_token.get_secret_value())
        return tuple(secrets)


@lru_cache
def get_settings() -> Settings:
    return Settings()
