from tests.conftest import auth_headers, discord_code, register


def test_discord_registration_token_roundtrip():
    from app.security import (
        create_discord_registration_token,
        decode_discord_registration_token,
        decode_registration_token,
    )
    t = create_discord_registration_token("42", "d@t.io", "neo")
    assert decode_discord_registration_token(t) == {"discord_id": "42", "email": "d@t.io", "username": "neo"}
    assert decode_registration_token(t) is None  # google-декодер не принимает discord-токен


def test_discord_new_user_needs_username(client):
    r = client.post("/auth/discord", json={"code": discord_code("d_new1", "dn1@t.io", username="neo"), "redirect_uri": "http://localhost:3000/app"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["needs_username"] is True and body["registration_token"]
    assert body.get("access_token") is None


def test_discord_complete_and_returning(client):
    code = discord_code("d_new2", "dn2@t.io")
    rt = client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    r = client.post("/auth/discord/complete", json={"registration_token": rt, "username": "dnicktwo"})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["providers"] == ["discord"]
    r2 = client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"})
    assert r2.status_code == 200 and r2.json().get("access_token")


def test_discord_autolink_verified_email(client, creds):
    register(client, creds)
    code = discord_code("d_link1", creds["email"], email_verified=True)
    r = client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"})
    assert r.status_code == 200 and r.json().get("access_token"), r.text
    me = client.get("/auth/me", headers=auth_headers(r.json()["access_token"])).json()
    assert set(me["providers"]) == {"email", "discord"}


def test_discord_unverified_email_existing_rejected(client, creds):
    register(client, creds)
    code = discord_code("d_link2", creds["email"], email_verified=False)
    assert client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"}).status_code == 400


def test_discord_bad_code(client):
    assert client.post("/auth/discord", json={"code": "BAD", "redirect_uri": "http://localhost:3000/app"}).status_code == 401


def test_discord_bad_redirect_rejected(client):
    r = client.post("/auth/discord", json={"code": discord_code("d_x", "dx@t.io"), "redirect_uri": "http://evil.example/app"})
    assert r.status_code == 400


def test_discord_complete_taken_username(client):
    rt1 = client.post("/auth/discord", json={"code": discord_code("d_a", "da@t.io"), "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    client.post("/auth/discord/complete", json={"registration_token": rt1, "username": "ddupnick"})
    rt2 = client.post("/auth/discord", json={"code": discord_code("d_b", "db@t.io"), "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    assert client.post("/auth/discord/complete", json={"registration_token": rt2, "username": "ddupnick"}).status_code == 409


def test_discord_registration_token_not_access(client):
    rt = client.post("/auth/discord", json={"code": discord_code("d_c", "dc@t.io"), "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    assert client.get("/auth/me", headers=auth_headers(rt)).status_code == 401
