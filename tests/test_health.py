import os

import pytest

from telegram_guard.health import (
    Status,
    check_env_file,
    check_python_version,
    check_session_files,
    run_local_checks,
)

posix_only = pytest.mark.skipif(os.name != "posix", reason="POSIX file permissions")


def test_python_version_check():
    assert check_python_version((3, 11, 0)).status is Status.OK
    assert check_python_version((3, 13, 1)).status is Status.OK
    assert check_python_version((3, 10, 9)).status is Status.FAIL


def test_missing_env_file_is_a_warning(isolated_env):
    assert check_env_file(isolated_env).status is Status.WARN


@posix_only
def test_private_env_file_is_ok(write_env, isolated_env):
    write_env("LOG_LEVEL=INFO\n").chmod(0o600)
    assert check_env_file(isolated_env).status is Status.OK


@posix_only
def test_world_readable_env_file_is_a_warning(write_env, isolated_env):
    write_env("LOG_LEVEL=INFO\n").chmod(0o644)
    result = check_env_file(isolated_env)
    assert result.status is Status.WARN
    assert "chmod 600" in result.detail


def test_session_files_are_detected(isolated_env):
    assert check_session_files(isolated_env).status is Status.OK
    (isolated_env / "account.session").write_bytes(b"")
    (isolated_env / "account.session-journal").write_bytes(b"")
    result = check_session_files(isolated_env)
    assert result.status is Status.WARN
    assert "account.session" in result.detail
    assert "account.session-journal" in result.detail


def test_checks_never_read_env_contents(write_env, isolated_env):
    write_env("TG_API_HASH=should-not-be-read\n")
    results = run_local_checks(isolated_env)
    assert all("should-not-be-read" not in r.detail for r in results)
