"""ORM-модели. Пока одна — пользователь."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    # Уникальный ник (@хендл). Уникальность регистронезависимая — проверяем в коде.
    username: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    # Хэш пароля (argon2). NULL допустим — вход только через Google (Фаза 3).
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Жёсткий гейт (Фаза 2) смотрит сюда. В Фазе 1 дефолт True (гейта ещё нет).
    email_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Версия токена: инкремент = «выход со всех устройств» (старые JWT недействительны).
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
