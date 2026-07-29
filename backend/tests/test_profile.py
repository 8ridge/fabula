from tests.conftest import auth_headers, register


def test_change_username_ok(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    r = client.patch("/auth/username", json={"username": creds["username"] + "x"}, headers=h)
    assert r.status_code == 200
    assert r.json()["username"] == creds["username"] + "x"


def test_change_username_taken(client, creds):
    a = register(client, creds)
    import uuid
    b_creds = {"username": "u" + uuid.uuid4().hex[:7], "email": "b" + creds["email"], "password": "secret1"}
    register(client, b_creds)
    r = client.patch("/auth/username", json={"username": b_creds["username"]},
                     headers=auth_headers(a["access_token"]))
    assert r.status_code == 409


def test_change_password_then_login(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    r = client.post("/auth/change-password",
                    json={"current_password": creds["password"], "new_password": "newpass9"}, headers=h)
    assert r.status_code == 204
    # старый пароль больше не подходит
    assert client.post("/auth/login", json={"email": creds["email"], "password": creds["password"]}).status_code == 401
    # новый — подходит
    assert client.post("/auth/login", json={"email": creds["email"], "password": "newpass9"}).status_code == 200


def test_change_password_wrong_current(client, creds):
    data = register(client, creds)
    r = client.post("/auth/change-password",
                    json={"current_password": "wrong", "new_password": "newpass9"},
                    headers=auth_headers(data["access_token"]))
    assert r.status_code == 400


def test_delete_account(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    assert client.delete("/auth/account", headers=h).status_code == 204
    # токен больше не валиден (юзера нет)
    assert client.get("/auth/me", headers=h).status_code == 401
    # можно зарегать ту же почту заново
    assert client.post("/auth/register", json=creds).status_code == 201
