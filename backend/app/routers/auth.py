"""Роуты аутентификации и профиля."""
from datetime import datetime, timezone
from io import BytesIO

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    Response,
    UploadFile,
    status,
)
from PIL import Image
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..deps import get_current_user
from ..discord_auth import DiscordVerifier, get_discord_verifier
from ..google_auth import GoogleVerifier, get_google_verifier
from ..models import OAuthAccount, User, UserSession
from ..ratelimit import limiter
from ..schemas import (
    ChangePasswordIn,
    DiscordAuthOut,
    DiscordCompleteIn,
    DiscordIn,
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
    create_discord_registration_token,
    create_registration_token,
    decode_discord_registration_token,
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
    res = await db.execute(select(OAuthAccount.provider).where(OAuthAccount.user_id == user.id))
    have = {row[0] for row in res.all()}
    for prov in ("google", "telegram", "discord"):
        if prov in have:
            p.append(prov)
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
        has_avatar=user.avatar_data is not None,
        avatar_v=int(user.avatar_updated_at.timestamp()) if user.avatar_updated_at else None,
    )


_UA_BROWSERS = [("YaBrowser", "Yandex"), ("Edg", "Edge"), ("OPR", "Opera"),
                ("Chrome", "Chrome"), ("Firefox", "Firefox"), ("Safari", "Safari")]
_COUNTRY_NAMES = {
    "RU": "Россия", "UA": "Украина", "BY": "Беларусь", "KZ": "Казахстан", "DE": "Германия",
    "US": "США", "GB": "Великобритания", "PL": "Польша", "FR": "Франция", "NL": "Нидерланды",
    "TR": "Турция", "IT": "Италия", "ES": "Испания", "CA": "Канада", "GE": "Грузия",
    "AM": "Армения", "AZ": "Азербайджан", "UZ": "Узбекистан", "CN": "Китай", "IN": "Индия",
    "JP": "Япония", "AE": "ОАЭ", "CY": "Кипр", "CZ": "Чехия", "FI": "Финляндия",
    "SE": "Швеция", "RS": "Сербия", "LT": "Литва", "LV": "Латвия", "EE": "Эстония",
}


def _device_label(ua: str) -> str:
    ua = ua or ""
    browser = next((name for tok, name in _UA_BROWSERS if tok in ua), None)
    if "Windows" in ua:
        os_ = "Windows"
    elif "Android" in ua:
        os_ = "Android"
    elif "iPhone" in ua or "iPad" in ua:
        os_ = "iOS"
    elif "Mac OS" in ua or "Macintosh" in ua:
        os_ = "macOS"
    elif "Linux" in ua:
        os_ = "Linux"
    else:
        os_ = None
    if browser and os_:
        return f"{browser} · {os_}"
    return browser or os_ or "Неизвестное устройство"


def _country_name(code: str | None) -> str:
    if not code:
        return "—"
    return _COUNTRY_NAMES.get(code.upper(), code.upper())


async def _issue_session(db: AsyncSession, user: User, request: Request) -> str:
    ua = request.headers.get("user-agent", "")
    country = request.headers.get("cf-ipcountry")
    if country in (None, "", "XX", "T1"):
        country = None
    s = UserSession(user_id=user.id, device=_device_label(ua), country=country)
    db.add(s)
    await db.flush()
    return create_access_token(user.id, user.token_version, sid=s.id)


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
    token = await _issue_session(db, user, request)
    await db.commit()
    return TokenOut(access_token=token, user=await _user_out(db, user))


