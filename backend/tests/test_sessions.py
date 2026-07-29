import uuid

from tests.conftest import auth_headers, register


def test_token_sid_roundtrip():
    from app.security import create_access_token, decode_access_token
    t = create_access_token(7, 0, sid=42)
    d = decode_access_token(t)
    assert d["user_id"] == 7 and d["ver"] == 0 and d["sid"] == 42
    t2 = create_access_token(7, 0)
    assert decode_access_token(t2)["sid"] is None


def test_login_creates_session(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    r = client.get("/auth/sessions", headers=h)
    assert r.status_code == 200, r.text
    lst = r.json()
    assert len(lst) == 1 and lst[0]["current"] is True and lst[0]["device"]
    assert "country_name" in lst[0]


def test_revoke_session_blocks_token(client, creds):
    data = register(client, creds); h = auth_headers(data["access_token"])
    sid = client.get("/auth/sessions", headers=h).json()[0]["id"]
    login2 = client.post("/auth/login", json={"email": creds["email"], "password": creds["password"]}).json()
    h2 = auth_headers(login2["access_token"])
    assert len(client.get("/auth/sessions", headers=h2).json()) == 2
    assert client.delete(f"/auth/sessions/{sid}", headers=h2).status_code == 204
    assert client.get("/auth/me", headers=h).status_code == 401


def test_revoke_other_users_session_404(client, creds):
    a = register(client, creds); ha = auth_headers(a["access_token"])
    sid_a = client.get("/auth/sessions", headers=ha).json()[0]["id"]
    cb = {"username": "u" + uuid.uuid4().hex[:8], "email": uuid.uuid4().hex[:8] + "@t.io", "password": "password1"}
    b = register(client, cb); hb = auth_headers(b["access_token"])
    assert client.delete(f"/auth/sessions/{sid_a}", headers=hb).status_code == 404


def test_logout_all_revokes_sessions(client, creds):
    data = register(client, creds); h = auth_headers(data["access_token"])
    assert client.post("/auth/logout-all", headers=h).status_code == 204
    assert client.get("/auth/me", headers=h).status_code == 401


def test_legacy_token_without_sid_works(client, creds):
    data = register(client, creds); h = auth_headers(data["access_token"])
    uid = client.get("/auth/me", headers=h).json()["id"]
    from app.security import create_access_token
    legacy = create_access_token(uid, 0)
    assert client.get("/auth/me", headers=auth_headers(legacy)).status_code == 200


def test_device_and_country_helpers():
    from app.routers.auth import _device_label, _country_name
    assert "Chrome" in _device_label("Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit Chrome/120 Safari/537")
    assert _country_name("RU") == "Россия"
    assert _country_name(None) == "—"
