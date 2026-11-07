"""Command-line interface.

Offline commands: ``doctor``, ``config-check``, ``checklist``.
Network commands (only when the user runs them): ``bot`` and ``miniapp`` — these
talk ONLY to the Telegram Bot API as a bot. Nothing here logs into a user account.
"""

import logging

import typer
from pydantic import ValidationError
from rich.console import Console
from rich.markup import escape
from rich.panel import Panel

from telegram_guard import __version__
from telegram_guard.config import Settings
from telegram_guard.health import Status, run_local_checks
from telegram_guard.logging_config import configure_logging

app = typer.Typer(
    name="telegram-guard",
    help="Telegram Guard — akkauntni mustahkamlash uchun bot va mini app (akkauntga ulanmaydi).",
    no_args_is_help=True,
    # Local variables may hold raw configuration values (including secrets);
    # never render them in tracebacks. Older Typer versions default to True.
    pretty_exceptions_show_locals=False,
)

console = Console()
err_console = Console(stderr=True)
logger = logging.getLogger(__name__)

_STATUS_STYLE = {Status.OK: "green", Status.WARN: "yellow", Status.FAIL: "bold red"}


def _load_settings() -> Settings:
    """Load settings; on error print field names and reasons only, never values."""
    try:
        settings = Settings()
    except ValidationError as exc:
        err_console.print("[bold red]Configuration invalid.[/bold red]")
        for error in exc.errors(include_url=False, include_context=False, include_input=False):
            field = ".".join(str(part) for part in error["loc"]).upper() or "SETTINGS"
            err_console.print(f"  - {field}: {error['msg']}", markup=False, highlight=False)
        err_console.print("[dim]Values are not displayed. Fix .env and run again.[/dim]")
        raise typer.Exit(code=1) from None
    configure_logging(settings)
    return settings


@app.command()
def doctor() -> None:
    """Show local project health. Does not contact Telegram."""
    settings = _load_settings()
    logger.debug("Running local health checks")
    results = run_local_checks()

    bot_state = "configured" if settings.bot_configured else "not configured"
    miniapp_state = settings.miniapp_url or "not set (local only)"
    lines = [
        f"[bold green]Telegram Guard v{escape(__version__)}[/bold green]",
        "Mode: bot + mini app (account access: [yellow]NONE[/yellow])",
        f"Protection mode: {escape(settings.guard_mode)}",
        f"Automatic termination: {settings.auto_terminate_sessions}",
        f"Bot token: {bot_state}",
        f"Mini app URL: {escape(miniapp_state)}",
        f"Log level: {escape(settings.log_level)}",
        "",
    ]
    for result in results:
        style = _STATUS_STYLE[result.status]
        lines.append(
            f"[{style}]{result.status.value:<4}[/{style}] {escape(result.name)}: "
            f"{escape(result.detail)}"
        )
    lines.append("")
    lines.append("Secrets are not displayed. No account login is ever performed.")
    console.print(Panel.fit("\n".join(lines), title="Local health check"))

    if any(result.status is Status.FAIL for result in results):
        raise typer.Exit(code=1)


@app.command("config-check")
def config_check() -> None:
    """Validate local configuration without displaying secret values."""
    settings = _load_settings()

    def state(configured: bool) -> str:
        return "configured" if configured else "not configured"

    console.print("[bold]Configuration valid.[/bold]")
    console.print(f"BOT_TOKEN: {state(settings.bot_configured)}", highlight=False)
    console.print(f"BOT_OWNER_ID: {state(settings.bot_owner_id is not None)}", highlight=False)
    console.print(f"MINIAPP_URL: {settings.miniapp_url or 'not set'}", highlight=False)
    console.print(f"GUARD_MODE: {escape(settings.guard_mode)}", highlight=False)
    console.print(f"AUTO_TERMINATE_SESSIONS: {settings.auto_terminate_sessions}", highlight=False)
    console.print(f"LOG_LEVEL: {escape(settings.log_level)}", highlight=False)
    console.print("[dim]No Telegram connection was made. No account login.[/dim]")


@app.command()
def checklist() -> None:
    """Print the security checklist (offline; no token needed)."""
    # Imported here so the offline command set stays import-light.
    from telegram_guard.bot.content import CHECKLIST

    console.print("[bold]🛡 Xavfsizlik tekshiruv ro‘yxati[/bold]\n")
    for index, item in enumerate(CHECKLIST, start=1):
        console.print(f"[bold]{index}. {escape(item.title)}[/bold]", highlight=False)
        console.print(f"   {escape(item.how)}\n", highlight=False)


@app.command()
def bot() -> None:
    """Run the Telegram bot (connects ONLY to the Bot API; no account login)."""
    settings = _load_settings()
    if settings.bot_token is None:
        err_console.print(
            "[bold red]BOT_TOKEN topilmadi.[/bold red] @BotFather’dan token oling va "
            ".env ichida BOT_TOKEN ga yozing."
        )
        raise typer.Exit(code=1)

    from telegram_guard.bot.api import HttpBotAPI
    from telegram_guard.bot.handlers import BotContext
    from telegram_guard.bot.runner import run
    from telegram_guard.bot.store import ChecklistStore

    console.print(
        "[green]Bot ishga tushdi.[/green] To‘xtatish uchun Ctrl+C. (Akkauntga ulanmaydi.)"
    )
    api = HttpBotAPI(settings.bot_token.get_secret_value())
    ctx = BotContext(miniapp_url=settings.miniapp_url)
    with ChecklistStore(settings.state_db_path()) as store:
        try:
            run(api, store, ctx)
        except KeyboardInterrupt:
            console.print("\n[dim]Bot to‘xtatildi.[/dim]")


@app.command()
def miniapp() -> None:
    """Serve the mini app locally (validates Telegram initData; no account login)."""
    settings = _load_settings()
    if settings.bot_token is None:
        err_console.print(
            "[bold red]BOT_TOKEN topilmadi.[/bold red] Mini app initData’ni tekshirish uchun "
            "bot token kerak."
        )
        raise typer.Exit(code=1)

    from telegram_guard.bot.store import ChecklistStore
    from telegram_guard.miniapp.server import build_server

    with ChecklistStore(settings.state_db_path()) as store:
        server = build_server(
            settings.miniapp_host,
            settings.miniapp_port,
            bot_token=settings.bot_token.get_secret_value(),
            store=store,
            max_age=settings.miniapp_init_data_max_age,
            owner_id=settings.bot_owner_id,
        )
        url = f"http://{settings.miniapp_host}:{settings.miniapp_port}"
        console.print(
            f"[green]Mini app server:[/green] {url}\n"
            "[dim]Telegram HTTPS talab qiladi — ommaviy chiqarish uchun reverse proxy "
            "ishlating.[/dim]"
        )
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            console.print("\n[dim]Server to‘xtatildi.[/dim]")
        finally:
            server.server_close()


if __name__ == "__main__":
    app()
