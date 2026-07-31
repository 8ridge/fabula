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
