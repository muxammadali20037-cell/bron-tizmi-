import pytest
from pydantic import ValidationError

from telegram_guard.config import Settings

from conftest import FAKE_BOT_TOKEN


def test_bot_token_is_loaded_and_hidden():
    settings = Settings(_env_file=None, bot_token=FAKE_BOT_TOKEN)
    assert settings.bot_configured is True
    assert settings.bot_token.get_secret_value() == FAKE_BOT_TOKEN
    assert FAKE_BOT_TOKEN not in repr(settings)
    assert FAKE_BOT_TOKEN not in settings.model_dump_json()


def test_bot_token_is_in_secret_values():
    settings = Settings(_env_file=None, bot_token=FAKE_BOT_TOKEN)
    assert FAKE_BOT_TOKEN in settings.secret_values()


def test_no_bot_token_configured_by_default():
    settings = Settings(_env_file=None)
    assert settings.bot_configured is False
    assert settings.secret_values() == ()


@pytest.mark.parametrize(
    "bad",
    ["not-a-token", "123:short", "abc:AAFakeTokenValue_padding_padding_padding", ""],
)
def test_malformed_bot_token_is_rejected_without_echo(bad):
    if bad == "":
        # Empty behaves like "not set".
        assert Settings(_env_file=None, bot_token=bad).bot_token is None
        return
    with pytest.raises(ValidationError) as excinfo:
        Settings(_env_file=None, bot_token=bad)
    assert bad not in str(excinfo.value)


def test_owner_id_must_be_positive():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, bot_owner_id=0)


def test_invalid_port_is_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, miniapp_port=70000)


def test_auto_termination_still_frozen_and_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, auto_terminate_sessions=True)
    settings = Settings(_env_file=None)
    with pytest.raises(ValidationError):
        settings.bot_owner_id = 5  # frozen


def test_state_paths_resolve_user_home():
    settings = Settings(_env_file=None, state_dir="~/.telegram-guard")
    assert settings.state_db_path().name == "bot_state.sqlite3"
    assert "~" not in str(settings.state_db_path())
