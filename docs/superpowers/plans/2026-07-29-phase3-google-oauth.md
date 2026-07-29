# Фаза 3 — Google OAuth: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вход/регистрация через Google (GIS ID-token flow) с авто-связыванием по подтверждённой почте, обязательным выбором ника для новых, привязкой/отвязкой в профиле — с проработанной безопасностью.

**Architecture:** Достраиваем FastAPI-бэкенд (`backend/app`). Новая таблица `oauth_accounts`. Фронт получает Google ID-токен через GIS, шлёт на бэк, бэк проверяет (google-auth), выдаёт наш JWT (как email-вход). Проверялка токена — внедряемая зависимость (в тестах фейк). Новый юзер не создаётся до выбора ника (короткоживущий `registration_token`). Тесты — pytest+SQLite с фейк-верифаером.

**Tech Stack:** FastAPI, async SQLAlchemy 2.0, PyJWT, google-auth, slowapi, Alembic, pytest, Nuxt 3.

---

## Файлы

Бэкенд (`backend/`):
- Modify `app/config.py` — `google_client_id`, `rate_limit_enabled`.
- Modify `app/models.py` — модель `OAuthAccount`.
- Modify `app/security.py` — `create_registration_token`/`decode_registration_token`.
- Create `app/google_auth.py` — `GoogleVerifier` + `RealGoogleVerifier` + `get_google_verifier`.
- Create `app/ratelimit.py` — общий `limiter` (slowapi).
- Modify `app/schemas.py` — `GoogleIn`, `GoogleCompleteIn`, `GoogleAuthOut`.
- Modify `app/routers/auth.py` — async `_user_out`/`_providers`, эндпойнты google/complete/link/unlink, rate-limit на login/register.
- Modify `app/main.py` — подключение limiter.
- Modify `requirements.txt` — google-auth, slowapi.
- Create `alembic/versions/0003_oauth_accounts.py`.
- Modify `tests/conftest.py` — фейк-верифаер + отключение rate-limit.
- Create `tests/test_google.py`.

Фронт (`web/`):
- Modify `nuxt.config.ts` — `runtimeConfig.public.googleClientId`.
- Modify `pages/index.vue` + `index.html` — GIS-скрипт, кнопка Google, экран «Придумай ник».
- Modify `pages/app.vue` — привязка/отвязка Google.

---

## Task 1: Конфиг + модель OAuthAccount

**Files:** Modify `backend/app/config.py`, `backend/app/models.py`

- [ ] **Step 1: config — google_client_id + rate_limit_enabled**

В `backend/app/config.py`, в класс `Settings` (после `cors_origins`), добавить поля:

```python
    google_client_id: str = ""
    rate_limit_enabled: bool = True
```

- [ ] **Step 2: модель OAuthAccount**

В `backend/app/models.py` добавить импорт `ForeignKey` в строку импорта sqlalchemy (сделать её: `from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func`) и добавить в конец файла:

```python
class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    provider: Mapped[str] = mapped_column(String(20), nullable=False)  # 'google'
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)  # Google sub
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_uid"),
    )
```

Добавить `UniqueConstraint` в импорт sqlalchemy: итоговая строка —
`from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func`.

- [ ] **Step 3: проверить импорт модели и колонки**

Run: `cd backend && ./.venv/Scripts/python.exe -c "from app.models import OAuthAccount; print([c.name for c in OAuthAccount.__table__.columns])"`
Expected: `['id', 'user_id', 'provider', 'provider_user_id', 'created_at']`

- [ ] **Step 4: Commit**

```bash
git add backend/app/config.py backend/app/models.py
git commit -m "feat(models): OAuthAccount + google_client_id/rate_limit_enabled в конфиге"
```

---

## Task 2: registration_token (security.py)

**Files:** Modify `backend/app/security.py`

- [ ] **Step 1: функции токена регистрации**

В `backend/app/security.py` добавить в конец файла:

```python
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
```

- [ ] **Step 2: проверить, что registration_token НЕ проходит как access-токен**

