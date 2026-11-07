"""Shared interface for checklist storage backends.

Both the local SQLite store (``bot.store.ChecklistStore``) and the Supabase store
(``deploy.supabase_store.SupabaseStore``) satisfy this protocol, so the pure
``handlers`` module works with either without importing a concrete backend.
"""

from typing import Protocol, runtime_checkable


@runtime_checkable
class ChecklistStoreLike(Protocol):
    def get_done(self, chat_id: int) -> set[str]: ...

    def mark_done(self, chat_id: int, item_id: str) -> None: ...

    def reset(self, chat_id: int) -> None: ...
