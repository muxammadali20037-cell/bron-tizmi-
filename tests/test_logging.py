import logging

from telegram_guard.config import Settings
from telegram_guard.logging_config import RedactingFormatter, configure_logging
from telegram_guard.security.redaction import REDACTED

from conftest import FAKE_API_HASH


def test_configured_logging_redacts_secrets(capsys):
    settings = Settings(_env_file=None, tg_api_hash=FAKE_API_HASH, log_level="DEBUG")
    configure_logging(settings)
    log = logging.getLogger("telegram_guard.test")

    log.info("raw value %s", FAKE_API_HASH)
    log.info("payload %s", {"api_hash": "other-secret", "phone": "+998901234567"})
    log.debug("password=hunter22")

    err = capsys.readouterr().err
    assert FAKE_API_HASH not in err
    assert "other-secret" not in err
    assert "+998901234567" not in err
    assert "hunter22" not in err
    assert err.count(REDACTED) >= 4


def test_exception_tracebacks_are_redacted(capsys):
    configure_logging(Settings(_env_file=None, tg_api_hash=FAKE_API_HASH))
    try:
        raise RuntimeError(f"failed with {FAKE_API_HASH}")
    except RuntimeError:
        logging.getLogger("telegram_guard.test").exception("boom")

    err = capsys.readouterr().err
    assert "RuntimeError" in err
    assert FAKE_API_HASH not in err


def test_configure_logging_replaces_existing_handlers():
    root = logging.getLogger()
    root.addHandler(logging.StreamHandler())
    configure_logging(Settings(_env_file=None))
    assert len(root.handlers) == 1
    assert isinstance(root.handlers[0].formatter, RedactingFormatter)


def test_log_level_from_settings_is_applied():
    configure_logging(Settings(_env_file=None, log_level="WARNING"))
    assert logging.getLogger().level == logging.WARNING
    assert logging.getLogger("telethon").level == logging.WARNING
