from tests.conftest import auth_headers, google_token, register


def test_google_new_user_needs_username(client):
    tok = google_token("g_new1", "gnew1@t.io")
    r = client.post("/auth/google", json={"id_token": tok})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["needs_username"] is True
    assert body["registration_token"]
    assert body.get("access_token") is None


def test_google_complete_creates_user(client):
    tok = google_token("g_new2", "gnew2@t.io")
    rt = client.post("/auth/google", json={"id_token": tok}).json()["registration_token"]
    r = client.post("/auth/google/complete", json={"registration_token": rt, "username": "gnickone"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["username"] == "gnickone"
    assert data["user"]["providers"] == ["google"]
    # повторный вход тем же sub -> сразу сессия
    r2 = client.post("/auth/google", json={"id_token": tok})
    assert r2.status_code == 200 and r2.json().get("access_token")


def test_google_autolink_to_existing_email(client, creds):
    register(client, creds)  # email/password юзер
    tok = google_token("g_link1", creds["email"], email_verified=True)
    r = client.post("/auth/google", json={"id_token": tok})
    assert r.status_code == 200 and r.json().get("access_token"), r.text
    me = client.get("/auth/me", headers=auth_headers(r.json()["access_token"])).json()
    assert set(me["providers"]) == {"email", "google"}


def test_google_autolink_idempotent(client, creds):
    register(client, creds)
    tok = google_token("g_link_idem", creds["email"], email_verified=True)
    r1 = client.post("/auth/google", json={"id_token": tok})
    r2 = client.post("/auth/google", json={"id_token": tok})
    assert r1.status_code == 200 and r2.status_code == 200
    assert r2.json().get("access_token")
    me = client.get("/auth/me", headers=auth_headers(r2.json()["access_token"])).json()
    assert set(me["providers"]) == {"email", "google"}


def test_google_unverified_email_existing_rejected(client, creds):
    register(client, creds)
    tok = google_token("g_link2", creds["email"], email_verified=False)
    assert client.post("/auth/google", json={"id_token": tok}).status_code == 400


def test_google_bad_token(client):
    assert client.post("/auth/google", json={"id_token": "BAD"}).status_code == 401


def test_complete_taken_username(client):
    tok = google_token("g_new3", "gnew3@t.io")
    rt = client.post("/auth/google", json={"id_token": tok}).json()["registration_token"]
    # занять ник другим
    tok2 = google_token("g_new4", "gnew4@t.io")
    rt2 = client.post("/auth/google", json={"id_token": tok2}).json()["registration_token"]
    client.post("/auth/google/complete", json={"registration_token": rt2, "username": "takennick"})
    r = client.post("/auth/google/complete", json={"registration_token": rt, "username": "takennick"})
    assert r.status_code == 409


def test_complete_bad_registration_token(client):
    r = client.post("/auth/google/complete", json={"registration_token": "nope", "username": "somenick"})
    assert r.status_code == 401


def test_registration_token_not_usable_as_access(client):
    tok = google_token("g_new5", "gnew5@t.io")
    rt = client.post("/auth/google", json={"id_token": tok}).json()["registration_token"]
    assert client.get("/auth/me", headers=auth_headers(rt)).status_code == 401
