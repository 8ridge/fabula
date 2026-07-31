# Phase 5 — Telegram Login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Telegram login/registration (web Login Widget popup) + account linking, mirroring the existing Google OAuth flow, plus an experimental Mini App entry.

**Architecture:** Reuse the `oauth_accounts` table with `provider='telegram'`. Verify the Telegram widget/Mini App signature on the backend via an injectable `TelegramVerifier` (HMAC-SHA256 with the bot token). New Telegram-only users have `email=NULL` (requires making `users.email` nullable). Frontend uses `Telegram.Login.auth({bot_id})` and reuses the Google "pick a nickname" screen.

**Tech Stack:** FastAPI, SQLAlchemy (async), Alembic, pytest + SQLite, Nuxt 3 (Vue), self-hosted vanilla JS in `.vue` pages.

**Reference spec:** `docs/superpowers/specs/2026-07-31-phase5-telegram-design.md`

**Conventions (from the codebase):**
- Backend commands run from `backend/`. Tests: `pytest -q`.
- Injectable verifier pattern: see `backend/app/google_auth.py` + `backend/tests/conftest.py` (`app.dependency_overrides`).
- Migrations use `op.batch_alter_table` (portable SQLite/Postgres) — see `backend/alembic/versions/0002_profile_columns.py`.
- All secrets stay in `backend/.env` (gitignored); `.env.example` gets placeholders only. **Never commit the real bot token.**

---

## Task 1: Backend config — Telegram settings

**Files:**
- Modify: `backend/app/config.py`
- Modify: `backend/.env.example`

- [ ] **Step 1: Add settings fields**

In `backend/app/config.py`, inside `class Settings`, after `google_client_id: str = ""`:

```python
    google_client_id: str = ""
    telegram_bot_token: str = ""
    telegram_auth_ttl: int = 86400  # макс. возраст auth_date, сек (антиреплей)
    telegram_miniapp_enabled: bool = False
    rate_limit_enabled: bool = True
```

- [ ] **Step 2: Add placeholders to `.env.example`**

Append to `backend/.env.example`:

```
# Telegram-вход (Фаза 5). Токен бота от @BotFather — СЕКРЕТ, не коммитить реальное значение.
TELEGRAM_BOT_TOKEN=123456:PLACEHOLDER_CHANGE_ME
TELEGRAM_AUTH_TTL=86400
TELEGRAM_MINIAPP_ENABLED=false
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/config.py backend/.env.example
git commit -m "feat(phase5): telegram settings (bot token, auth ttl, miniapp flag)"
```

---

## Task 2: Backend — `users.email` nullable (migration 0006 + model + schema)

**Files:**
- Create: `backend/alembic/versions/0006_email_nullable.py`
- Modify: `backend/app/models.py:23`
- Modify: `backend/app/schemas.py:32`
- Test: `backend/tests/test_telegram.py` (new; first test)

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_telegram.py`:

```python
from tests.conftest import auth_headers


def test_email_can_be_null_on_user_out(client):
    # регистрируем через Telegram-заглушку и проверяем, что email=None не ломает /auth/me
    from tests.conftest import telegram_widget
    data = telegram_widget("tg_null1")
    rt = client.post("/auth/telegram", json=data).json()["registration_token"]
    r = client.post("/auth/telegram/complete", json={"registration_token": rt, "username": "tgnullone"})
    assert r.status_code == 200, r.text
    me = client.get("/auth/me", headers=auth_headers(r.json()["access_token"])).json()
    assert me["email"] is None
    assert me["providers"] == ["telegram"]
```

(This test also depends on Tasks 3–6; it will pass once those land. For now it drives the schema/model change and will fail on the missing route — that's expected until Task 6.)

- [ ] **Step 2: Make `User.email` nullable**

In `backend/app/models.py`, line 23, change:

```python
    email: Mapped[str | None] = mapped_column(String(320), unique=True, index=True, nullable=True)
```

- [ ] **Step 3: Make `UserOut.email` optional**

In `backend/app/schemas.py`, line 32, change:

```python
    email: EmailStr | None = None
