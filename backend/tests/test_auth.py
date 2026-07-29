from tests.conftest import auth_headers, register


def test_register_returns_username(client, creds):
    data = register(client, creds)
    assert data["user"]["username"] == creds["username"]
    assert data["user"]["email"] == creds["email"]
    assert "access_token" in data
