"""Отправка писем — провайдер-независимая абстракция (используется в Фазе 2)."""
import logging
from typing import Protocol

log = logging.getLogger("fabula.email")


class EmailSender(Protocol):
    def send_verification(self, email: str, code: str, link: str) -> None: ...


class DevEmailSender:
    """Ничего не шлёт — пишет код в лог. Для разработки/тестов."""

    def send_verification(self, email: str, code: str, link: str) -> None:
        log.info("[DEV EMAIL] verify %s -> code=%s link=%s", email, code, link)


def get_email_sender() -> EmailSender:
    # В Фазе 2: выбор по settings.email_provider (dev|resend). Пока только dev.
    return DevEmailSender()
