from telegram_guard.bot.content import CHECKLIST
from telegram_guard.bot.handlers import BotContext, handle_update
from telegram_guard.bot.store import ChecklistStore


def _update(text: str, chat_id: int = 1, user_id: int = 1) -> dict:
    return {
        "update_id": 100,
        "message": {
            "message_id": 1,
            "chat": {"id": chat_id, "type": "private"},
            "from": {"id": user_id},
            "text": text,
        },
    }


def test_start_sends_intro_and_checklist():
    with ChecklistStore() as store:
        out = handle_update(_update("/start"), store)
    assert len(out) == 2
    assert "Telegram Guard" in out[0].text
    assert "tekshiruv ro‘yxati" in out[1].text


def test_help_command():
    with ChecklistStore() as store:
        out = handle_update(_update("/help"), store)
    assert out[0].text.startswith("🛡")
    assert "/checklist" in out[0].text


def test_done_marks_item_and_persists():
    with ChecklistStore() as store:
        out = handle_update(_update("/done 1"), store)
        assert CHECKLIST[0].id in store.get_done(1)
    assert "bajarildi" in out[0].text.lower()


def test_done_rejects_out_of_range():
    with ChecklistStore() as store:
        out = handle_update(_update("/done 99"), store)
        assert store.get_done(1) == set()
    assert "oralig" in out[0].text


def test_done_without_number_prompts():
    with ChecklistStore() as store:
        out = handle_update(_update("/done"), store)
    assert "Qaysi qadam" in out[0].text


def test_reset_clears_state():
    with ChecklistStore() as store:
        handle_update(_update("/done 1"), store)
        handle_update(_update("/reset"), store)
        assert store.get_done(1) == set()


def test_command_with_bot_mention_is_parsed():
    with ChecklistStore() as store:
        out = handle_update(_update("/checklist@MyGuardBot"), store)
    assert "tekshiruv ro‘yxati" in out[0].text


def test_non_command_text_is_ignored():
    with ChecklistStore() as store:
        assert handle_update(_update("salom"), store) == []


def test_unknown_command():
    with ChecklistStore() as store:
        out = handle_update(_update("/frobnicate"), store)
    assert "tushunmadim" in out[0].text


def test_updates_without_message_are_ignored():
    with ChecklistStore() as store:
        assert handle_update({"update_id": 5}, store) == []
        assert handle_update({"message": {"text": "/help"}}, store) == []  # no chat


def test_webapp_button_present_only_when_url_configured():
    with ChecklistStore() as store:
        without = handle_update(_update("/checklist"), store)
        assert without[0].web_app_button is None
        ctx = BotContext(miniapp_url="https://guard.example/app")
        with_url = handle_update(_update("/checklist"), store, ctx)
        assert with_url[0].web_app_button is not None
        assert with_url[0].web_app_button.url == "https://guard.example/app"


def test_done_state_is_per_chat():
    with ChecklistStore() as store:
        handle_update(_update("/done 1", chat_id=1), store)
        out = handle_update(_update("/status", chat_id=2), store)
    assert "birorta qadam belgilanmagan" in out[0].text
