"""Проверка Google ID-токена. Внедряется как зависимость — в тестах подменяется."""
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from .config import settings


class GoogleVerifier:
    def verify(self, token: str) -> dict:
        """Возвращает {'sub','email','email_verified'} или бросает исключение."""
        raise NotImplementedError


class RealGoogleVerifier(GoogleVerifier):
    def verify(self, token: str) -> dict:
        info = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.google_client_id
        )
        return {
            "sub": info["sub"],
            "email": info["email"],
            "email_verified": bool(info.get("email_verified", False)),
        }


def get_google_verifier() -> GoogleVerifier:
    return RealGoogleVerifier()
