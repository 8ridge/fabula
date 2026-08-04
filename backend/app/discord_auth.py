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
            info = {}
            try:
                info = tok.json()
            except Exception:
                pass
            desc = (info.get("error_description") or "").lower()
            if tok.status_code == 429 or "rate lim" in desc:
                raise ValueError("rate_limited")
            raise ValueError(info.get("error") or f"http_{tok.status_code}")
        access = tok.json()["access_token"]
        me = requests.get(_ME_URL, headers={"Authorization": f"Bearer {access}"}, timeout=10)
        if me.status_code != 200:
            raise ValueError("userinfo_failed")
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
