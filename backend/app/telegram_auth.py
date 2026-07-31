"""Проверка подписи Telegram (Login Widget + Mini App). Внедряется как зависимость.

Login Widget:  secret_key = SHA256(bot_token);           hash = HMAC_SHA256(dcs, secret_key)
Mini App:      secret_key = HMAC_SHA256("WebAppData", bot_token); hash = HMAC_SHA256(dcs, secret_key)
где dcs — "key=value" всех полей (кроме hash), отсортированных по ключу, через '\\n'.
"""
import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from .config import settings


class TelegramVerifier:
    def verify_widget(self, data: dict) -> dict:
        """Возвращает {'tg_id': str, 'tg_username': str|None} или бросает ValueError."""
        raise NotImplementedError

    def verify_miniapp(self, init_data: str) -> dict:
        raise NotImplementedError


class RealTelegramVerifier(TelegramVerifier):
    def __init__(self, bot_token: str, ttl: int):
        self.bot_token = bot_token
        self.ttl = ttl

    def _check_fresh(self, auth_date_raw) -> None:
        try:
            auth_date = int(auth_date_raw)
        except (TypeError, ValueError):
            raise ValueError("no auth_date")
        if self.ttl and (time.time() - auth_date) > self.ttl:
            raise ValueError("stale auth_date")

    def verify_widget(self, data: dict) -> dict:
        d = {k: v for k, v in data.items() if k != "hash"}
        recv = data.get("hash")
        if not recv:
            raise ValueError("no hash")
        self._check_fresh(d.get("auth_date"))
        dcs = "\n".join(f"{k}={d[k]}" for k in sorted(d))
        secret = hashlib.sha256(self.bot_token.encode()).digest()
        calc = hmac.new(secret, dcs.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calc, recv):
            raise ValueError("bad hash")
        if "id" not in d:
            raise ValueError("no id")
        return {"tg_id": str(d["id"]), "tg_username": d.get("username")}

    def verify_miniapp(self, init_data: str) -> dict:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        recv = pairs.pop("hash", None)
        if not recv:
            raise ValueError("no hash")
        self._check_fresh(pairs.get("auth_date"))
        dcs = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
        secret = hmac.new(b"WebAppData", self.bot_token.encode(), hashlib.sha256).digest()
        calc = hmac.new(secret, dcs.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calc, recv):
            raise ValueError("bad hash")
        user = json.loads(pairs.get("user", "{}"))
        if "id" not in user:
            raise ValueError("no id")
        return {"tg_id": str(user["id"]), "tg_username": user.get("username")}


def get_telegram_verifier() -> TelegramVerifier:
    return RealTelegramVerifier(settings.telegram_bot_token, settings.telegram_auth_ttl)
