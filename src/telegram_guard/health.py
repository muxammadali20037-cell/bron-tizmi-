"""Local, offline health checks used by ``telegram-guard doctor``.

Nothing here opens a network connection or reads secret values.
"""

import os
import stat
import sys
from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path

from telegram_guard.config import ENV_FILE

MIN_PYTHON = (3, 11)
SESSION_PATTERNS = ("*.session", "*.session-journal")


class Status(StrEnum):
    OK = "OK"
    WARN = "WARN"
    FAIL = "FAIL"


@dataclass(frozen=True)
class CheckResult:
    name: str
    status: Status
    detail: str


def check_python_version(version: tuple[int, ...] | None = None) -> CheckResult:
    current = tuple(version or sys.version_info[:3])
    shown = ".".join(str(part) for part in current)
    if current[:2] >= MIN_PYTHON:
        return CheckResult("Python", Status.OK, shown)
    required = ".".join(str(part) for part in MIN_PYTHON)
    return CheckResult("Python", Status.FAIL, f"{shown} (>= {required} kerak)")


def check_env_file(base_dir: Path) -> CheckResult:
    env_path = base_dir / ENV_FILE
    if not env_path.is_file():
        return CheckResult(
            ".env",
            Status.WARN,
            "topilmadi — standart qiymatlar ishlatilmoqda "
            "(buyruqni loyiha papkasidan ishga tushiring)",
        )
    if os.name != "posix":
        return CheckResult(".env", Status.OK, "topildi")
    mode = env_path.stat().st_mode
    if mode & (stat.S_IRWXG | stat.S_IRWXO):
        return CheckResult(
            ".env",
            Status.WARN,
            f"boshqa foydalanuvchilar o‘qiy oladi ({stat.filemode(mode)}); tavsiya: chmod 600 .env",
        )
    return CheckResult(".env", Status.OK, "topildi, ruxsatlar xavfsiz")


def check_session_files(base_dir: Path) -> CheckResult:
    found = sorted({p.name for pattern in SESSION_PATTERNS for p in base_dir.glob(pattern)})
    if found:
        return CheckResult(
            "Session fayllar",
            Status.WARN,
            "bu mahsulot akkauntga ulanmaydi, bu fayllar bo‘lmasligi kerak: " + ", ".join(found),
        )
    return CheckResult("Session fayllar", Status.OK, "yo‘q (to‘g‘ri — akkauntga ulanmaydi)")


def run_local_checks(base_dir: Path | None = None) -> list[CheckResult]:
    directory = base_dir or Path.cwd()
    return [
        check_python_version(),
        check_env_file(directory),
        check_session_files(directory),
    ]
