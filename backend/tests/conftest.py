"""Фикстуры тестов: SQLite-приложение и уникальные креды на каждый тест."""
import os
import uuid

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["JWT_SECRET"] = "test-secret"

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    if os.path.exists("test.db"):
        os.remove("test.db")
    from app.main import app  # импорт после подмены env

    with TestClient(app) as c:  # lifespan создаёт таблицы (init_db)
        yield c
    if os.path.exists("test.db"):
        os.remove("test.db")


@pytest.fixture
def creds():
    u = uuid.uuid4().hex[:8]
    return {"username": f"user_{u}", "email": f"{u}@t.io", "password": "secret1"}


def register(client, creds):
    r = client.post("/auth/register", json=creds)
    assert r.status_code == 201, r.text
    return r.json()


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
