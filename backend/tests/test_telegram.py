from tests.conftest import auth_headers


def test_email_can_be_null_on_user_out(client):
    # регистрируем через Telegram-заглушку и проверяем, что email=None не ломает /auth/me
    from tests.conftest import telegram_widget
    data = telegram_widget("tg_null1")
    rt = client.post("/auth/telegram", json=data).json()["registration_token"]
    r = client.post("/auth/telegram/complete", json={"registration_token": rt, "username": "tgnullone"})
    assert r.status_code == 200, r.text
    me = client.get("/auth/me", headers=auth_headers(r.json()["access_token"])).json()
    assert me["email"] is None
    assert me["providers"] == ["telegram"]


from tests.conftest import auth_headers, telegram_widget, register


def test_telegram_new_user_needs_username(client):
    r = client.post("/auth/telegram", json=telegram_widget("tg_new1", "neo"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["needs_username"] is True
    assert body["registration_token"]
    assert body.get("access_token") is None


def test_telegram_complete_creates_user_and_returning_login(client):
    data = telegram_widget("tg_new2")
    rt = client.post("/auth/telegram", json=data).json()["registration_token"]
    r = client.post("/auth/telegram/complete", json={"registration_token": rt, "username": "tgnicktwo"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["providers"] == ["telegram"]
    assert body["user"]["email"] is None
    # повторный вход тем же tg_id -> сразу сессия
    r2 = client.post("/auth/telegram", json=data)
    assert r2.status_code == 200 and r2.json().get("access_token")


def test_telegram_bad_signature(client):
    bad = {"id": "x", "auth_date": 1, "hash": "BAD"}
    assert client.post("/auth/telegram", json=bad).status_code == 401


def test_telegram_complete_taken_username(client):
    rt1 = client.post("/auth/telegram", json=telegram_widget("tg_a")).json()["registration_token"]
    client.post("/auth/telegram/complete", json={"registration_token": rt1, "username": "dupnick"})
    rt2 = client.post("/auth/telegram", json=telegram_widget("tg_b")).json()["registration_token"]
    r = client.post("/auth/telegram/complete", json={"registration_token": rt2, "username": "dupnick"})
    assert r.status_code == 409


def test_telegram_complete_bad_token(client):
    r = client.post("/auth/telegram/complete", json={"registration_token": "nope", "username": "somenick"})
    assert r.status_code == 401


def test_telegram_registration_token_not_access(client):
    rt = client.post("/auth/telegram", json=telegram_widget("tg_c")).json()["registration_token"]
    assert client.get("/auth/me", headers=auth_headers(rt)).status_code == 401
