"""Обмен Discord OAuth2 code -> пользователь. Внедряется как зависимость (в тестах — фейк)."""
import requests

from .config import settings

_TOKEN_URL = "https://discord.com/api/oauth2/token"
_ME_URL = "https://discord.com/api/users/@me"


class DiscordVerifier:
    def exchange(self, code: str, redirect_uri: str) -> dict:
        """code -> {'discord_id','email','email_verified','username'} или бросает."""
        raise NotImplementedError


class RealDiscordVerifier(DiscordVerifier):
    def exchange(self, code: str, redirect_uri: str) -> dict:
        tok = requests.post(
            _TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": settings.discord_client_id,
                "client_secret": settings.discord_client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        if tok.status_code != 200:
            # ВРЕМЕННАЯ ДИАГНОСТИКА: пробрасываем причину от Discord (invalid_client/invalid_grant)
            raise ValueError(f"token {tok.status_code} {tok.text[:200]} | cid={settings.discord_client_id!r} secret_set={bool(settings.discord_client_secret)} redirect={redirect_uri!r}")
        access = tok.json()["access_token"]
        me = requests.get(_ME_URL, headers={"Authorization": f"Bearer {access}"}, timeout=10)
        if me.status_code != 200:
            raise ValueError(f"userinfo {me.status_code} {me.text[:200]}")
        u = me.json()
        email = u.get("email")
        return {
            "discord_id": str(u["id"]),
            "email": (email or "").lower() or None,
            "email_verified": bool(u.get("verified")) and bool(email),
            "username": u.get("username"),
        }


def get_discord_verifier() -> DiscordVerifier:
    return RealDiscordVerifier()
