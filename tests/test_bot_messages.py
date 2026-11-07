from telegram_guard.bot import messages
from telegram_guard.bot.content import CHECKLIST, CHECKLIST_IDS


def test_checklist_lists_every_item():
    text = messages.render_checklist(set())
    for index, item in enumerate(CHECKLIST, start=1):
        assert f"{index}. {item.title}" in text
    assert f"0/{len(CHECKLIST)}" in text


def test_checklist_marks_done_items():
    done = {CHECKLIST[0].id}
    text = messages.render_checklist(done)
    assert "✅" in text
    assert f"1/{len(CHECKLIST)}" in text


def test_status_all_done():
    text = messages.render_status(set(CHECKLIST_IDS))
    assert "yaxshi himoyalangan" in text


def test_status_none_done_lists_remaining():
    text = messages.render_status(set())
    assert "boshlang" in text
    assert CHECKLIST[0].title in text


def test_done_ack_names_item():
    assert CHECKLIST[2].title in messages.render_done_ack(3)


def test_key_security_topics_are_covered():
    blob = " ".join(item.title + " " + item.how for item in CHECKLIST).lower()
    assert "ikki bosqichli" in blob  # 2FA
    assert "qurilma" in blob  # devices
    assert "kod" in blob  # never share code


def test_content_contains_no_token_like_strings():
    for item in CHECKLIST:
        assert ":" not in item.title
