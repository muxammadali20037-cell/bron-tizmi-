"""Local per-chat checklist state in SQLite.

Stored on the operator's own machine. Holds only chat ids and which checklist
items each chat has ticked off — no account data, no secrets.
"""

import contextlib
import json
import sqlite3
import threading
from collections.abc import Iterable
from pathlib import Path

from telegram_guard.bot.content import CHECKLIST_IDS

_SCHEMA = """
CREATE TABLE IF NOT EXISTS chat_state (
    chat_id    INTEGER PRIMARY KEY,
    done_ids   TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)
"""


class ChecklistStore:
    def __init__(self, db_path: Path | str = ":memory:") -> None:
        self._path = str(db_path)
        if self._path != ":memory:":
            parent = Path(self._path).parent
            parent.mkdir(parents=True, exist_ok=True)
            # Owner-only directory on POSIX.
            with contextlib.suppress(OSError):
                parent.chmod(0o700)
        # The mini app server is multi-threaded; guard the single connection with a
        # lock and allow cross-thread use (safe because every access holds the lock).
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(self._path, check_same_thread=False)
        self._conn.execute(_SCHEMA)
        self._conn.commit()
        self._harden_permissions()

    def _harden_permissions(self) -> None:
        if self._path == ":memory:":
            return
        with contextlib.suppress(OSError):
            Path(self._path).chmod(0o600)

    def get_done(self, chat_id: int) -> set[str]:
        with self._lock:
            row = self._conn.execute(
                "SELECT done_ids FROM chat_state WHERE chat_id = ?", (chat_id,)
            ).fetchone()
        if row is None:
            return set()
        try:
            stored = json.loads(row[0])
        except (TypeError, ValueError):
            return set()
        # Drop ids no longer in the checklist (defensive against old data).
        return {item for item in stored if item in CHECKLIST_IDS}

    def _save(self, chat_id: int, done: Iterable[str]) -> None:
        payload = json.dumps(sorted(set(done) & CHECKLIST_IDS))
        with self._lock:
            self._conn.execute(
                "INSERT INTO chat_state (chat_id, done_ids, updated_at) "
                "VALUES (?, ?, datetime('now')) "
                "ON CONFLICT(chat_id) DO UPDATE SET done_ids = excluded.done_ids, "
                "updated_at = excluded.updated_at",
                (chat_id, payload),
            )
            self._conn.commit()

    def mark_done(self, chat_id: int, item_id: str) -> None:
        if item_id not in CHECKLIST_IDS:
            raise KeyError(item_id)
        done = self.get_done(chat_id)
        done.add(item_id)
        self._save(chat_id, done)

    def reset(self, chat_id: int) -> None:
        self._save(chat_id, set())

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> "ChecklistStore":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()
