"""Supabase (PostgREST) checklist store for serverless deployments.

Implements the same interface as the local SQLite store, backed by one table:

    create table public.tg_guard_chat_state (
        chat_id    bigint primary key,
        done_ids   jsonb not null default '[]'::jsonb,
        updated_at timestamptz not null default now()
    );

Stores only a Telegram chat id and which checklist items that chat has ticked.
No account data, no secrets. Uses stdlib urllib so it adds no dependency.
"""

import json
import urllib.error
import urllib.request
from datetime import UTC, datetime

from telegram_guard.bot.content import CHECKLIST_IDS

DEFAULT_TABLE = "tg_guard_chat_state"
_TIMEOUT = 15


class SupabaseStoreError(RuntimeError):
    pass


class SupabaseStore:
    def __init__(self, url: str, key: str, *, table: str = DEFAULT_TABLE) -> None:
        if not url or not key:
            raise SupabaseStoreError("SUPABASE_URL va kalit talab qilinadi.")
        self._endpoint = f"{url.rstrip('/')}/rest/v1/{table}"
        self._key = key

    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        headers = {
            "apikey": self._key,
            "Authorization": f"Bearer {self._key}",
            "Content-Type": "application/json",
        }
        if extra:
            headers.update(extra)
        return headers

    def _request(self, method: str, query: str = "", body: object = None, headers=None) -> bytes:
        data = json.dumps(body).encode("utf-8") if body is not None else None
        request = urllib.request.Request(  # noqa: S310 - fixed Supabase REST host
            self._endpoint + query,
            data=data,
            headers=self._headers(headers),
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=_TIMEOUT) as response:  # noqa: S310
                return response.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:300]
            raise SupabaseStoreError(f"Supabase {method} xatolik {exc.code}: {detail}") from None
        except urllib.error.URLError as exc:
            raise SupabaseStoreError(f"Supabase ulanish xatosi: {exc.reason}") from None

    def get_done(self, chat_id: int) -> set[str]:
        raw = self._request("GET", f"?chat_id=eq.{int(chat_id)}&select=done_ids")
        rows = json.loads(raw or b"[]")
        if not rows:
            return set()
        stored = rows[0].get("done_ids") or []
        return {item for item in stored if item in CHECKLIST_IDS}

    def _upsert(self, chat_id: int, done_ids: list[str]) -> None:
        payload = [
            {
                "chat_id": int(chat_id),
                "done_ids": done_ids,
                "updated_at": datetime.now(UTC).isoformat(),
            }
        ]
        self._request(
            "POST",
            body=payload,
            headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
        )

    def mark_done(self, chat_id: int, item_id: str) -> None:
        if item_id not in CHECKLIST_IDS:
            raise KeyError(item_id)
        done = self.get_done(chat_id)
        done.add(item_id)
        self._upsert(chat_id, sorted(done))

    def reset(self, chat_id: int) -> None:
        self._upsert(chat_id, [])
