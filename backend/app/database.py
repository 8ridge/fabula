"""Асинхронное подключение к Postgres через SQLAlchemy 2.0."""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


def _async_url(url: str) -> str:
    """Приводим DATABASE_URL к async-драйверу asyncpg.

    Хостинги (Saturn и др.) впрыскивают URL как postgres:// или postgresql://,
    а SQLAlchemy async-движку нужен явный драйвер postgresql+asyncpg://.
    """
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://"):]
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://"):]
    return url


engine = create_async_engine(_async_url(settings.database_url), pool_pre_ping=True, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """Создаёт таблицы, если их нет. Для старта достаточно; позже перейдём на Alembic-миграции."""
    from . import models  # noqa: F401  — регистрируем модели в метаданных

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
