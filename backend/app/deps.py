"""Зависимости FastAPI: достаём текущего пользователя из токена."""
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import User, UserSession
from .security import decode_access_token

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Требуется авторизация")
    payload = decode_access_token(creds.credentials)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Недействительный токен")
    user = await db.get(User, payload["user_id"])
    if user is None or user.token_version != payload["ver"]:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Сессия недействительна")
    sid = payload.get("sid")
    if sid is not None:
        s = await db.get(UserSession, sid)
        if s is None or s.revoked:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Сессия недействительна")
        now = datetime.now(timezone.utc)
        last = s.last_seen_at
        if last is not None and last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        if last is None or (now - last).total_seconds() > 120:
            s.last_seen_at = now
            await db.commit()
        setattr(user, "current_sid", sid)
    else:
        setattr(user, "current_sid", None)
    return user