Run: `cd backend && ./.venv/Scripts/python.exe -c "from app.security import create_registration_token, decode_access_token, decode_registration_token; t=create_registration_token('g1','a@b.io'); print('as_access', decode_access_token(t)); print('as_reg', decode_registration_token(t))"`
Expected: `as_access None` (нет `ver` → отвергнут), `as_reg {'google_sub': 'g1', 'email': 'a@b.io'}`

- [ ] **Step 3: Commit**

```bash
git add backend/app/security.py
git commit -m "feat(auth): registration_token (purpose=google_register, не access-токен)"
```

---

## Task 3: Внедряемая проверялка Google-токена

**Files:** Create `backend/app/google_auth.py`, Modify `backend/requirements.txt`

- [ ] **Step 1: зависимость google-auth**

В конец `backend/requirements.txt`:

```
google-auth==2.37.0
```

Установить: `cd backend && ./.venv/Scripts/python.exe -m pip install google-auth==2.37.0`
Expected: успешно.

- [ ] **Step 2: модуль верификации**

Create `backend/app/google_auth.py`:

```python
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
```

- [ ] **Step 3: проверить импорт**

Run: `cd backend && ./.venv/Scripts/python.exe -c "from app.google_auth import get_google_verifier, GoogleVerifier; print(type(get_google_verifier()).__name__)"`
Expected: `RealGoogleVerifier`

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt backend/app/google_auth.py
git commit -m "feat(auth): внедряемая проверялка Google ID-токена (google-auth)"
```

---

## Task 4: Схемы + фейк-верифаер в conftest

**Files:** Modify `backend/app/schemas.py`, Modify `backend/tests/conftest.py`

- [ ] **Step 1: схемы Google**

В `backend/app/schemas.py` добавить в конец (используется существующий `USERNAME_PATTERN`):

```python
class GoogleIn(BaseModel):
    id_token: str


class GoogleCompleteIn(BaseModel):
    registration_token: str
    username: str = Field(pattern=USERNAME_PATTERN)


class GoogleAuthOut(BaseModel):
    access_token: str | None = None
    token_type: str | None = None
    user: UserOut | None = None
    needs_username: bool = False
    registration_token: str | None = None
```

- [ ] **Step 2: фейк-верифаер + отключение rate-limit в conftest**

В `backend/tests/conftest.py`:
(a) в самом верху, рядом с другими `os.environ[...]`, добавить:

```python
os.environ["RATE_LIMIT_ENABLED"] = "false"
```

(b) добавить фейк-класс и override. В фикстуру `client`, ПОСЛЕ `from app.main import app` и ПЕРЕД `with TestClient(app) as c:`, вставить:

```python
    from app.google_auth import get_google_verifier

    class _FakeGoogleVerifier:
        def verify(self, token: str) -> dict:
            if token == "BAD":
                raise ValueError("bad token")
            import json
            d = json.loads(token)
            return {
                "sub": d["sub"],
                "email": d["email"],
                "email_verified": bool(d.get("email_verified", True)),
            }

    app.dependency_overrides[get_google_verifier] = lambda: _FakeGoogleVerifier()
```

(c) добавить хелпер в конец `conftest.py` — удобная сборка «токена»:

```python
def google_token(sub: str, email: str, email_verified: bool = True) -> str:
    import json
    return json.dumps({"sub": sub, "email": email, "email_verified": email_verified})
```

- [ ] **Step 3: проверить, что существующие тесты не сломались**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q`
Expected: `10 passed` (rate-limit отключён, override не мешает).

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas.py backend/tests/conftest.py
git commit -m "feat(auth): схемы Google + фейк-верифаер в тестах"
```

---

## Task 5: POST /auth/google + /auth/google/complete

**Files:** Modify `backend/app/routers/auth.py`, Create `backend/tests/test_google.py`

- [ ] **Step 1: тесты нового флоу (сначала падают)**

Create `backend/tests/test_google.py`:

```python
from tests.conftest import auth_headers, google_token, register


def test_google_new_user_needs_username(client):
    tok = google_token("g_new1", "gnew1@t.io")
    r = client.post("/auth/google", json={"id_token": tok})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["needs_username"] is True
    assert body["registration_token"]
    assert body.get("access_token") is None


