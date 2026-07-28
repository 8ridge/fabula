"""Настройки приложения. Всё читается из переменных окружения (.env)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Postgres: postgresql+asyncpg://user:pass@host:port/dbname
    database_url: str = "postgresql+asyncpg://fabula:fabula@localhost:5432/fabula"

    # Секрет для подписи JWT. В проде обязательно задать свой длинный случайный.
    jwt_secret: str = "dev-secret-change-me"
    jwt_alg: str = "HS256"
    access_token_ttl_min: int = 60 * 24 * 7  # неделя

    # Откуда фронту разрешено стучаться (CORS). Через запятую.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