@router.post("/login", response_model=TokenOut)
@limiter.limit("20/minute")
async def login(request: Request, data: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await _get_by_email(db, data.email)
    if user is None or user.password_hash is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверная почта или пароль")
    token = await _issue_session(db, user, request)
    await db.commit()
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
    await db.execute(update(UserSession).where(UserSession.user_id == user.id).values(revoked=True))
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
        token = await _issue_session(db, user, request)
        await db.commit()
        return GoogleAuthOut(access_token=token, token_type="bearer", user=await _user_out(db, user))

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
        token = await _issue_session(db, user, request)
        await db.commit()
        return GoogleAuthOut(access_token=token, token_type="bearer", user=await _user_out(db, user))

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
    token = await _issue_session(db, user, request)
    await db.commit()
    return TokenOut(access_token=token, user=await _user_out(db, user))


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


def _check_discord_redirect(redirect_uri: str) -> None:
    allow = settings.discord_redirect_list
    if allow and redirect_uri not in allow:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Недопустимый redirect_uri")


@router.post("/discord", response_model=DiscordAuthOut)
@limiter.limit("20/minute")
async def discord_auth(
    request: Request,
    data: DiscordIn,
    verifier: DiscordVerifier = Depends(get_discord_verifier),
    db: AsyncSession = Depends(get_db),
):
    _check_discord_redirect(data.redirect_uri)
    try:
        info = verifier.exchange(data.code, data.redirect_uri)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Не удалось войти через Discord")
    did = info["discord_id"]
    email = info.get("email")
    ev = bool(info.get("email_verified"))

    acc = (
        await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == "discord", OAuthAccount.provider_user_id == did
            )
        )
    ).scalar_one_or_none()
    if acc:
        user = await db.get(User, acc.user_id)
        token = await _issue_session(db, user, request)
        await db.commit()
        return DiscordAuthOut(access_token=token, token_type="bearer", user=await _user_out(db, user))

    if email:
        user = await _get_by_email(db, email)
        if user is not None:
            if not ev:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    "Discord не подтвердил эту почту. Войди другим способом и привяжи Discord в профиле.",
                )
            db.add(OAuthAccount(user_id=user.id, provider="discord", provider_user_id=did))
            try:
                await db.commit()
            except IntegrityError:
                await db.rollback()
            token = await _issue_session(db, user, request)
            await db.commit()
            return DiscordAuthOut(access_token=token, token_type="bearer", user=await _user_out(db, user))

    return DiscordAuthOut(
        needs_username=True,
        registration_token=create_discord_registration_token(did, email or "", info.get("username")),
    )


@router.post("/discord/complete", response_model=TokenOut)
@limiter.limit("10/minute")
async def discord_complete(request: Request, data: DiscordCompleteIn, db: AsyncSession = Depends(get_db)):
    payload = decode_discord_registration_token(data.registration_token)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Ссылка регистрации недействительна")
    did, email = payload["discord_id"], (payload.get("email") or None)
    if await _username_taken(db, data.username):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ник занят")
    if email and await _get_by_email(db, email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Аккаунт с этой почтой уже есть")
    user = User(email=email, username=data.username, password_hash=None, email_verified=bool(email))
    db.add(user)
    try:
        await db.flush()
        db.add(OAuthAccount(user_id=user.id, provider="discord", provider_user_id=did))
        await db.commit()
    except IntegrityError:
        await db.rollback()
        acc = (
            await db.execute(
                select(OAuthAccount).where(
                    OAuthAccount.provider == "discord", OAuthAccount.provider_user_id == did
                )
            )
        ).scalar_one_or_none()
        if acc is None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Ник или аккаунт уже заняты")
        user = await db.get(User, acc.user_id)
    await db.refresh(user)
    token = await _issue_session(db, user, request)
    await db.commit()
    return TokenOut(access_token=token, user=await _user_out(db, user))


MAX_AVATAR_BYTES = 3 * 1024 * 1024
MAX_AVATAR_DIM = 6000


def _process_avatar(raw: bytes) -> bytes:
    """Валидирует картинку и возвращает webp 256x256 (квадрат, центр-кроп)."""
    if len(raw) > MAX_AVATAR_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Файл слишком большой (макс 3 МБ)")
    try:
        Image.open(BytesIO(raw)).verify()
        img = Image.open(BytesIO(raw))
        if img.width > MAX_AVATAR_DIM or img.height > MAX_AVATAR_DIM:
            raise ValueError("too large")
        img = img.convert("RGB")
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Файл не является картинкой")
    side = min(img.width, img.height)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side)).resize((256, 256))
    out = BytesIO()
    img.save(out, format="WEBP", quality=90)
    return out.getvalue()


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    raw = await file.read()
    user.avatar_data = _process_avatar(raw)
    user.avatar_updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"avatar": True, "v": int(user.avatar_updated_at.timestamp())}


@router.delete("/avatar", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    user.avatar_data = None
    user.avatar_updated_at = None
    await db.commit()


@router.get("/avatar/{user_id}")
async def get_avatar(user_id: int, db: AsyncSession = Depends(get_db)):
    u = await db.get(User, user_id)
    if u is None or u.avatar_data is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Нет аватара")
    return Response(
        content=u.avatar_data,
        media_type="image/webp",
        headers={"Cache-Control": "public, max-age=300"},
    )


@router.get("/sessions")
async def list_sessions(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == user.id, UserSession.revoked == False)  # noqa: E712
        .order_by(UserSession.last_seen_at.desc())
    )
    cur = getattr(user, "current_sid", None)
    return [
        {
            "id": s.id,
            "device": s.device,
            "country": s.country,
            "country_name": _country_name(s.country),
            "created_at": s.created_at,
            "last_seen_at": s.last_seen_at,
            "current": s.id == cur,
        }
        for s in res.scalars()
    ]


@router.delete("/sessions/{sid}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_session(
    sid: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    s = await db.get(UserSession, sid)
    if s is None or s.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сессия не найдена")
    s.revoked = True
    await db.commit()
