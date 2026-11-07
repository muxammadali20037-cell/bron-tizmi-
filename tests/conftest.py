import logging
import shutil
import socket
from pathlib import Path

import pytest


class NetworkAccessError(AssertionError):
    """Raised by the block_network fixture if code attempts a real connection."""


@pytest.fixture
def block_network(monkeypatch: pytest.MonkeyPatch):
    """Make any real socket connection fail loudly, for offline-guarantee tests."""

    def _refuse(*args, **kwargs):
        raise NetworkAccessError(f"network access attempted: {args!r}")

    monkeypatch.setattr(socket.socket, "connect", _refuse)
    monkeypatch.setattr(socket.socket, "connect_ex", _refuse)
    monkeypatch.setattr(socket, "create_connection", _refuse)
    monkeypatch.setattr(socket, "getaddrinfo", _refuse)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_EXAMPLE = PROJECT_ROOT / ".env.example"

# Obviously fake test values — never real credentials.
FAKE_API_ID = "123456"
FAKE_API_HASH = "0123456789abcdef0123456789abcdef"
# A syntactically valid but fake @BotFather-style token used only in tests.
FAKE_BOT_TOKEN = "123456789:AAFakeTokenForTestsOnly_not_a_real_secret00"

_SETTINGS_ENV_VARS = (
    "TG_API_ID",
    "TG_API_HASH",
    "GUARD_MODE",
    "AUTO_TERMINATE_SESSIONS",
    "LOG_LEVEL",
    "DATABASE_URL",
    "BOT_TOKEN",
    "BOT_OWNER_ID",
    "MINIAPP_URL",
    "MINIAPP_HOST",
    "MINIAPP_PORT",
    "STATE_DIR",
    "MINIAPP_INIT_DATA_MAX_AGE",
)


@pytest.fixture(autouse=True)
def isolated_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    """Run every test in an empty directory with no settings in the environment.

    This guarantees a developer's real ``.env`` or exported variables are never read.
    """
    for name in _SETTINGS_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
        monkeypatch.delenv(name.lower(), raising=False)
    monkeypatch.chdir(tmp_path)
    return tmp_path


@pytest.fixture(autouse=True)
def restore_root_logger():
    root = logging.getLogger()
    handlers, level = root.handlers[:], root.level
    yield
    root.handlers[:] = handlers
    root.setLevel(level)


@pytest.fixture
def write_env(isolated_env: Path):
    def _write(content: str) -> Path:
        path = isolated_env / ".env"
        path.write_text(content, encoding="utf-8")
        path.chmod(0o600)
        return path

    return _write


@pytest.fixture
def example_env(isolated_env: Path) -> Path:
    """Copy of the shipped .env.example as .env, exactly as the README instructs."""
    path = isolated_env / ".env"
    shutil.copyfile(ENV_EXAMPLE, path)
    path.chmod(0o600)
    return path
