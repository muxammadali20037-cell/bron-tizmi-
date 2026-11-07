import tomllib

import pytest
from typer.testing import CliRunner

from telegram_guard import __version__
from telegram_guard.cli import app

from conftest import FAKE_API_HASH, PROJECT_ROOT

runner = CliRunner()


def run(*args: str):
    return runner.invoke(app, list(args))


def test_no_args_shows_help():
    result = run()
    assert "doctor" in result.output
    assert "config-check" in result.output


@pytest.mark.parametrize("command", ["doctor", "config-check"])
def test_commands_work_without_env_file(command):
    result = run(command)
    assert result.exit_code == 0, result.output
    assert "Traceback" not in result.output


@pytest.mark.parametrize("command", ["doctor", "config-check"])
def test_commands_work_with_shipped_env_example(command, example_env):
    """Regression: the README flow (`cp .env.example .env`) used to crash both commands."""
    result = run(command)
    assert result.exit_code == 0, result.output


def test_doctor_reports_state(example_env):
    result = run("doctor")
    assert result.exit_code == 0
    assert "NONE" in result.output  # account access: NONE
    assert "Automatic termination: False" in result.output
    assert f"v{__version__}" in result.output
    assert "Session fayllar" in result.output


def test_checklist_command_prints_items(example_env):
    result = run("checklist")
    assert result.exit_code == 0
    assert "Ikki bosqichli" in result.output
    assert "Qurilma" in result.output or "qurilma" in result.output


def test_doctor_warns_about_stray_session_file(isolated_env):
    (isolated_env / "me.session").write_bytes(b"")
    result = run("doctor")
    assert result.exit_code == 0
    assert "WARN" in result.output
    assert "me.session" in result.output


def test_config_check_reports_state_but_never_the_secret(write_env):
    from conftest import FAKE_BOT_TOKEN

    write_env(f"BOT_TOKEN={FAKE_BOT_TOKEN}\nLOG_LEVEL=debug\n")
    for command in ("config-check", "doctor"):
        result = run(command)
        assert result.exit_code == 0, result.output
        assert FAKE_BOT_TOKEN not in result.output
    assert "BOT_TOKEN: configured" in run("config-check").output


@pytest.mark.parametrize("command", ["doctor", "config-check"])
def test_invalid_config_fails_cleanly_without_leaking(command, write_env):
    """Regression: invalid config printed a traceback containing raw .env values."""
    write_env(f"TG_API_ID={FAKE_API_HASH}\nTG_API_HASH={FAKE_API_HASH}\nLOG_LEVEL=verbose\n")
    result = run(command)
    assert result.exit_code == 1
    assert "Configuration invalid" in result.output
    assert "TG_API_ID" in result.output
    assert "LOG_LEVEL" in result.output
    assert FAKE_API_HASH not in result.output
    assert "Traceback" not in result.output


def test_auto_termination_cannot_be_enabled(write_env):
    write_env("AUTO_TERMINATE_SESSIONS=true\n")
    result = run("config-check")
    assert result.exit_code == 1
    assert "AUTO_TERMINATE_SESSIONS" in result.output


def test_tracebacks_never_show_local_variables():
    assert app.pretty_exceptions_show_locals is False


def test_version_matches_pyproject():
    pyproject = tomllib.loads((PROJECT_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    assert pyproject["project"]["version"] == __version__
