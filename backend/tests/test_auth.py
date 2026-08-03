from tests.conftest import auth_headers, register


def test_register_returns_username(client, creds):
    data = register(client, creds)
    assert data["user"]["username"] == creds["username"]
    assert data["user"]["email"] == creds["email"]
    assert "access_token" in data


def test_me_returns_profile_fields(client, creds):
    data = register(client, creds)
    r = client.get("/auth/me", headers=auth_headers(data["access_token"]))
    assert r.status_code == 200
    body = r.json()
    assert body["username"] == creds["username"]
    assert body["email_verified"] is True
    assert body["providers"] == ["email"]


def test_register_rejects_duplicate_username(client, creds):
    register(client, creds)
    dup = {"username": creds["username"], "email": "other_" + creds["email"], "password": "secret12"}
    r = client.post("/auth/register", json=dup)
    assert r.status_code == 409


def test_register_rejects_bad_username(client):
    r = client.post("/auth/register", json={"username": "a b!", "email": "x@t.io", "password": "secret12"})
    assert r.status_code == 422


def test_logout_all_invalidates_old_token(client, creds):
    data = register(client, creds)
    old = data["access_token"]
    assert client.get("/auth/me", headers=auth_headers(old)).status_code == 200
    assert client.post("/auth/logout-all", headers=auth_headers(old)).status_code == 204
    assert client.get("/auth/me", headers=auth_headers(old)).status_code == 401