def test_google_complete_creates_user(client):
    tok = google_token("g_new2", "gnew2@t.io")
    rt = client.post("/auth/google", json={"id_token": tok}).json()["registration_token"]
    r = client.post("/auth/google/complete", json={"registration_token": rt, "username": "gnickone"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["username"] == "gnickone"
    assert data["user"]["providers"] == ["google"]
    # повторный вход тем же sub -> сразу сессия
    r2 = client.post("/auth/google", json={"id_token": tok})
    assert r2.status_code == 200 and r2.json().get("access_token")


def test_google_autolink_to_existing_email(client, creds):
    register(client, creds)  # email/password юзер
    tok = google_token("g_link1", creds["email"], email_verified=True)
    r = client.post("/auth/google", json={"id_token": tok})
    assert r.status_code == 200 and r.json().get("access_token"), r.text
    me = client.get("/auth/me", headers=auth_headers(r.json()["access_token"])).json()
    assert set(me["providers"]) == {"email", "google"}


def test_google_unverified_email_existing_rejected(client, creds):
    register(client, creds)
    tok = google_token("g_link2", creds["email"], email_verified=False)
    assert client.post("/auth/google", json={"id_token": tok}).status_code == 400


def test_google_bad_token(client):
    assert client.post("/auth/google", json={"id_token": "BAD"}).status_code == 401


def test_complete_taken_username(client):
    tok = google_token("g_new3", "gnew3@t.io")
    rt = client.post("/auth/google", json={"id_token": tok}).json()["registration_token"]
    # занять ник другим
    tok2 = google_token("g_new4", "gnew4@t.io")
    rt2 = client.post("/auth/google", json={"id_token": tok2}).json()["registration_token"]
    client.post("/auth/google/complete", json={"registration_token": rt2, "username": "takennick"})
    r = client.post("/auth/google/complete", json={"registration_token": rt, "username": "takennick"})
    assert r.status_code == 409


def test_complete_bad_registration_token(client):
    r = client.post("/auth/google/complete", json={"registration_token": "nope", "username": "somenick"})
    assert r.status_code == 401


def test_registration_token_not_usable_as_access(client):
    tok = google_token("g_new5", "gnew5@t.io")
    rt = client.post("/auth/google", json={"id_token": tok}).json()["registration_token"]
    assert client.get("/auth/me", headers=auth_headers(rt)).status_code == 401
```

- [ ] **Step 2: запустить — падают (эндпойнтов нет)**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/test_google.py -q`
Expected: FAIL (404 на /auth/google).

- [ ] **Step 3: async _user_out/_providers + эндпойнты**

В `backend/app/routers/auth.py`:

(a) расширить импорты:
- модели: `from ..models import OAuthAccount, User`
- sqlalchemy: `from sqlalchemy import delete, func, select`
- security: `from ..security import (create_access_token, create_registration_token, decode_registration_token, hash_password, verify_password)`
- схемы: добавить `GoogleAuthOut, GoogleCompleteIn, GoogleIn` в блок `from ..schemas import (...)`
- добавить: `from ..google_auth import GoogleVerifier, get_google_verifier`
- добавить: `from sqlalchemy.exc import IntegrityError`

(b) заменить sync `_providers`/`_user_out` на async и добавить хелпер токена:

```python
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
```

(c) обновить ВСЕ существующие вызовы `_user_out(user)` → `await _user_out(db, user)` в `register`, `login`, `me`, `change_username`. Например в `register`/`login`:
`return TokenOut(access_token=create_access_token(user.id, user.token_version), user=await _user_out(db, user))`;
в `me`: `return await _user_out(db, user)`;
в `change_username`: `return await _user_out(db, user)`.

(d) добавить новые эндпойнты в конец файла:

```python
@router.post("/google", response_model=GoogleAuthOut)
async def google_auth(
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
        await db.commit()
        return GoogleAuthOut(**_session_out(user), user=await _user_out(db, user))

    if not ev:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google не подтвердил почту")
    return GoogleAuthOut(
        needs_username=True, registration_token=create_registration_token(sub, email)
    )


@router.post("/google/complete", response_model=TokenOut)
async def google_complete(data: GoogleCompleteIn, db: AsyncSession = Depends(get_db)):
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
    return TokenOut(access_token=create_access_token(user.id, user.token_version), user=await _user_out(db, user))
```

- [ ] **Step 4: запустить google-тесты + регресс**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q`
Expected: PASS всё (10 старых + новые google-тесты, кроме link/unlink — их добавим в Task 6; тесты link/unlink пока не написаны).

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/auth.py backend/tests/test_google.py
git commit -m "feat(auth): POST /auth/google + /auth/google/complete (вход/авто-связывание/регистрация)"
```

---

## Task 6: Привязка/отвязка Google (link/unlink)

**Files:** Modify `backend/app/routers/auth.py`, Modify `backend/tests/test_google.py`

- [ ] **Step 1: тесты link/unlink**

Дописать в `backend/tests/test_google.py`:

```python
def test_link_and_unlink_google(client, creds):
    data = register(client, creds)  # есть пароль
    h = auth_headers(data["access_token"])
    tok = google_token("g_link_me", "somethingelse@t.io")
    assert client.post("/auth/link/google", json={"id_token": tok}, headers=h).status_code == 204
    me = client.get("/auth/me", headers=h).json()
    assert set(me["providers"]) == {"email", "google"}
    # отвязка (пароль есть) -> 204
    assert client.delete("/auth/link/google", headers=h).status_code == 204
    assert client.get("/auth/me", headers=h).json()["providers"] == ["email"]


def test_link_google_already_on_other_account(client, creds):
    a = register(client, creds)
    # b — отдельный аккаунт с привязанным google sub
    tok = google_token("g_shared", "gshared@t.io")
    rt = client.post("/auth/google", json={"id_token": tok}).json()["registration_token"]
    client.post("/auth/google/complete", json={"registration_token": rt, "username": "gsharednick"})
    # a пытается привязать тот же sub -> 409
    r = client.post("/auth/link/google", json={"id_token": tok}, headers=auth_headers(a["access_token"]))
    assert r.status_code == 409


def test_unlink_google_only_login_blocked(client):
    # google-only аккаунт (пароля нет) -> отвязка запрещена
    tok = google_token("g_only", "gonly@t.io")
    rt = client.post("/auth/google", json={"id_token": tok}).json()["registration_token"]
    data = client.post("/auth/google/complete", json={"registration_token": rt, "username": "gonlynick"}).json()
    r = client.delete("/auth/link/google", headers=auth_headers(data["access_token"]))
    assert r.status_code == 400
```

- [ ] **Step 2: запустить — падают**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/test_google.py -q`
Expected: FAIL на новых (404 на /auth/link/google).

- [ ] **Step 3: эндпойнты link/unlink**

Добавить в конец `backend/app/routers/auth.py`:

```python
@router.post("/link/google", status_code=status.HTTP_204_NO_CONTENT)
async def link_google(
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
```

- [ ] **Step 4: запустить весь набор**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q`
Expected: PASS всё (10 старых + все google-тесты).

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/auth.py backend/tests/test_google.py
git commit -m "feat(auth): привязка/отвязка Google (link/unlink, защита от угона/локаута)"
```

---

## Task 7: Alembic-миграция 0003 (oauth_accounts)

**Files:** Create `backend/alembic/versions/0003_oauth_accounts.py`

- [ ] **Step 1: миграция**

Create `backend/alembic/versions/0003_oauth_accounts.py`:

```python
"""oauth_accounts

Revision ID: 0003
Revises: 0002
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "oauth_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("provider_user_id", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_uid"),
    )
    op.create_index("ix_oauth_accounts_user_id", "oauth_accounts", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_oauth_accounts_user_id", "oauth_accounts")
    op.drop_table("oauth_accounts")
```

- [ ] **Step 2: проверить миграции на чистой SQLite**

Run: `cd backend && rm -f _m.db && DATABASE_URL="sqlite+aiosqlite:///./_m.db" ./.venv/Scripts/python.exe -m alembic upgrade head 2>&1 | grep -E "Running upgrade"; rm -f _m.db`
Expected: строки про 0001, 0002, 0003 — без ошибок.

- [ ] **Step 3: Commit**

```bash
git add backend/alembic/versions/0003_oauth_accounts.py
git commit -m "feat(db): миграция 0003 — таблица oauth_accounts"
```

---

## Task 8: Rate-limit (slowapi)

**Files:** Modify `backend/requirements.txt`, Create `backend/app/ratelimit.py`, Modify `backend/app/main.py`, Modify `backend/app/routers/auth.py`

- [ ] **Step 1: зависимость**

В `backend/requirements.txt` добавить:

```
slowapi==0.1.9
```

Установить: `cd backend && ./.venv/Scripts/python.exe -m pip install slowapi==0.1.9`

- [ ] **Step 2: общий limiter**

Create `backend/app/ratelimit.py`:

```python
"""Общий rate-limiter (slowapi). В тестах отключается через RATE_LIMIT_ENABLED=false."""
from slowapi import Limiter
from slowapi.util import get_remote_address

from .config import settings

limiter = Limiter(key_func=get_remote_address, enabled=settings.rate_limit_enabled)
```

- [ ] **Step 3: подключить limiter в main.py**

В `backend/app/main.py` добавить импорты:

```python
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .ratelimit import limiter
```

И после создания `app = FastAPI(...)`:

```python
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

- [ ] **Step 4: навесить лимиты на чувствительные ручки**

В `backend/app/routers/auth.py`:
(a) добавить импорт `from fastapi import APIRouter, Depends, HTTPException, Request, status` (добавить `Request`), и `from ..ratelimit import limiter`.
(b) на `register`, `login`, `google_auth`, `google_complete`, `link_google` — добавить декоратор `@limiter.limit("...")` СРАЗУ под `@router...` и первым параметром функции `request: Request`. Лимиты:
- `register`: `@limiter.limit("10/minute")`
- `login`: `@limiter.limit("20/minute")`
- `google_auth`: `@limiter.limit("20/minute")`
- `google_complete`: `@limiter.limit("10/minute")`
- `link_google`: `@limiter.limit("10/minute")`

Пример для `login`:

```python
@router.post("/login", response_model=TokenOut)
@limiter.limit("20/minute")
async def login(request: Request, data: LoginIn, db: AsyncSession = Depends(get_db)):
    ...
```

(остальное тело без изменений; `request` не используется внутри — он нужен slowapi).

- [ ] **Step 5: тесты зелёные (rate-limit отключён в conftest)**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q`
Expected: PASS всё (в тестах `RATE_LIMIT_ENABLED=false` → лимитер не срабатывает).

- [ ] **Step 6: Commit**

```bash
git add backend/requirements.txt backend/app/ratelimit.py backend/app/main.py backend/app/routers/auth.py
git commit -m "feat(security): rate-limit (slowapi) на auth-ручки, отключаемый в тестах"
```

---

## Task 9: Фронт — конфиг GOOGLE_CLIENT_ID (Nuxt)

**Files:** Modify `web/nuxt.config.ts`

- [ ] **Step 1: runtimeConfig.public.googleClientId**

В `web/nuxt.config.ts`, в объект `defineNuxtConfig({...})` добавить (рядом с `app`):

```ts
  runtimeConfig: {
    public: {
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    },
  },
```

- [ ] **Step 2: сборка проходит**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build`
Expected: `✔ built`.

- [ ] **Step 3: Commit**

```bash
git add web/nuxt.config.ts
git commit -m "feat(web): runtimeConfig.public.googleClientId"
```

---

## Task 10: Фронт — вход через Google (лендинг)

**Files:** Modify `web/pages/index.vue`

Примечание: GIS требует `GOOGLE_CLIENT_ID`. Пока его нет — кнопка Google просто не инициализируется (условие `if(!clientId) return;`), деградирует к текущему «скоро». Это не блокирует другие задачи.

- [ ] **Step 1: подключить GIS и обработать вход**

Сначала в `web/pages/index.vue`, в самом верху `<script setup>` (после существующих импортов, ДО `onMounted`), добавить строку получения client id из рантайм-конфига Nuxt (composable работает только в setup-scope):

```js
const googleClientId = useRuntimeConfig().public.googleClientId || ''
```

Затем в `onMounted(() => { ... })`, в блоке авторизации (рядом с обработчиком соц-кнопок `[data-soc]`), заменить заглушку google на реальный флоу. Вставить (используя уже существующие `AUTH_API`, `apiPost`, `saveSession`, `go`, `fail`, `ok`, и `googleClientId` из setup-scope):

```js
  const clientId = googleClientId;
  let pendingRegToken = '';

  function loadGis(){
    return new Promise((res)=>{
      if (window.google && window.google.accounts) return res();
      const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true; s.onload=()=>res(); document.head.appendChild(s);
    });
  }

  async function onGoogleCredential(resp){
    const { r, data } = await apiPost('/auth/google', { id_token: resp.credential });
    if (!r.ok){ fail('Не удалось войти через Google.'); return; }
    if (data.needs_username){ pendingRegToken = data.registration_token; showNickStep(); return; }
    saveSession(data); ok('Готово, входим…'); go();
  }

  async function initGoogle(){
    if(!clientId) return;  // нет client_id — Google-вход выключен
    await loadGis();
    window.google.accounts.id.initialize({ client_id: clientId, callback: onGoogleCredential });
    const holder = document.getElementById('googleBtnHolder');
    if (holder){ holder.innerHTML=''; window.google.accounts.id.renderButton(holder, { theme:'filled_black', size:'large', text:'continue_with', shape:'pill', width: 280 }); }
  }
  initGoogle();
```

- [ ] **Step 2: разметка — держатель кнопки Google + экран ника**

В `web/pages/index.vue`, в модалке авторизации, заменить существующую кастомную кнопку `<button data-soc="google">…</button>` на держатель:

```html
      <div id="googleBtnHolder"></div>
```

И добавить в модалку скрытый по умолчанию экран выбора ника (после блока соц-кнопок):

```html
      <div id="nickStep" style="display:none;margin-top:14px">
        <div class="auth-field"><label>Придумай ник</label>
          <input type="text" id="gNick" autocomplete="off" placeholder="Ник: латиница, цифры, _"></div>
        <div class="auth-msg" id="gNickMsg"></div>
        <button type="button" class="btn btn-solid auth-submit" id="gNickSubmit">Продолжить</button>
      </div>
```

- [ ] **Step 3: логика экрана ника**

В том же `onMounted`, после `initGoogle();`, добавить:

```js
  function showNickStep(){ const n=document.getElementById('nickStep'); if(n) n.style.display='block'; const g=document.getElementById('gNick'); if(g) g.focus(); }
  const gSubmit=document.getElementById('gNickSubmit');
  if (gSubmit) gSubmit.addEventListener('click', async ()=>{
    const nick=(document.getElementById('gNick').value||'').trim();
    const msg=document.getElementById('gNickMsg');
    if(!/^[A-Za-z0-9_]{3,20}$/.test(nick)){ if(msg) msg.textContent='Ник: 3–20 символов, латиница, цифры, _'; return; }
    const { r, data } = await apiPost('/auth/google/complete', { registration_token: pendingRegToken, username: nick });
    if (r.ok){ saveSession(data); go(); }
    else if (msg) msg.textContent = r.status===409 ? 'Ник занят' : 'Проверь ник';
  });
```

- [ ] **Step 4: сборка**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build`
Expected: `✔ built`.

- [ ] **Step 5: Commit**

```bash
git add web/pages/index.vue
git commit -m "feat(web): вход через Google (GIS) + экран выбора ника"
```

---

## Task 11: Фронт — привязка/отвязка Google в профиле

**Files:** Modify `web/pages/app.vue`

- [ ] **Step 1: сделать строку Google действием + GIS для привязки**

В `web/pages/app.vue`:
(a0) в самом верху `<script setup>` (после импортов, до `onMounted`) добавить:

```js
const googleClientId = useRuntimeConfig().public.googleClientId || ''
```

(это значение используется в обработчике ниже; composable работает только в setup-scope).

(a) в разметке профиля заменить строку Google на кликабельную (добавить `data-act="google"`):

```html
          <div class="setrow" data-act="google"><span class="l"><span class="g">G</span>Google</span><span class="chev" data-p="google">скоро</span></div>
```

(b) в `loadProfile()` (где выставляется `data-p="google"`), заменить текст на состояние: если `google` в providers → «привязан · отвязать», иначе → «привязать». Найти строку `if (gp) gp.textContent = ...` и заменить на:

```js
    if (gp) gp.textContent = data.providers.includes('google') ? 'привязан · отвязать' : 'привязать';
```

(c) в делегированном обработчике `[data-act]` добавить ветку `google`:

```js
      if (act === 'google') {
        const u = window.__fabulaUser || {};
        if ((u.providers||[]).includes('google')) {
          const { res } = await apiAuth('/auth/link/google', 'DELETE');
          if (res.status === 400) toast('Сначала добавь пароль'); else if (res.ok) { toast('Google отвязан'); loadProfile(); }
          return;
        }
        const clientId = googleClientId;
        if (!clientId) { toast('Google-вход скоро'); return; }
        await new Promise((res)=>{ if(window.google&&window.google.accounts) return res(); const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true; s.onload=()=>res(); document.head.appendChild(s); });
        window.google.accounts.id.initialize({ client_id: clientId, callback: async (resp)=>{
          const { res } = await apiAuth('/auth/link/google', 'POST', { id_token: resp.credential });
          if (res.status === 409) toast('Этот Google уже привязан к другому'); else if (res.ok) { toast('Google привязан'); loadProfile(); }
        }});
        window.google.accounts.id.prompt();
        return;
      }
```

- [ ] **Step 2: сборка**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build`
Expected: `✔ built`.

- [ ] **Step 3: полный регресс бэкенда**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q`
Expected: PASS всё.

- [ ] **Step 4: Commit**

```bash
git add web/pages/app.vue
git commit -m "feat(web): привязка/отвязка Google в профиле"
```

---

## Task 12: Деплой (ГЕЙТ — нужен GOOGLE_CLIENT_ID от пользователя)

**Files:** нет — операционная задача. НЕ выполнять, пока пользователь не создал Google OAuth-клиент и не дал `GOOGLE_CLIENT_ID`.

- [ ] **Step 1: пользователь создаёт OAuth-клиент**

В Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → Web application. Authorized JavaScript origins: `https://dungeon20-km8sy7.saturn.ac`, `http://localhost:3000`, `http://localhost:8090`. Redirect URI не нужен. Скопировать Client ID.

- [ ] **Step 2: задать переменные**

- Бэкенд (Saturn → backend → Variables): `GOOGLE_CLIENT_ID=<client_id>`.
- Web (Saturn → web → Variables): `NUXT_PUBLIC_GOOGLE_CLIENT_ID=<client_id>` (тот же id; попадёт в рантайм-конфиг Nuxt при сборке).

- [ ] **Step 3: мерж в main + деплой**

Слить ветку Фазы 3 в `main`, запушить (Saturn авто-деплой применит миграцию 0003 при старте бэка). Проверить: кнопка Google на лендинге появляется, вход/регистрация нового (экран ника), авто-связывание, привязка/отвязка в профиле.

---

## Проверка плана против спеки

- Модель `oauth_accounts` (unique provider+sub, cascade) — Task 1, миграция Task 7.
- google-auth + внедряемая проверялка (aud=client_id, тестовый фейк) — Task 3, conftest Task 4.
- `POST /auth/google` (вход/авто-связывание verified/registration_token) — Task 5.
- `POST /auth/google/complete` (создание с ником, IntegrityError→409) — Task 5.
- `link`/`unlink` (угон→409, локаут→400) — Task 6.
- `registration_token` purpose, не как access — Task 2, тест в Task 5.
- `/auth/me` providers включает google — Task 5 (async `_providers`).
- Rate-limit slowapi на auth-ручки, отключаемый в тестах — Task 8.
- Тесты (все кейсы из спеки) — Task 5/6.
- Конфиг GOOGLE_CLIENT_ID (бэк settings + Nuxt public) — Task 1, Task 9.
- Фронт: GIS-кнопка + экран ника + профиль link/unlink — Task 10, Task 11.
- Безопасность (не логируем токены — в коде нет логирования токенов; aud/iss/exp — в RealGoogleVerifier; транзакции — Task 5) — соблюдено.
- Деплой гейтится до GOOGLE_CLIENT_ID — Task 12.
