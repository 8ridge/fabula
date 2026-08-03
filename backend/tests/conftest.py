"""Фикстуры тестов: SQLite-приложение и уникальные креды на каждый тест."""
import os
import uuid

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["DISCORD_REDIRECT_URIS"] = "http://localhost:3000/app"

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    if os.path.exists("test.db"):
        os.remove("test.db")
    from app.main import app  # импорт после подмены env

    from app.google_auth import get_google_verifier

    class _FakeGoogleVerifier:
        def verify(self, token: str) -> dict:
            if token == "BAD":
                raise ValueError("bad token")
            import json
            d = json.loads(token)
            return {
                "sub": d["sub"],
                "email": d["email"],
                "email_verified": bool(d.get("email_verified", True)),
            }

    app.dependency_overrides[get_google_verifier] = lambda: _FakeGoogleVerifier()

    from app.discord_auth import get_discord_verifier

    class _FakeDiscordVerifier:
        def exchange(self, code: str, redirect_uri: str) -> dict:
            if code == "BAD":
                raise ValueError("bad code")
            import json
            d = json.loads(code)  # тест кодирует данные прямо в "code"
            return {
                "discord_id": str(d["discord_id"]),
                "email": (d.get("email") or "").lower() or None,
                "email_verified": bool(d.get("email_verified", True)) and bool(d.get("email")),
                "username": d.get("username"),
            }

    app.dependency_overrides[get_discord_verifier] = lambda: _FakeDiscordVerifier()

    with TestClient(app) as c:  # lifespan создаёт таблицы (init_db)
        yield c
    if os.path.exists("test.db"):
        os.remove("test.db")


@pytest.fixture
def creds():
    u = uuid.uuid4().hex[:8]
    return {"username": f"user_{u}", "email": f"{u}@t.io", "password": "secret12"}


def register(client, creds):
    r = client.post("/auth/register", json=creds)
    assert r.status_code == 201, r.text
    return r.json()


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def google_token(sub: str, email: str, email_verified: bool = True) -> str:
    import json
    return json.dumps({"sub": sub, "email": email, "email_verified": email_verified})


def discord_code(discord_id, email=None, email_verified=True, username=None):
    import json
    return json.dumps({"discord_id": discord_id, "email": email, "email_verified": email_verified, "username": username})
