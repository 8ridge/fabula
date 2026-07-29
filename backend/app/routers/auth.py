"""Роуты аутентификации и профиля."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import get_current_user
from ..google_auth import GoogleVerifier, get_google_verifier
from ..models import OAuthAccount, User
from ..ratelimit import limiter
from ..schemas import (
    ChangePasswordIn,
    GoogleAuthOut,
    GoogleCompleteIn,
    GoogleIn,
    LoginIn,
    RegisterIn,
    TokenOut,
    UserOut,
    UsernameIn,
)
from ..security import (
    create_access_token,
    create_registration_token,
    decode_registration_token,
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


async def _providers(db: AsyncSession, user: User) -> list[str]:
    p = []
    if user.password_hash is not None:
        p.append("email")
    res = await db.execute(
        select(OAuthAccount.id).where(
            OAuthAccount.user_id == user.id, OAuthAccount.provider == "google"
        )
    )
    if res.first() is not None:
        p.append("google")
    return p


async def _user_out(db: AsyncSession, user: User) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        email_verified=user.email_verified,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        providers=await _providers(db, user),
    )


def _session_out(user: User) -> dict:
    return {
        "access_token": create_access_token(user.id, user.token_version),
        "token_type": "bearer",
    }


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(request: Request, data: RegisterIn, db: AsyncSession = Depends(get_db)):
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
    return TokenOut(access_token=token, user=await _user_out(db, user))


@router.post("/login", response_model=TokenOut)
@limiter.limit("20/minute")
async def login(request: Request, data: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await _get_by_email(db, data.email)
    if user is None or user.password_hash is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверная почта или пароль")
    token = create_access_token(user.id, user.token_version)
    return TokenOut(access_token=token, user=await _user_out(db, user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await _user_out(db, user)


@router.patch("/username", response_model=UserOut)
async def change_username(data: UsernameIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if await _username_taken(db, data.username, exclude_id=user.id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ник занят")
    user.username = data.username
    await db.commit()
    await db.refresh(user)
    return await _user_out(db, user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(data: ChangePasswordIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.password_hash is not None:
        if not data.current_password or not verify_password(data.current_password, user.password_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Неверный текущий пароль")
    user.password_hash = hash_password(data.new_password)
    user.token_version += 1
    await db.commit()


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.token_version += 1
    await db.commit()


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.delete(user)
    await db.commit()


@router.post("/google", response_model=GoogleAuthOut)
@limiter.limit("20/minute")
async def google_auth(
    request: Request,
    data: GoogleIn,
    verifier: GoogleVerifier = Depends(get_google_verifier),
    db: AsyncSession = Depends(get_db),
):
    try:
        claims = verifier.verify(data.id_token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Недействительный токен Google")
    sub = claims["sub"]
    email = claims["email"].lower()
    ev = bool(claims.get("email_verified"))

    acc = (
        await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == "google", OAuthAccount.provider_user_id == sub
            )
        )
    ).scalar_one_or_none()
    if acc:
        user = await db.get(User, acc.user_id)
        return GoogleAuthOut(**_session_out(user), user=await _user_out(db, user))

    user = await _get_by_email(db, email)
    if user is not None:
        if not ev:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Google не подтвердил эту почту. Войди паролем и привяжи Google в профиле.",
            )
        db.add(OAuthAccount(user_id=user.id, provider="google", provider_user_id=sub))
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            acc = (
                await db.execute(
                    select(OAuthAccount).where(
                        OAuthAccount.provider == "google",
                        OAuthAccount.provider_user_id == sub,
                    )
                )
            ).scalar_one_or_none()
            if acc is not None:
                user = await db.get(User, acc.user_id)
        return GoogleAuthOut(**_session_out(user), user=await _user_out(db, user))

    if not ev:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google не подтвердил почту")
    return GoogleAuthOut(
        needs_username=True, registration_token=create_registration_token(sub, email)
    )


@router.post("/google/complete", response_model=TokenOut)
@limiter.limit("10/minute")
async def google_complete(request: Request, data: GoogleCompleteIn, db: AsyncSession = Depends(get_db)):
    payload = decode_registration_token(data.registration_token)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Ссылка регистрации недействительна")
    sub, email = payload["google_sub"], payload["email"].lower()
    if await _username_taken(db, data.username):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ник занят")
    if await _get_by_email(db, email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Аккаунт с этой почтой уже есть")
    user = User(email=email, username=data.username, password_hash=None, email_verified=True)
    db.add(user)
    try:
        await db.flush()
        db.add(OAuthAccount(user_id=user.id, provider="google", provider_user_id=sub))
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ник или аккаунт уже заняты")
    await db.refresh(user)
    return TokenOut(
        access_token=create_access_token(user.id, user.token_version),
        user=await _user_out(db, user),
    )


@router.post("/link/google", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def link_google(
    request: Request,
    data: GoogleIn,
    user: User = Depends(get_current_user),
    verifier: GoogleVerifier = Depends(get_google_verifier),
    db: AsyncSession = Depends(get_db),
):
    try:
        claims = verifier.verify(data.id_token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Недействительный токен Google")
    sub = claims["sub"]
    existing = (
        await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == "google", OAuthAccount.provider_user_id == sub
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        if existing.user_id != user.id:
            raise HTTPException(status.HTTP_409_CONFLICT, "Этот Google уже привязан к другому аккаунту")
        return  # идемпотентно
    db.add(OAuthAccount(user_id=user.id, provider="google", provider_user_id=sub))
    await db.commit()


@router.delete("/link/google", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_google(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    if user.password_hash is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Сначала добавь пароль")
    await db.execute(
        delete(OAuthAccount).where(
            OAuthAccount.user_id == user.id, OAuthAccount.provider == "google"
        )
    )
    await db.commit()