```

- [ ] **Step 4: Write migration 0006**

Create `backend/alembic/versions/0006_email_nullable.py`:

```python
"""email nullable (Telegram-аккаунты без почты)

Revision ID: 0006
Revises: 0005
"""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.alter_column("email", existing_type=sa.String(320), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.alter_column("email", existing_type=sa.String(320), nullable=False)
```

- [ ] **Step 5: Verify migration applies on a clean SQLite DB**

Run from `backend/`:

```bash
rm -f _mig_check.db
DATABASE_URL="sqlite+aiosqlite:///./_mig_check.db" python -c "import asyncio; from app.database import init_db; asyncio.run(init_db())"
DATABASE_URL="sqlite:///./_mig_check.db" alembic upgrade head && rm -f _mig_check.db
```

Expected: `alembic upgrade head` runs to `0006` with no error. (If `init_db` already creates tables, the alembic step is a no-op stamp check — the goal is no exceptions.)

- [ ] **Step 6: Commit**

```bash
git add backend/app/models.py backend/app/schemas.py backend/alembic/versions/0006_email_nullable.py backend/tests/test_telegram.py
git commit -m "feat(phase5): users.email nullable + UserOut.email optional (migration 0006)"
```

---

## Task 3: Backend — `telegram_auth.py` (injectable HMAC verifier) + unit tests

**Files:**
- Create: `backend/app/telegram_auth.py`
- Test: `backend/tests/test_telegram_auth.py` (new — pure crypto unit tests, no HTTP)

- [ ] **Step 1: Write the failing unit tests**

Create `backend/tests/test_telegram_auth.py`:

```python
import hashlib
import hmac
import time

import pytest

from app.telegram_auth import RealTelegramVerifier

BOT_TOKEN = "123456:TESTABCDEF"


def _sign_widget(data: dict, token: str = BOT_TOKEN) -> dict:
    d = {k: v for k, v in data.items() if k != "hash"}
    dcs = "\n".join(f"{k}={d[k]}" for k in sorted(d))
    secret = hashlib.sha256(token.encode()).digest()
    d["hash"] = hmac.new(secret, dcs.encode(), hashlib.sha256).hexdigest()
    return d


def test_widget_valid_signature():
    v = RealTelegramVerifier(BOT_TOKEN, ttl=86400)
    payload = _sign_widget({"id": 555, "username": "neo", "auth_date": int(time.time())})
    out = v.verify_widget(payload)
    assert out == {"tg_id": "555", "tg_username": "neo"}


def test_widget_tampered_hash_rejected():
    v = RealTelegramVerifier(BOT_TOKEN, ttl=86400)
    payload = _sign_widget({"id": 555, "auth_date": int(time.time())})
    payload["hash"] = "deadbeef"
    with pytest.raises(ValueError):
        v.verify_widget(payload)


def test_widget_stale_auth_date_rejected():
    v = RealTelegramVerifier(BOT_TOKEN, ttl=3600)
    payload = _sign_widget({"id": 555, "auth_date": int(time.time()) - 7200})
    with pytest.raises(ValueError):
        v.verify_widget(payload)


def test_widget_missing_hash_rejected():
    v = RealTelegramVerifier(BOT_TOKEN, ttl=86400)
    with pytest.raises(ValueError):
        v.verify_widget({"id": 555, "auth_date": int(time.time())})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && pytest tests/test_telegram_auth.py -q`
Expected: FAIL (ModuleNotFoundError: app.telegram_auth).

- [ ] **Step 3: Implement `telegram_auth.py`**

Create `backend/app/telegram_auth.py`:

```python
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd backend && pytest tests/test_telegram_auth.py -q`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/app/telegram_auth.py backend/tests/test_telegram_auth.py
git commit -m "feat(phase5): telegram signature verifier (widget + miniapp HMAC) + unit tests"
```

---

## Task 4: Backend — Telegram registration token (security.py)

**Files:**
- Modify: `backend/app/security.py` (append functions)
- Test: `backend/tests/test_telegram_auth.py` (append)

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_telegram_auth.py`:

```python
def test_telegram_registration_token_roundtrip():
    from app.security import (
        create_telegram_registration_token,
        decode_telegram_registration_token,
        decode_registration_token,
    )
    t = create_telegram_registration_token("777", "neo")
    assert decode_telegram_registration_token(t) == {"tg_id": "777", "tg_username": "neo"}
    # google-декодер НЕ принимает telegram-токен (разный purpose)
    assert decode_registration_token(t) is None
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && pytest tests/test_telegram_auth.py::test_telegram_registration_token_roundtrip -q`
Expected: FAIL (ImportError).

- [ ] **Step 3: Implement the functions**

Append to `backend/app/security.py`:

```python
def create_telegram_registration_token(tg_id: str, tg_username: str | None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "purpose": "telegram_register",
        "tg_id": tg_id,
        "tg_username": tg_username,
        "iat": now,
        "exp": now + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_telegram_registration_token(token: str) -> dict | None:
    """{'tg_id','tg_username'} из валидного telegram-токена регистрации или None."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        if payload.get("purpose") != "telegram_register":
            return None
        return {"tg_id": payload["tg_id"], "tg_username": payload.get("tg_username")}
    except (jwt.PyJWTError, KeyError):
        return None
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd backend && pytest tests/test_telegram_auth.py::test_telegram_registration_token_roundtrip -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/security.py backend/tests/test_telegram_auth.py
git commit -m "feat(phase5): telegram registration token (create/decode, purpose telegram_register)"
```

---

## Task 5: Backend — schemas for Telegram

**Files:**
- Modify: `backend/app/schemas.py` (append)

- [ ] **Step 1: Add schemas**

Append to `backend/app/schemas.py`:

```python
class TelegramWidgetIn(BaseModel):
    # Поля виджета Telegram; id/auth_date/hash обязательны, прочее (first_name,
    # username, photo_url, last_name) допускаем и учитываем при проверке подписи.
    model_config = {"extra": "allow"}
    id: int
    auth_date: int
    hash: str


class TelegramCompleteIn(BaseModel):
    registration_token: str
    username: str = Field(pattern=USERNAME_PATTERN)


class TelegramMiniAppIn(BaseModel):
    init_data: str


class TelegramAuthOut(BaseModel):
    access_token: str | None = None
    token_type: str | None = None
    user: UserOut | None = None
    needs_username: bool = False
    registration_token: str | None = None
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas.py
git commit -m "feat(phase5): telegram request/response schemas"
```

---

## Task 6: Backend — `/auth/telegram` + `/auth/telegram/complete` + providers + test fixtures

**Files:**
- Modify: `backend/app/routers/auth.py` (imports, `_providers`, new routes)
- Modify: `backend/tests/conftest.py` (fake verifier + helper)
- Test: `backend/tests/test_telegram.py` (append)

- [ ] **Step 1: Wire the fake verifier + helper into conftest**

In `backend/tests/conftest.py`, inside the `client` fixture (after the Google override block, before `with TestClient(app) as c:`), add:

```python
    from app.telegram_auth import get_telegram_verifier

    class _FakeTelegramVerifier:
        def verify_widget(self, data: dict) -> dict:
            if data.get("hash") == "BAD":
                raise ValueError("bad token")
            return {"tg_id": str(data["id"]), "tg_username": data.get("username")}

        def verify_miniapp(self, init_data: str) -> dict:
            if init_data == "BAD":
                raise ValueError("bad init_data")
            import json
            d = json.loads(init_data)
            return {"tg_id": str(d["id"]), "tg_username": d.get("username")}

    app.dependency_overrides[get_telegram_verifier] = lambda: _FakeTelegramVerifier()
```

Append at the end of `backend/tests/conftest.py`:

```python
def telegram_widget(tg_id: str, username: str | None = None) -> dict:
    d = {"id": tg_id, "auth_date": 1, "hash": "ok"}
    if username:
        d["username"] = username
    return d


def telegram_miniapp(tg_id: str, username: str | None = None) -> str:
    import json
    return json.dumps({"id": tg_id, "username": username})
```

- [ ] **Step 2: Write the failing tests**

Append to `backend/tests/test_telegram.py`:

```python
from tests.conftest import auth_headers, telegram_widget, register


def test_telegram_new_user_needs_username(client):
    r = client.post("/auth/telegram", json=telegram_widget("tg_new1", "neo"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["needs_username"] is True
    assert body["registration_token"]
    assert body.get("access_token") is None


def test_telegram_complete_creates_user_and_returning_login(client):
    data = telegram_widget("tg_new2")
    rt = client.post("/auth/telegram", json=data).json()["registration_token"]
    r = client.post("/auth/telegram/complete", json={"registration_token": rt, "username": "tgnicktwo"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["providers"] == ["telegram"]
    assert body["user"]["email"] is None
    # повторный вход тем же tg_id -> сразу сессия
    r2 = client.post("/auth/telegram", json=data)
    assert r2.status_code == 200 and r2.json().get("access_token")


def test_telegram_bad_signature(client):
    bad = {"id": "x", "auth_date": 1, "hash": "BAD"}
    assert client.post("/auth/telegram", json=bad).status_code == 401


def test_telegram_complete_taken_username(client):
    rt1 = client.post("/auth/telegram", json=telegram_widget("tg_a")).json()["registration_token"]
    client.post("/auth/telegram/complete", json={"registration_token": rt1, "username": "dupnick"})
    rt2 = client.post("/auth/telegram", json=telegram_widget("tg_b")).json()["registration_token"]
    r = client.post("/auth/telegram/complete", json={"registration_token": rt2, "username": "dupnick"})
    assert r.status_code == 409


def test_telegram_complete_bad_token(client):
    r = client.post("/auth/telegram/complete", json={"registration_token": "nope", "username": "somenick"})
    assert r.status_code == 401


def test_telegram_registration_token_not_access(client):
    rt = client.post("/auth/telegram", json=telegram_widget("tg_c")).json()["registration_token"]
    assert client.get("/auth/me", headers=auth_headers(rt)).status_code == 401
```

- [ ] **Step 3: Run to verify they fail**

Run: `cd backend && pytest tests/test_telegram.py -q`
Expected: FAIL (404 on `/auth/telegram`).

- [ ] **Step 4: Update imports + `_providers` in `auth.py`**

In `backend/app/routers/auth.py`, extend the imports:

```python
from ..google_auth import GoogleVerifier, get_google_verifier
from ..telegram_auth import TelegramVerifier, get_telegram_verifier
```

Add to the `..schemas` import list: `TelegramWidgetIn, TelegramCompleteIn, TelegramMiniAppIn, TelegramAuthOut`.

Add to the `..security` import list: `create_telegram_registration_token, decode_telegram_registration_token`.

Replace `_providers` (lines 60-71) so Telegram is included:

```python
async def _providers(db: AsyncSession, user: User) -> list[str]:
    p = []
    if user.password_hash is not None:
        p.append("email")
    res = await db.execute(
        select(OAuthAccount.provider).where(OAuthAccount.user_id == user.id)
    )
    have = {row[0] for row in res.all()}
    for prov in ("google", "telegram"):
        if prov in have:
            p.append(prov)
    return p
```

- [ ] **Step 5: Add the routes**

In `backend/app/routers/auth.py`, after `unlink_google` (line ~334), add:

```python
@router.post("/telegram", response_model=TelegramAuthOut)
@limiter.limit("20/minute")
async def telegram_auth(
    request: Request,
    data: TelegramWidgetIn,
    verifier: TelegramVerifier = Depends(get_telegram_verifier),
    db: AsyncSession = Depends(get_db),
):
    try:
        info = verifier.verify_widget(data.model_dump())
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Недействительные данные Telegram")
    tg_id, tg_username = info["tg_id"], info.get("tg_username")

    acc = (
        await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == "telegram", OAuthAccount.provider_user_id == tg_id
            )
        )
    ).scalar_one_or_none()
    if acc:
        user = await db.get(User, acc.user_id)
        token = await _issue_session(db, user, request)
        await db.commit()
        return TelegramAuthOut(access_token=token, token_type="bearer", user=await _user_out(db, user))

    return TelegramAuthOut(
        needs_username=True,
        registration_token=create_telegram_registration_token(tg_id, tg_username),
    )


@router.post("/telegram/complete", response_model=TokenOut)
@limiter.limit("10/minute")
async def telegram_complete(request: Request, data: TelegramCompleteIn, db: AsyncSession = Depends(get_db)):
    payload = decode_telegram_registration_token(data.registration_token)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Ссылка регистрации недействительна")
    tg_id = payload["tg_id"]
    if await _username_taken(db, data.username):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ник занят")
    user = User(email=None, username=data.username, password_hash=None, email_verified=False)
    db.add(user)
    try:
        await db.flush()
        db.add(OAuthAccount(user_id=user.id, provider="telegram", provider_user_id=tg_id))
        await db.commit()
    except IntegrityError:
        await db.rollback()
        # гонка: tg_id уже создан — логиним существующего
        acc = (
            await db.execute(
                select(OAuthAccount).where(
                    OAuthAccount.provider == "telegram", OAuthAccount.provider_user_id == tg_id
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
```

- [ ] **Step 6: Run to verify tests pass**

Run: `cd backend && pytest tests/test_telegram.py -q`
Expected: PASS (all tests in the file, including `test_email_can_be_null_on_user_out` from Task 2).

- [ ] **Step 7: Run the full backend suite (no regressions)**

Run: `cd backend && pytest -q`
Expected: PASS (Google/profile/session tests still green).

- [ ] **Step 8: Commit**

```bash
git add backend/app/routers/auth.py backend/tests/conftest.py backend/tests/test_telegram.py
git commit -m "feat(phase5): /auth/telegram + /auth/telegram/complete + providers includes telegram"
```

---

## Task 7: Backend — link / unlink Telegram

**Files:**
- Modify: `backend/app/routers/auth.py` (add two routes)
- Test: `backend/tests/test_telegram.py` (append)

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/test_telegram.py`:

```python
def test_link_and_unlink_telegram(client, creds):
    data = register(client, creds)  # email+пароль аккаунт
    h = auth_headers(data["access_token"])
    assert client.post("/auth/link/telegram", json=telegram_widget("tg_link_me"), headers=h).status_code == 204
    assert set(client.get("/auth/me", headers=h).json()["providers"]) == {"email", "telegram"}
    # пароль есть -> отвязка ок
    assert client.delete("/auth/link/telegram", headers=h).status_code == 204
    assert client.get("/auth/me", headers=h).json()["providers"] == ["email"]


def test_link_telegram_already_on_other_account(client, creds):
    a = register(client, creds)
    rt = client.post("/auth/telegram", json=telegram_widget("tg_shared")).json()["registration_token"]
    client.post("/auth/telegram/complete", json={"registration_token": rt, "username": "tgsharednick"})
    r = client.post("/auth/link/telegram", json=telegram_widget("tg_shared"), headers=auth_headers(a["access_token"]))
    assert r.status_code == 409


def test_unlink_telegram_only_login_blocked(client):
    rt = client.post("/auth/telegram", json=telegram_widget("tg_only")).json()["registration_token"]
    data = client.post("/auth/telegram/complete", json={"registration_token": rt, "username": "tgonlynick"}).json()
    r = client.delete("/auth/link/telegram", headers=auth_headers(data["access_token"]))
    assert r.status_code == 400
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && pytest tests/test_telegram.py -k "link" -q`
Expected: FAIL (404 on `/auth/link/telegram`).

- [ ] **Step 3: Add the routes**

In `backend/app/routers/auth.py`, after `telegram_complete`, add:

```python
@router.post("/link/telegram", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def link_telegram(
    request: Request,
    data: TelegramWidgetIn,
    user: User = Depends(get_current_user),
    verifier: TelegramVerifier = Depends(get_telegram_verifier),
    db: AsyncSession = Depends(get_db),
):
    try:
        info = verifier.verify_widget(data.model_dump())
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Недействительные данные Telegram")
    tg_id = info["tg_id"]
    existing = (
        await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == "telegram", OAuthAccount.provider_user_id == tg_id
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        if existing.user_id != user.id:
            raise HTTPException(status.HTTP_409_CONFLICT, "Этот Telegram уже привязан к другому аккаунту")
        return  # идемпотентно
    db.add(OAuthAccount(user_id=user.id, provider="telegram", provider_user_id=tg_id))
    await db.commit()


@router.delete("/link/telegram", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_telegram(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    has_google = (
        await db.execute(
            select(OAuthAccount.id).where(
                OAuthAccount.user_id == user.id, OAuthAccount.provider == "google"
            )
        )
    ).first() is not None
    if user.password_hash is None and not has_google:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нужен другой способ входа (пароль или Google)")
    await db.execute(
        delete(OAuthAccount).where(
            OAuthAccount.user_id == user.id, OAuthAccount.provider == "telegram"
        )
    )
    await db.commit()
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd backend && pytest tests/test_telegram.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/auth.py backend/tests/test_telegram.py
git commit -m "feat(phase5): link/unlink telegram (409 on hijack, 400 on lockout)"
```

---

## Task 8: Backend — Mini App endpoint (behind flag)

**Files:**
- Modify: `backend/app/routers/auth.py` (add route)
- Test: `backend/tests/test_telegram.py` (append)

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/test_telegram.py`:

```python
from tests.conftest import telegram_miniapp


def test_telegram_miniapp_login(client, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "telegram_miniapp_enabled", True)
    r = client.post("/auth/telegram/miniapp", json={"init_data": telegram_miniapp("tg_mini1", "neo")})
    assert r.status_code == 200, r.text
    assert r.json()["needs_username"] is True


def test_telegram_miniapp_bad(client, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "telegram_miniapp_enabled", True)
    assert client.post("/auth/telegram/miniapp", json={"init_data": "BAD"}).status_code == 401


def test_telegram_miniapp_disabled_404(client, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "telegram_miniapp_enabled", False)
    assert client.post("/auth/telegram/miniapp", json={"init_data": telegram_miniapp("tg_mini2")}).status_code == 404
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && pytest tests/test_telegram.py -k miniapp -q`
Expected: FAIL (404 always — route missing).

- [ ] **Step 3: Add the route**

In `backend/app/routers/auth.py`, after `unlink_telegram`, add (imports `settings`):

```python
from ..config import settings  # add near top imports if not present


@router.post("/telegram/miniapp", response_model=TelegramAuthOut)
@limiter.limit("20/minute")
async def telegram_miniapp(
    request: Request,
    data: TelegramMiniAppIn,
    verifier: TelegramVerifier = Depends(get_telegram_verifier),
    db: AsyncSession = Depends(get_db),
):
    if not settings.telegram_miniapp_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    try:
        info = verifier.verify_miniapp(data.init_data)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Недействительный initData")
    tg_id, tg_username = info["tg_id"], info.get("tg_username")
    acc = (
        await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == "telegram", OAuthAccount.provider_user_id == tg_id
            )
        )
    ).scalar_one_or_none()
    if acc:
        user = await db.get(User, acc.user_id)
        token = await _issue_session(db, user, request)
        await db.commit()
        return TelegramAuthOut(access_token=token, token_type="bearer", user=await _user_out(db, user))
    return TelegramAuthOut(
        needs_username=True,
        registration_token=create_telegram_registration_token(tg_id, tg_username),
    )
```

- [ ] **Step 4: Run to verify they pass + full suite**

Run: `cd backend && pytest -q`
Expected: PASS (whole suite).

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/auth.py backend/tests/test_telegram.py
git commit -m "feat(phase5): /auth/telegram/miniapp (behind telegram_miniapp_enabled flag)"
```

---

## Task 9: Frontend — Nuxt runtime config (bot id)

**Files:**
- Modify: `web/nuxt.config.ts:runtimeConfig.public`

- [ ] **Step 1: Add `telegramBotId`**

In `web/nuxt.config.ts`, change the `public` block to:

```ts
    public: {
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      telegramBotId: process.env.NUXT_PUBLIC_TELEGRAM_BOT_ID || '',
    },
```

- [ ] **Step 2: Commit**

```bash
git add web/nuxt.config.ts
git commit -m "feat(phase5): expose telegramBotId in nuxt runtime config"
```

---

## Task 10: Frontend — Telegram login button + shared nick step (index.vue)

**Files:**
- Modify: `web/pages/index.vue` (script setup const ~line 333; login IIFE ~lines 903-948)

- [ ] **Step 1: Read the bot id from runtime config**

In `web/pages/index.vue`, near line 333 (`const googleClientId = ...`), add:

```js
const telegramBotId = useRuntimeConfig().public.telegramBotId || ''
```

- [ ] **Step 2: Generalize the nick step for both providers**

In the login IIFE, replace the single line `let pendingRegToken = '';` (≈line 910) with:

```js
  let pendingRegToken = '';
  let pendingProvider = 'google';  // какой провайдер инициировал экран ника
```

Change the Google callback (`onGoogleCredential`, ≈line 922) branch that shows the nick step to also set the provider:

```js
    if (data.needs_username){ pendingRegToken = data.registration_token; pendingProvider = 'google'; showNickStep(); return; }
```

Change the nick submit handler (`gSubmit`, ≈line 945) to pick the endpoint by provider:

```js
    const completeUrl = pendingProvider === 'telegram' ? '/auth/telegram/complete' : '/auth/google/complete';
    const { r, data } = await apiPost(completeUrl, { registration_token: pendingRegToken, username: nick });
```

- [ ] **Step 3: Replace the Telegram stub with the real popup login**

Replace the `[data-soc]` stub block (≈lines 903-906):

```js
  // соцвход — пока не подключён (Telegram появится на бэкенде)
  document.querySelectorAll('[data-soc]').forEach(b=>b.addEventListener('click',()=>{
    fail('Вход через '+(b.dataset.soc==='google'?'Google':'Telegram')+' скоро — подключаем на бэкенде.');
  }));
```

with:

```js
  // ===== вход через Telegram (Login Widget, popup-callback) =====
  function loadTgWidget(){
    return new Promise((res)=>{
      if (window.Telegram && window.Telegram.Login) return res();
      const s=document.createElement('script'); s.src='https://telegram.org/js/telegram-widget.js?22'; s.async=true; s.onload=()=>res(); document.head.appendChild(s);
    });
  }
  async function onTelegramAuth(user){
    if(!user){ fail('Вход через Telegram отменён'); return; }
    const { r, data } = await apiPost('/auth/telegram', user);
    if (!r.ok){ fail('Не удалось войти через Telegram.'); return; }
    if (data.needs_username){ pendingRegToken = data.registration_token; pendingProvider = 'telegram'; showNickStep(); return; }
    saveSession(data); markLoggedInNav(); ok('Готово! Открой «Профиль» или «Миры».'); close();
  }
  document.querySelectorAll('[data-soc="tg"]').forEach(b=>b.addEventListener('click', async ()=>{
    if(!telegramBotId){ fail('Вход через Telegram скоро'); return; }
    await loadTgWidget();
    window.Telegram.Login.auth({ bot_id: telegramBotId, request_access: 'write' }, onTelegramAuth);
  }));
```

- [ ] **Step 4: Build**

Run: `cd web && npm run build`
Expected: `Build complete!`, no errors.

- [ ] **Step 5: Commit**

```bash
git add web/pages/index.vue
git commit -m "feat(phase5): telegram login button + shared nick step on landing"
```

---

## Task 11: Frontend — Telegram row in profile (app.vue)

**Files:**
- Modify: `web/pages/app.vue` (markup ~line 117; script const ~line 270; loadProfile ~line 308; click handler ~line 437)

- [ ] **Step 1: Add the bot id const + markup row**

In `web/pages/app.vue`, near line 270 (`const googleClientId = ...`), add:

```js
const telegramBotId = useRuntimeConfig().public.telegramBotId || ''
```

After the Google row (line 117), add a Telegram row:

```html
            <div class="setrow" data-act="telegram"><span class="l"><span class="g">✈</span>Telegram</span><span class="chev" data-p="telegram">скоро</span></div>
```

- [ ] **Step 2: Reflect linked state in `loadProfile`**

After the Google reflect block (≈lines 308-309), add:

```js
    const tp = document.querySelector('[data-p="telegram"]');
    if (tp) tp.textContent = data.providers.includes('telegram') ? 'привязан · отвязать' : 'привязать';
```

- [ ] **Step 3: Add the click handler**

In the `data-act` click handler, after the `if (act === 'google') { ... }` block (≈line 454), add:

```js
      if (act === 'telegram') {
        const u = window.__fabulaUser || {};
        if ((u.providers||[]).includes('telegram')) {
          const { res } = await apiAuth('/auth/link/telegram', 'DELETE');
          if (res.status === 400) toast('Нужен другой способ входа'); else if (res.ok) { toast('Telegram отвязан'); loadProfile(); }
          return;
        }
        if (!telegramBotId) { toast('Вход через Telegram скоро'); return; }
        await new Promise((resolve)=>{ if(window.Telegram&&window.Telegram.Login) return resolve(); const s=document.createElement('script'); s.src='https://telegram.org/js/telegram-widget.js?22'; s.async=true; s.onload=()=>resolve(); document.head.appendChild(s); });
        window.Telegram.Login.auth({ bot_id: telegramBotId, request_access: 'write' }, async (user)=>{
          if(!user){ toast('Отменено'); return; }
          const { res } = await apiAuth('/auth/link/telegram','POST', user);
          if (res.status === 409) toast('Этот Telegram уже привязан к другому'); else if (res.ok) { toast('Telegram привязан'); loadProfile(); }
        });
        return;
      }
```

> `window.__fabulaUser` is exactly what the Google branch reads (`app.vue:438` — `const u = window.__fabulaUser || {}`), so this mirrors it.

- [ ] **Step 4: Build**

Run: `cd web && npm run build`
Expected: `Build complete!`, no errors.

- [ ] **Step 5: Commit**

```bash
git add web/pages/app.vue
git commit -m "feat(phase5): telegram row in profile (link/unlink)"
```

---

## Task 12: Config, deploy, manual verification

**Files:** none (ops)

- [ ] **Step 1: Set backend secret locally**

In `backend/.env` (gitignored), set the real token:

```
TELEGRAM_BOT_TOKEN=8806966365:<real-token-from-BotFather>
```

- [ ] **Step 2: Set Saturn env vars (prod)**

- Backend service: `TELEGRAM_BOT_TOKEN` = real token; optionally `TELEGRAM_AUTH_TTL`, `TELEGRAM_MINIAPP_ENABLED=false`.
- Web service: `NUXT_PUBLIC_TELEGRAM_BOT_ID=8806966365`.

- [ ] **Step 3: BotFather (when domain exists)**

- `/setdomain` → the prod web domain (required or the widget popup refuses to run).
- (Mini App experiment, later) set Web App URL / Menu Button.

- [ ] **Step 4: Run Alembic on prod (Saturn Postgres)**

Run migration `0006` against the prod DB (same procedure as prior phases’ deploy step).

- [ ] **Step 5: Deploy (auto on main)**

```bash
git checkout main && git merge --ff-only <feature-branch> && git push origin main
```

- [ ] **Step 6: Manual smoke (after domain + deploy)**

- Landing → «Продолжить с Telegram» → Telegram popup → new account → nick screen → lands in `/app`, profile shows Telegram linked, email empty.
- Returning login with same Telegram → straight into `/app`.
- Existing email account → profile → Telegram «привязать» → linked; «отвязать» works (password present).
- `git grep -i "$TELEGRAM_BOT_TOKEN"` returns nothing (token never committed).

---

## Self-review notes

- **Spec coverage:** verifier (Task 3), migration email-nullable (Task 2), `/auth/telegram` + `/complete` (Task 6), link/unlink with lockout rule (Task 7), miniapp behind flag (Task 8), providers+telegram (Task 6), rate-limit (`@limiter.limit` on every new route), config/secret handling (Tasks 1, 12), frontend button + nick reuse + profile row (Tasks 10-11). "Attach email" is intentionally out of scope per spec.
- **Type consistency:** verifier returns `{'tg_id','tg_username'}` everywhere; registration token carries `tg_id`/`tg_username`; `provider_user_id` is always the string `tg_id`. `UserOut.email` is `EmailStr | None`.
- **Known follow-up (out of scope):** `unlink_google` still checks only `password_hash` (a google-only account that also has telegram cannot unlink google). Symmetric refactor optional; not required for this phase.
