import hashlib
import hmac
import time

import pytest

from app.telegram_auth import RealTelegramVerifier

BOT_TOKEN = "123456:TESTABCDEF"


def _sign_widget(data: dict, token: str = BOT_TOKEN) -> dict:
    d = {k: v for k, v in data.items() if k != "hash"}
    dcs = "\n".join(f"{k}={d[k]}" for k in sorted(d))
    secret = hashlib.sha256(token.encode()).digest()
    d["hash"] = hmac.new(secret, dcs.encode(), hashlib.sha256).hexdigest()
    return d


def test_widget_valid_signature():
    v = RealTelegramVerifier(BOT_TOKEN, ttl=86400)
    payload = _sign_widget({"id": 555, "username": "neo", "auth_date": int(time.time())})
    out = v.verify_widget(payload)
    assert out == {"tg_id": "555", "tg_username": "neo"}


def test_widget_tampered_hash_rejected():
    v = RealTelegramVerifier(BOT_TOKEN, ttl=86400)
    payload = _sign_widget({"id": 555, "auth_date": int(time.time())})
    payload["hash"] = "deadbeef"
    with pytest.raises(ValueError):
        v.verify_widget(payload)


def test_widget_stale_auth_date_rejected():
    v = RealTelegramVerifier(BOT_TOKEN, ttl=3600)
    payload = _sign_widget({"id": 555, "auth_date": int(time.time()) - 7200})
    with pytest.raises(ValueError):
        v.verify_widget(payload)


def test_widget_missing_hash_rejected():
    v = RealTelegramVerifier(BOT_TOKEN, ttl=86400)
    with pytest.raises(ValueError):
        v.verify_widget({"id": 555, "auth_date": int(time.time())})


def test_telegram_registration_token_roundtrip():
    from app.security import (
        create_telegram_registration_token,
        decode_telegram_registration_token,
        decode_registration_token,
    )
    t = create_telegram_registration_token("777", "neo")
    assert decode_telegram_registration_token(t) == {"tg_id": "777", "tg_username": "neo"}
    # google-декодер НЕ принимает telegram-токен (разный purpose)
    assert decode_registration_token(t) is None
