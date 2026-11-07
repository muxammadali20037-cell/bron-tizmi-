"""Account-safety guarantees.

1. No user-account client library (telethon/pyrogram) is a dependency anywhere.
2. Core logic never imports networking; only the three transport modules
   (bot/api.py, bot/runner.py, miniapp/server.py) may use stdlib networking.
3. The offline commands (doctor, config-check, checklist) make no network calls.
"""

import ast
import sys

import pytest
from typer.testing import CliRunner

from telegram_guard.cli import app

from conftest import PROJECT_ROOT, NetworkAccessError

SRC_DIR = PROJECT_ROOT / "src" / "telegram_guard"

# User-account clients must never appear — the product never logs into an account.
FORBIDDEN_EVERYWHERE = {
    "telethon",
    "pyrogram",
    "telegram",
    "requests",
    "httpx",
    "aiohttp",
    "urllib3",
}
# Modules that actually open sockets. `urllib.parse` is pure string work and is allowed.
NETWORK_MODULES = {
    "socket",
    "ssl",
    "ftplib",
    "asyncio",
    "urllib.request",
    "urllib.error",
    "http.client",
    "http.server",
}
TRANSPORT_MODULES = {
    SRC_DIR / "bot" / "api.py",
    SRC_DIR / "bot" / "runner.py",
    SRC_DIR / "miniapp" / "server.py",
    SRC_DIR / "deploy" / "supabase_store.py",
}


def _is_network(dotted: str) -> bool:
    return dotted in NETWORK_MODULES or dotted == "http"


@pytest.mark.parametrize("command", ["doctor", "config-check", "checklist"])
def test_offline_commands_make_no_network_calls(command, block_network, example_env):
    result = CliRunner().invoke(app, [command])
    assert result.exit_code == 0, result.output
    assert not isinstance(result.exception, NetworkAccessError)


def test_no_account_client_is_imported():
    for module in ("telethon", "pyrogram"):
        assert module not in sys.modules


def _imported_modules(path):
    """Yield (top_level, dotted) for every import in the file."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name.split(".")[0], alias.name
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            yield node.module.split(".")[0], node.module


def test_account_clients_are_absent_everywhere():
    offenders = {
        f"{path.relative_to(PROJECT_ROOT)}: {top}"
        for path in SRC_DIR.rglob("*.py")
        for top, _dotted in _imported_modules(path)
        if top in FORBIDDEN_EVERYWHERE
    }
    assert not offenders, offenders


def test_only_transport_modules_use_networking():
    offenders = {}
    for path in SRC_DIR.rglob("*.py"):
        if path in TRANSPORT_MODULES:
            continue
        bad = {dotted for _top, dotted in _imported_modules(path) if _is_network(dotted)}
        if bad:
            offenders[str(path.relative_to(PROJECT_ROOT))] = bad
    assert not offenders, offenders
