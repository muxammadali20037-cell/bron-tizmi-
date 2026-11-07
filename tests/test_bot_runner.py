from telegram_guard.bot.content import CHECKLIST
from telegram_guard.bot.handlers import BotContext, OutgoingMessage
from telegram_guard.bot.runner import process_updates, run
from telegram_guard.bot.store import ChecklistStore


class FakeBotAPI:
    def __init__(self, update_batches):
        self._batches = list(update_batches)
        self.sent: list[OutgoingMessage] = []
        self.offsets: list[int | None] = []

    def send(self, message):
        self.sent.append(message)
        return {"message_id": len(self.sent)}

    def get_updates(self, offset, timeout):
        self.offsets.append(offset)
        return self._batches.pop(0) if self._batches else []


def _msg(text, chat_id=1, update_id=1):
    return {
        "update_id": update_id,
        "message": {"chat": {"id": chat_id}, "from": {"id": chat_id}, "text": text},
    }


def test_process_updates_sends_replies_and_advances_offset():
    api = FakeBotAPI([])
    with ChecklistStore() as store:
        offset = process_updates([_msg("/help", update_id=41)], store, api, BotContext())
    assert offset == 42
    assert any("/checklist" in m.text for m in api.sent)


def test_process_updates_survives_a_bad_update():
    api = FakeBotAPI([])
    with ChecklistStore() as store:
        # Second update is malformed; loop must continue and still advance offset.
        updates = [_msg("/help", update_id=1), {"update_id": 2, "message": "oops"}]
        offset = process_updates(updates, store, api, BotContext())
    assert offset == 3


def test_run_loop_stops_and_makes_no_real_network(block_network):
    api = FakeBotAPI([[_msg("/done 1", update_id=10)]])
    stop = {"n": 0}

    def should_stop():
        stop["n"] += 1
        return stop["n"] > 2

    with ChecklistStore() as store:
        run(api, store, BotContext(), poll_timeout=0, should_stop=should_stop)
        assert CHECKLIST[0].id in store.get_done(1)
    assert api.sent  # a reply was produced, all without touching the network
