"""Роуты аутентификации и профиля."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import (
    ChangePasswordIn,
    LoginIn,
    RegisterIn,
    TokenOut,
    UserOut,
    UsernameIn,
)
from ..security import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _get_by_email(db: AsyncSession, email: str) -> User | None:
    res = await db.execute(select(User).where(User.email == email.lower()))
    return res.scalar_one_or_none()


async def _username_taken(db: AsyncSession, username: str, exclude_id: int | None = None) -> bool:
    q = select(User.id).where(func.lower(User.username) == username.lower())
    if exclude_id is not None:
        q = q.where(User.id != exclude_id)
    res = await db.execute(q)
    return res.first() is not None


def _providers(user: User) -> list[str]:
    p = []
    if user.password_hash is not None:
        p.append("email")
    return p  # google добавится в Фазе 3


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        email_verified=user.email_verified,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        providers=_providers(user),
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    if await _get_by_email(db, data.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Почта уже зарегистрирована")
    if await _username_taken(db, data.username):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ник занят")
    user = User(
        email=data.email.lower(),
        username=data.username,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, user.token_version)
    return TokenOut(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await _get_by_email(db, data.email)
    if user is None or user.password_hash is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверная почта или пароль")
    token = create_access_token(user.id, user.token_version)
    return TokenOut(access_token=token, user=_user_out(user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return _user_out(user)


@router.patch("/username", response_model=UserOut)
async def change_username(data: UsernameIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if await _username_taken(db, data.username, exclude_id=user.id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ник занят")
    user.username = data.username
    await db.commit()
    await db.refresh(user)
    return _user_out(user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(data: ChangePasswordIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.password_hash is not None:
        if not data.current_password or not verify_password(data.current_password, user.password_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Неверный текущий пароль")
    user.password_hash = hash_password(data.new_password)
    await db.commit()


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.token_version += 1
    await db.commit()


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.delete(user)
    await db.commit()
