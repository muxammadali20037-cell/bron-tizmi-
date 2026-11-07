"""Telegram Mini App: an owner-only page that shows the security checklist.

The only security-sensitive part is verifying Telegram's ``initData`` signature so
that a page cannot be spoofed; that logic lives in ``auth`` and is fully tested.
The mini app never reads a Telegram account.
"""
