import pytest
from pydantic import ValidationError

from telegram_guard.config import Settings

from conftest import FAKE_API_HASH, FAKE_API_ID


def test_manual_mode_is_default():
    settings = Settings(_env_file=None)
    assert settings.guard_mode == "manual"
    assert settings.auto_terminate_sessions is False


def test_automatic_termination_is_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, auto_terminate_sessions=True)


def test_invalid_api_id_is_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, tg_api_id=0)


def test_shipped_env_example_loads(example_env):
    """Regression: `cp .env.example .env` used to crash on `TG_API_ID=` (empty)."""
    settings = Settings()
    assert settings.tg_api_id is None
    assert settings.tg_api_hash is None
    assert settings.guard_mode == "manual"
    assert settings.auto_terminate_sessions is False
    assert settings.log_level == "INFO"


def test_configured_values_are_loaded(write_env):
    write_env(f"TG_API_ID={FAKE_API_ID}\nTG_API_HASH={FAKE_API_HASH}\n")
    settings = Settings()
    assert settings.tg_api_id == int(FAKE_API_ID)
    assert settings.tg_api_hash is not None
    assert settings.tg_api_hash.get_secret_value() == FAKE_API_HASH
    assert FAKE_API_HASH not in repr(settings)
    assert FAKE_API_HASH not in str(settings)
    assert FAKE_API_HASH not in settings.model_dump_json()


def test_auto_termination_rejected_from_env_file(write_env):
    write_env("AUTO_TERMINATE_SESSIONS=true\n")
    with pytest.raises(ValidationError):
        Settings()


def test_auto_termination_rejected_from_environment(monkeypatch):
    monkeypatch.setenv("AUTO_TERMINATE_SESSIONS", "1")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_are_immutable_at_runtime():
    """Regression: attribute assignment used to bypass the auto-termination validator."""
    settings = Settings(_env_file=None)
    with pytest.raises(ValidationError):
        settings.auto_terminate_sessions = True  # type: ignore[misc]
    assert settings.auto_terminate_sessions is False


def test_validation_errors_never_echo_input():
    """Regression: a secret pasted into the wrong field was echoed in the error text."""
    with pytest.raises(ValidationError) as excinfo:
        Settings(_env_file=None, tg_api_id=FAKE_API_HASH)
    assert FAKE_API_HASH not in str(excinfo.value)
    assert FAKE_API_HASH not in repr(excinfo.value)


@pytest.mark.parametrize(
    "bad_hash",
    ["short", FAKE_API_HASH + "00", "z" * 32, FAKE_API_HASH[:-1] + "g"],
)
def test_malformed_api_hash_is_rejected_without_echo(bad_hash):
    with pytest.raises(ValidationError) as excinfo:
        Settings(_env_file=None, tg_api_hash=bad_hash)
    assert bad_hash not in str(excinfo.value)


def test_api_hash_surrounding_whitespace_is_stripped():
    settings = Settings(_env_file=None, tg_api_hash=f"  {FAKE_API_HASH}  ")
    assert settings.tg_api_hash is not None
    assert settings.tg_api_hash.get_secret_value() == FAKE_API_HASH


@pytest.mark.parametrize(("raw", "expected"), [("info", "INFO"), (" Debug ", "DEBUG")])
def test_log_level_is_case_insensitive(raw, expected):
    assert Settings(_env_file=None, log_level=raw).log_level == expected


def test_unknown_guard_mode_is_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, guard_mode="auto")


def test_secret_values_lists_only_configured_secrets():
    assert Settings(_env_file=None).secret_values() == ()
    configured = Settings(_env_file=None, tg_api_hash=FAKE_API_HASH)
    assert configured.secret_values() == (FAKE_API_HASH,)
