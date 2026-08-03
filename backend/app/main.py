"""Точка входа FastAPI-приложения ФАБУЛА (аутентификация)."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import init_db
from .ratelimit import limiter
from .routers import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # На старте создаём таблицы (пока без Alembic).
    await init_db()
    yield


app = FastAPI(title="ФАБУЛА · Auth API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/", tags=["health"])
async def root():
    # корневой роут, чтобы health-check хостинга на "/" получал 200, а не 404
    return {"service": "fabula-auth", "status": "ok"}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
