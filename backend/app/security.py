"""Хэширование паролей (argon2) и работа с JWT-токенами."""
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from .config import settings

_ph = PasswordHasher()


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _ph.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_access_token(user_id: int, token_version: int, sid: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "ver": token_version,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_ttl_min),
    }
    if sid is not None:
        payload["sid"] = sid
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_access_token(token: str) -> dict | None:
    """Возвращает {'user_id': int, 'ver': int, 'sid': int | None} из валидного токена или None."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        return {"user_id": int(payload["sub"]), "ver": int(payload["ver"]), "sid": payload.get("sid")}
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def create_registration_token(google_sub: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "purpose": "google_register",
        "gsub": google_sub,
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_registration_token(token: str) -> dict | None:
    """{'google_sub','email'} из валидного токена регистрации или None."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        if payload.get("purpose") != "google_register":
            return None
        return {"google_sub": payload["gsub"], "email": payload["email"]}
    except (jwt.PyJWTError, KeyError):
        return None


def create_discord_registration_token(discord_id: str, email: str, username: str | None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "purpose": "discord_register",
        "did": discord_id,
        "email": email,
        "username": username,
        "iat": now,
        "exp": now + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_discord_registration_token(token: str) -> dict | None:
    """{'discord_id','email','username'} из валидного discord-токена регистрации или None."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        if payload.get("purpose") != "discord_register":
            return None
        return {"discord_id": payload["did"], "email": payload["email"], "username": payload.get("username")}
    except (jwt.PyJWTError, KeyError):
        return None
