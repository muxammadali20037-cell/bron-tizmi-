import pytest

from telegram_guard.bot.content import CHECKLIST
from telegram_guard.bot.store import ChecklistStore


def test_new_chat_has_nothing_done():
    with ChecklistStore() as store:
        assert store.get_done(1) == set()


def test_mark_done_persists_in_memory():
    with ChecklistStore() as store:
        first = CHECKLIST[0].id
        store.mark_done(10, first)
        assert first in store.get_done(10)
        # Marking again is idempotent.
        store.mark_done(10, first)
        assert store.get_done(10) == {first}


def test_state_is_isolated_per_chat():
    with ChecklistStore() as store:
        store.mark_done(1, CHECKLIST[0].id)
        assert store.get_done(2) == set()


def test_reset_clears_chat():
    with ChecklistStore() as store:
        store.mark_done(5, CHECKLIST[0].id)
        store.reset(5)
        assert store.get_done(5) == set()


def test_unknown_item_is_rejected():
    with ChecklistStore() as store, pytest.raises(KeyError):
        store.mark_done(1, "no_such_item")


def test_persists_to_disk_and_hardens_permissions(tmp_path):
    db = tmp_path / "nested" / "state.sqlite3"
    with ChecklistStore(db) as store:
        store.mark_done(99, CHECKLIST[1].id)
    assert db.is_file()
    assert (db.stat().st_mode & 0o777) == 0o600
    with ChecklistStore(db) as reopened:
        assert CHECKLIST[1].id in reopened.get_done(99)


def test_stale_ids_are_ignored_on_read(tmp_path):
    db = tmp_path / "state.sqlite3"
    with ChecklistStore(db) as store:
        store._save(1, {"two_step", "removed_old_item"})
        assert store.get_done(1) == {"two_step"}
