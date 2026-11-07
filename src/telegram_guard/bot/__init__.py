"""Telegram Guard bot and mini app content.

This package never logs into a user account. The bot authenticates only as a bot
(via a @BotFather token) and talks only to the Telegram Bot API. Bots cannot read
a user's active sessions, so the product's job is to (1) help each user turn on
Telegram's own protections so unauthorised sessions cannot get in, and (2) keep
the user aware via Telegram's native new-login alerts plus reminders.
"""
