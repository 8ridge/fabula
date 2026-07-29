import io
from PIL import Image
from tests.conftest import auth_headers, register


def _png_bytes(size=(64, 64), color=(120, 40, 200)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


def test_upload_get_delete_avatar(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    me = client.get("/auth/me", headers=h).json()
    assert me["has_avatar"] is False
    r = client.post("/auth/avatar", headers=h,
                    files={"file": ("a.png", _png_bytes(), "image/png")})
    assert r.status_code == 200, r.text
    me2 = client.get("/auth/me", headers=h).json()
    assert me2["has_avatar"] is True and me2["avatar_v"]
    g = client.get(f"/auth/avatar/{me2['id']}")
    assert g.status_code == 200 and g.headers["content-type"] == "image/webp"
    assert len(g.content) > 0
    assert client.delete("/auth/avatar", headers=h).status_code == 204
    assert client.get("/auth/me", headers=h).json()["has_avatar"] is False
    assert client.get(f"/auth/avatar/{me2['id']}").status_code == 404


def test_upload_not_an_image(client, creds):
    h = auth_headers(register(client, creds)["access_token"])
    r = client.post("/auth/avatar", headers=h,
                    files={"file": ("x.png", b"not-an-image", "image/png")})
    assert r.status_code == 400


def test_upload_requires_auth(client):
    r = client.post("/auth/avatar", files={"file": ("a.png", _png_bytes(), "image/png")})
    assert r.status_code == 401


def test_upload_too_large(client, creds):
    h = auth_headers(register(client, creds)["access_token"])
    big = b"\x89PNG\r\n\x1a\n" + b"0" * (3 * 1024 * 1024 + 10)
    r = client.post("/auth/avatar", headers=h,
                    files={"file": ("big.png", big, "image/png")})
    assert r.status_code == 400
