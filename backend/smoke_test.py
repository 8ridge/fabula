"""Сквозная проверка auth-флоу на SQLite (без Postgres/Docker).

Запуск: .venv\\Scripts\\python.exe smoke_test.py
"""
import os

# Подменяем БД на файловый SQLite ДО импорта приложения.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./smoke.db"
os.environ["JWT_SECRET"] = "smoke-secret"

# чистим прошлую базу
if os.path.exists("smoke.db"):
    os.remove("smoke.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def main() -> None:
    with TestClient(app) as c:
        # 1. регистрация
        r = c.post("/auth/register", json={"name": "Тест", "email": "T@T.io", "password": "secret1"})
        assert r.status_code == 201, (r.status_code, r.text)
        tok = r.json()["access_token"]
        assert r.json()["user"]["email"] == "t@t.io"  # почта опустилась в нижний регистр
        print("register        -> 201 OK, token len", len(tok))

        # 2. повторная регистрация той же почты -> 409
        r = c.post("/auth/register", json={"name": "X", "email": "t@t.io", "password": "secret1"})
        assert r.status_code == 409, (r.status_code, r.text)
        print("register dup    -> 409 OK")

        # 3. вход верным паролем
        r = c.post("/auth/login", json={"email": "t@t.io", "password": "secret1"})
        assert r.status_code == 200, (r.status_code, r.text)
        print("login ok        -> 200 OK")

        # 4. вход неверным паролем -> 401
        r = c.post("/auth/login", json={"email": "t@t.io", "password": "wrong"})
        assert r.status_code == 401, (r.status_code, r.text)
        print("login bad       -> 401 OK")

        # 5. /me с токеном
        r = c.get("/auth/me", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200 and r.json()["email"] == "t@t.io", (r.status_code, r.text)
        print("me with token   -> 200 OK, user", r.json()["name"])

        # 6. /me без токена -> 403 (нет заголовка)
        r = c.get("/auth/me")
        assert r.status_code in (401, 403), (r.status_code, r.text)
        print("me no token     ->", r.status_code, "OK")

        # 7. слабый пароль (<6) отбивается валидацией -> 422
        r = c.post("/auth/register", json={"name": "A", "email": "a@a.io", "password": "12"})
        assert r.status_code == 422, (r.status_code, r.text)
        print("weak password   -> 422 OK")

    print("\nВСЕ ПРОВЕРКИ ПРОШЛИ")


if __name__ == "__main__":
    main()
