# Phase 6 — Discord Login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Discord OAuth2 login/registration + account linking, mirroring the Google flow (email auto-link) and Telegram flow (needs-username registration), dormant until domain + credentials exist.

**Architecture:** Discord uses OAuth2 authorization-code: frontend redirects to Discord, Discord redirects back with `code`, backend exchanges `code`+`client_secret` for a token and fetches `/users/@me`. Reuse `oauth_accounts` (provider='discord'). The exchanger is an injectable dependency (`discord_auth.py`) faked in tests. No new tables/migrations.

**Tech Stack:** FastAPI, SQLAlchemy async, pytest+SQLite, Nuxt 3 (vanilla JS in `.vue`), `requests` (already present via google-auth) for Discord HTTP.

**Reference spec:** `docs/superpowers/specs/2026-07-31-phase6-discord-design.md`
**Pattern references (read these — Phase 3/5 already in `main`/branch):** `backend/app/google_auth.py`, `backend/app/routers/auth.py` (google routes + `_providers` + `_user_out` + `_issue_session`), `backend/app/security.py`, `backend/app/schemas.py`, `backend/tests/conftest.py`, `backend/tests/test_google.py`.

**Conventions:** Backend cmds from `backend/`. Tests: `./.venv/Scripts/python.exe -m pytest -q` (venv interpreter; global python lacks deps). Web build: from `web/`, `export PATH="/c/Program Files/nodejs:$PATH" && npm run build`. Branch `feature/phase6-discord`. **DO NOT push.** Never write real secrets — `.env.example` gets placeholders.

---

## Task 1: Backend config — Discord settings

**Files:** Modify `backend/app/config.py`; Modify `backend/.env.example`

- [ ] **Step 1: Add settings**

In `backend/app/config.py`, inside `class Settings`, after the telegram settings (or after `google_client_id`):

```python
    discord_client_id: str = ""
    discord_client_secret: str = ""
    discord_redirect_uris: str = ""  # через запятую; allowlist для redirect_uri

    @property
    def discord_redirect_list(self) -> list[str]:
        return [u.strip() for u in self.discord_redirect_uris.split(",") if u.strip()]
```

(Place the `@property` alongside the existing `cors_list` property, not inside another method.)

- [ ] **Step 2: `.env.example`**

Append to `backend/.env.example`:

```
# Discord-вход (Фаза 6). Secret — из Discord Dev Portal, НЕ коммитить реальное значение.
DISCORD_CLIENT_ID=000000000000000000
DISCORD_CLIENT_SECRET=PLACEHOLDER_CHANGE_ME
DISCORD_REDIRECT_URIS=http://localhost:3000/app
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/config.py backend/.env.example
git commit -m "feat(phase6): discord settings (client id/secret, redirect allowlist)"
```

---

## Task 2: Backend — `discord_auth.py` (injectable code exchanger)

**Files:** Create `backend/app/discord_auth.py`

- [ ] **Step 1: Implement**

Create `backend/app/discord_auth.py`:

```python
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
        tok.raise_for_status()
        access = tok.json()["access_token"]
        me = requests.get(_ME_URL, headers={"Authorization": f"Bearer {access}"}, timeout=10)
        me.raise_for_status()
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
```

> Note: like `google_auth.py`, the real exchanger does blocking HTTP inside the async route (matches the existing codebase pattern). It has no dedicated unit test — it is exercised through the fake verifier in integration tests (Task 5) and verified live on prod (out of scope until domain). This mirrors how `google_auth.py` is tested.

- [ ] **Step 2: Commit**

```bash
git add backend/app/discord_auth.py
git commit -m "feat(phase6): discord code exchanger (injectable, requests-based)"
```

---

## Task 3: Backend — Discord registration token

**Files:** Modify `backend/app/security.py`; Test `backend/tests/test_discord.py` (new)

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_discord.py`:

```python
def test_discord_registration_token_roundtrip():
    from app.security import (
        create_discord_registration_token,
        decode_discord_registration_token,
        decode_registration_token,
    )
    t = create_discord_registration_token("42", "d@t.io", "neo")
    assert decode_discord_registration_token(t) == {"discord_id": "42", "email": "d@t.io", "username": "neo"}
    assert decode_registration_token(t) is None  # google-декодер не принимает discord-токен
```

- [ ] **Step 2: Run — fails**

Run: `cd backend && ./.venv/Scripts/python.exe -m pytest tests/test_discord.py::test_discord_registration_token_roundtrip -q`
Expected: FAIL (ImportError).

- [ ] **Step 3: Implement**

Append to `backend/app/security.py`:

```python
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
```

- [ ] **Step 4: Run — passes**

Run: `cd backend && ./.venv/Scripts/python.exe -m pytest tests/test_discord.py::test_discord_registration_token_roundtrip -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/security.py backend/tests/test_discord.py
git commit -m "feat(phase6): discord registration token (create/decode)"
```

---

## Task 4: Backend — Discord schemas

**Files:** Modify `backend/app/schemas.py`

- [ ] **Step 1: Add schemas**

Append to `backend/app/schemas.py`:

```python
class DiscordIn(BaseModel):
    code: str
    redirect_uri: str


class DiscordCompleteIn(BaseModel):
    registration_token: str
    username: str = Field(pattern=USERNAME_PATTERN)


class DiscordAuthOut(BaseModel):
    access_token: str | None = None
    token_type: str | None = None
    user: UserOut | None = None
    needs_username: bool = False
    registration_token: str | None = None
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas.py
git commit -m "feat(phase6): discord request/response schemas"
```

---

## Task 5: Backend — `/auth/discord` + `/complete` + providers + fixtures + tests

**Files:** Modify `backend/app/routers/auth.py`; Modify `backend/tests/conftest.py`; Test `backend/tests/test_discord.py` (append)

- [ ] **Step 1: conftest — fake verifier**

In `backend/tests/conftest.py`, inside the `client` fixture (after the telegram override block), add:

```python
    from app.discord_auth import get_discord_verifier

    class _FakeDiscordVerifier:
        def exchange(self, code: str, redirect_uri: str) -> dict:
            if code == "BAD":
                raise ValueError("bad code")
            import json
            d = json.loads(code)  # тест кодирует данные прямо в "code"
            return {
                "discord_id": str(d["discord_id"]),
                "email": (d.get("email") or "").lower() or None,
                "email_verified": bool(d.get("email_verified", True)) and bool(d.get("email")),
                "username": d.get("username"),
            }

    app.dependency_overrides[get_discord_verifier] = lambda: _FakeDiscordVerifier()
```

Append helper at end of `conftest.py`:

```python
def discord_code(discord_id, email=None, email_verified=True, username=None):
    import json
    return json.dumps({"discord_id": discord_id, "email": email, "email_verified": email_verified, "username": username})
```

- [ ] **Step 2: Write the failing tests**

Append to `backend/tests/test_discord.py`:

```python
from tests.conftest import auth_headers, discord_code, register


def test_discord_new_user_needs_username(client):
    r = client.post("/auth/discord", json={"code": discord_code("d_new1", "dn1@t.io", username="neo"), "redirect_uri": "http://localhost:3000/app"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["needs_username"] is True and body["registration_token"]
    assert body.get("access_token") is None


def test_discord_complete_and_returning(client):
    code = discord_code("d_new2", "dn2@t.io")
    rt = client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    r = client.post("/auth/discord/complete", json={"registration_token": rt, "username": "dnicktwo"})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["providers"] == ["discord"]
    r2 = client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"})
    assert r2.status_code == 200 and r2.json().get("access_token")


def test_discord_autolink_verified_email(client, creds):
    register(client, creds)
    code = discord_code("d_link1", creds["email"], email_verified=True)
    r = client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"})
    assert r.status_code == 200 and r.json().get("access_token"), r.text
    me = client.get("/auth/me", headers=auth_headers(r.json()["access_token"])).json()
    assert set(me["providers"]) == {"email", "discord"}


def test_discord_unverified_email_existing_rejected(client, creds):
    register(client, creds)
    code = discord_code("d_link2", creds["email"], email_verified=False)
    assert client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"}).status_code == 400


def test_discord_bad_code(client):
    assert client.post("/auth/discord", json={"code": "BAD", "redirect_uri": "http://localhost:3000/app"}).status_code == 401


def test_discord_bad_redirect_rejected(client):
    r = client.post("/auth/discord", json={"code": discord_code("d_x", "dx@t.io"), "redirect_uri": "http://evil.example/app"})
    assert r.status_code == 400


def test_discord_complete_taken_username(client):
    rt1 = client.post("/auth/discord", json={"code": discord_code("d_a", "da@t.io"), "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    client.post("/auth/discord/complete", json={"registration_token": rt1, "username": "ddupnick"})
    rt2 = client.post("/auth/discord", json={"code": discord_code("d_b", "db@t.io"), "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    assert client.post("/auth/discord/complete", json={"registration_token": rt2, "username": "ddupnick"}).status_code == 409


def test_discord_registration_token_not_access(client):
    rt = client.post("/auth/discord", json={"code": discord_code("d_c", "dc@t.io"), "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    assert client.get("/auth/me", headers=auth_headers(rt)).status_code == 401
```

> `RATE_LIMIT_ENABLED=false` and `DISCORD_REDIRECT_URIS` for tests: conftest sets test env. Add `os.environ["DISCORD_REDIRECT_URIS"] = "http://localhost:3000/app"` near the other `os.environ` lines at the top of `conftest.py` so the redirect allowlist passes in tests.

- [ ] **Step 3: Run — fail** (`cd backend && ./.venv/Scripts/python.exe -m pytest tests/test_discord.py -q`) → 404s.

- [ ] **Step 4: Imports + `_providers`**

In `backend/app/routers/auth.py`, add imports:

```python
from ..discord_auth import DiscordVerifier, get_discord_verifier
```
Add to `..schemas` import: `DiscordIn, DiscordCompleteIn, DiscordAuthOut`.
Add to `..security` import: `create_discord_registration_token, decode_discord_registration_token`.
Add `from ..config import settings` if not already imported.

Update `_providers` so the OAuth loop includes discord. Find the loop `for prov in ("google", "telegram"):` (added in Phase 5) and change to:

```python
    for prov in ("google", "telegram", "discord"):
        if prov in have:
            p.append(prov)
```

(If Phase 5 is not merged and `_providers` still hardcodes google only, replace it with the set-based version:)

```python
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
```

- [ ] **Step 5: Add routes**

In `backend/app/routers/auth.py`, after the google routes, add:

```python
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
```

- [ ] **Step 6: Run discord tests + full suite**

Run: `cd backend && ./.venv/Scripts/python.exe -m pytest -q`
Expected: PASS (new discord tests + no regressions).

- [ ] **Step 7: Commit**

```bash
git add backend/app/routers/auth.py backend/tests/conftest.py backend/tests/test_discord.py
git commit -m "feat(phase6): /auth/discord + /complete (email auto-link) + providers"
```

---

## Task 6: Backend — link / unlink Discord

**Files:** Modify `backend/app/routers/auth.py`; Test `backend/tests/test_discord.py` (append)

- [ ] **Step 1: Failing tests**

Append to `backend/tests/test_discord.py`:

```python
def test_link_and_unlink_discord(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    code = discord_code("d_link_me", "elsewhere@t.io")
    assert client.post("/auth/link/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"}, headers=h).status_code == 204
    assert set(client.get("/auth/me", headers=h).json()["providers"]) == {"email", "discord"}
    assert client.delete("/auth/link/discord", headers=h).status_code == 204
    assert client.get("/auth/me", headers=h).json()["providers"] == ["email"]


def test_link_discord_already_on_other(client, creds):
    a = register(client, creds)
    code = discord_code("d_shared", "dshared@t.io")
    rt = client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    client.post("/auth/discord/complete", json={"registration_token": rt, "username": "dsharednick"})
    r = client.post("/auth/link/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"}, headers=auth_headers(a["access_token"]))
    assert r.status_code == 409


def test_unlink_discord_only_login_blocked(client):
    code = discord_code("d_only", "donly@t.io")
    rt = client.post("/auth/discord", json={"code": code, "redirect_uri": "http://localhost:3000/app"}).json()["registration_token"]
    data = client.post("/auth/discord/complete", json={"registration_token": rt, "username": "donlynick"}).json()
    assert client.delete("/auth/link/discord", headers=auth_headers(data["access_token"])).status_code == 400
```

- [ ] **Step 2: Run — fail** (404).

- [ ] **Step 3: Add routes**

In `backend/app/routers/auth.py`, after `discord_complete`:

```python
@router.post("/link/discord", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def link_discord(
    request: Request,
    data: DiscordIn,
    user: User = Depends(get_current_user),
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
    existing = (
        await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == "discord", OAuthAccount.provider_user_id == did
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        if existing.user_id != user.id:
            raise HTTPException(status.HTTP_409_CONFLICT, "Этот Discord уже привязан к другому аккаунту")
        return
    db.add(OAuthAccount(user_id=user.id, provider="discord", provider_user_id=did))
    await db.commit()


@router.delete("/link/discord", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_discord(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    others = (
        await db.execute(
            select(OAuthAccount.provider).where(
                OAuthAccount.user_id == user.id, OAuthAccount.provider != "discord"
            )
        )
    ).first()
    if user.password_hash is None and others is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нужен другой способ входа")
    await db.execute(
        delete(OAuthAccount).where(
            OAuthAccount.user_id == user.id, OAuthAccount.provider == "discord"
        )
    )
    await db.commit()
```

- [ ] **Step 4: Run full suite** (`cd backend && ./.venv/Scripts/python.exe -m pytest -q`) → PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/auth.py backend/tests/test_discord.py
git commit -m "feat(phase6): link/unlink discord (409 hijack, 400 lockout)"
```

---

## Task 7: Frontend — Nuxt runtime config

**Files:** Modify `web/nuxt.config.ts`

- [ ] **Step 1: Add discordClientId**

In `web/nuxt.config.ts`, `runtimeConfig.public`:

```ts
    public: {
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      telegramBotId: process.env.NUXT_PUBLIC_TELEGRAM_BOT_ID || '',
      discordClientId: process.env.NUXT_PUBLIC_DISCORD_CLIENT_ID || '',
    },
```

(If `telegramBotId` is absent because Phase 5 isn't merged, just add `discordClientId` next to `googleClientId`.)

- [ ] **Step 2: Commit**

```bash
git add web/nuxt.config.ts
git commit -m "feat(phase6): expose discordClientId in nuxt runtime config"
```

---

## Task 8: Frontend — Discord button + redirect return handler (index.vue)

**Files:** Modify `web/pages/index.vue`

- [ ] **Step 1: Read the client id + the redirect uri**

Near `const googleClientId = ...` (script setup):

```js
const discordClientId = useRuntimeConfig().public.discordClientId || ''
```

- [ ] **Step 2: Add the Discord button + start-redirect**

In the login modal social buttons area (near the Telegram/Google buttons), add a button:

```html
      <button data-soc="discord"><svg class="ic" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.25.5a18.3 18.3 0 0 1 4.32 1.35 16.6 16.6 0 0 0-14.94 0A18.3 18.3 0 0 1 8.85 3.5L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.6 9 .17 13.5.35 17.95a19.9 19.9 0 0 0 6.06 3.06l.75-1.03a13 13 0 0 1-2.05-.98l.5-.37a14.2 14.2 0 0 0 12.1 0l.5.37c-.65.38-1.34.71-2.05.98l.75 1.03a19.9 19.9 0 0 0 6.06-3.06c.26-5.2-.44-9.65-2.92-13.55ZM8.3 15.4c-1.18 0-2.15-1.09-2.15-2.42S7.1 10.56 8.3 10.56s2.17 1.1 2.15 2.42c0 1.33-.96 2.42-2.15 2.42Zm7.4 0c-1.18 0-2.15-1.09-2.15-2.42s.96-2.42 2.15-2.42 2.17 1.1 2.15 2.42c0 1.33-.96 2.42-2.15 2.42Z"/></svg>Войти через Discord</button>
```

In the login IIFE, add the start-redirect handler (near where Telegram/Google are wired):

```js
  function discordStart(linkMode){
    if(!discordClientId){ fail('Вход через Discord скоро'); return; }
    const redirect = location.origin + '/app';
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { sessionStorage.setItem('discord_state', state); sessionStorage.setItem('discord_link', linkMode?'1':''); } catch(e){}
    const url = 'https://discord.com/api/oauth2/authorize'
      + '?client_id=' + encodeURIComponent(discordClientId)
      + '&redirect_uri=' + encodeURIComponent(redirect)
      + '&response_type=code&scope=' + encodeURIComponent('identify email')
      + '&state=' + encodeURIComponent(state);
    location.href = url;
  }
  document.querySelectorAll('[data-soc="discord"]').forEach(b=>b.addEventListener('click',()=>discordStart(false)));
```

- [ ] **Step 3: Build**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build`
Expected: `Build complete!`.

- [ ] **Step 4: Commit**

```bash
git add web/pages/index.vue
git commit -m "feat(phase6): discord login button + oauth redirect start (state/CSRF)"
```

---

## Task 9: Frontend — handle the Discord return (`?code=` on /app) in app.vue

**Files:** Modify `web/pages/app.vue`

- [ ] **Step 1: Add discordClientId const**

Near the other runtime-config consts in `app.vue`:

```js
const discordClientId = useRuntimeConfig().public.discordClientId || ''
```

- [ ] **Step 2: On load, detect `?code=&state=` and finish the flow**

Add near the top of the app init (where the session/token is read at startup). Insert this IIFE early in the app `<script setup>` init block (after `apiPost`/`apiAuth` helpers are defined; if unsure, place right before `loadProfile()` is first called):

```js
(async function handleDiscordReturn(){
  const q = new URLSearchParams(location.search);
  const code = q.get('code'), state = q.get('state'), err = q.get('error');
  if(!code && !err) return;
  // очистить query из URL сразу (не оставлять code в адресе/истории)
  const clean = location.origin + location.pathname + (q.get('scr') ? ('?scr=' + q.get('scr')) : '');
  history.replaceState(null, '', clean);
  if(err){ toast('Вход через Discord отменён'); return; }
  let saved='', link=''; try{ saved=sessionStorage.getItem('discord_state')||''; link=sessionStorage.getItem('discord_link')||''; sessionStorage.removeItem('discord_state'); sessionStorage.removeItem('discord_link'); }catch(e){}
  if(!state || state!==saved){ toast('Discord: проверка безопасности не пройдена'); return; }
  const redirect_uri = location.origin + '/app';
  if(link){
    const { res } = await apiAuth('/auth/link/discord','POST',{ code, redirect_uri });
    if(res.status===409) toast('Этот Discord уже привязан к другому'); else if(res.ok){ toast('Discord привязан'); loadProfile(); }
    return;
  }
  const { r, data } = await apiPost('/auth/discord', { code, redirect_uri });
  if(!r.ok){ toast('Не удалось войти через Discord'); return; }
  if(data.needs_username){ window.__discordReg = data.registration_token; openDiscordNick(); return; }
  saveSessionFromData(data); loadProfile();
})();
```

> Two helpers this references — implement them to match how app.vue already saves a session and shows a nick prompt:
> - `saveSessionFromData(data)`: store `data.access_token` in `localStorage['fabula-token']` and `data.user` in `localStorage['fabula-user']`, then set `window.__fabulaUser = data.user`. (Reuse whatever the existing login/session-save code does — if there is a `saveSession`, call that.)
> - `openDiscordNick()`: open the existing nick modal (the same `openModal('Придумай ник', …)` used by the profile), and on submit call `apiPost('/auth/discord/complete', { registration_token: window.__discordReg, username })`, then `saveSessionFromData` + `loadProfile()`. If app.vue already has a Google/Telegram needs-username handler, route through it with a `provider='discord'` branch instead of duplicating.

- [ ] **Step 3: Add the Discord row in the settings sheet**

In the settings-sheet "Аккаунт" group (next to the Google/Telegram rows), add:

```html
            <div class="setrow" data-act="discord"><span class="l"><span class="g">◐</span>Discord</span><span class="chev" data-p="discord">привязать</span></div>
```

In `loadProfile`, reflect linked state (next to the google/telegram reflect lines):

```js
    const dc = document.querySelector('[data-p="discord"]');
    if (dc) dc.textContent = data.providers.includes('discord') ? 'привязан · отвязать' : 'привязать';
```

In the `data-act` click handler, add a `discord` branch:

```js
      if (act === 'discord') {
        const u = window.__fabulaUser || {};
        if ((u.providers||[]).includes('discord')) {
          const { res } = await apiAuth('/auth/link/discord', 'DELETE');
          if (res.status === 400) toast('Нужен другой способ входа'); else if (res.ok) { toast('Discord отвязан'); loadProfile(); }
          return;
        }
        if (!discordClientId) { toast('Вход через Discord скоро'); return; }
        const redirect = location.origin + '/app';
        const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
        try { sessionStorage.setItem('discord_state', state); sessionStorage.setItem('discord_link','1'); } catch(e){}
        location.href = 'https://discord.com/api/oauth2/authorize?client_id=' + encodeURIComponent(discordClientId)
          + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=code&scope=' + encodeURIComponent('identify email')
          + '&state=' + encodeURIComponent(state);
        return;
      }
```

> The settings-sheet `data-act` rows are wired by the selector `#settingsSheet [data-act]` (Phase 5). If Phase 5 isn't merged and the account rows are still in the profile body, put the Discord row there instead and rely on the `[data-scr="profile"] [data-act]` selector.

- [ ] **Step 4: Build**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build`
Expected: `Build complete!`.

- [ ] **Step 5: Commit**

```bash
git add web/pages/app.vue
git commit -m "feat(phase6): handle discord oauth return + discord row in settings"
```

---

## Task 10: Activation notes (no code) — leave for Ильнар, DO NOT push

- [ ] **Step 1: Document activation (report only)**

Discord Dev Portal (https://discord.com/developers/applications) → your app → OAuth2:
- Redirects: add prod `https://<домен>/app` and `http://localhost:3000/app`.
- Scopes used: `identify email`.
Env (Saturn backend): `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URIS=https://<домен>/app`. Web: `NUXT_PUBLIC_DISCORD_CLIENT_ID=<client id>`. Until set, the button shows «скоро» and nothing breaks.

- [ ] **Step 2: Verify branch state, DO NOT push**

```bash
cd backend && ./.venv/Scripts/python.exe -m pytest -q   # all green
git -C .. log --oneline -8
# НЕ push — ветка feature/phase6-discord ждёт ручной проверки
```

---

## Self-review notes

- **Spec coverage:** exchanger (T2), registration token (T3), schemas (T4), `/auth/discord`+auto-link+`/complete` (T5), link/unlink+lockout (T6), providers+discord (T5), rate-limit (`@limiter` on each route), redirect allowlist + `state`/CSRF (T5 backend `_check_discord_redirect`, T8/T9 frontend `state`), config/secrets (T1, T10), frontend button+return+settings row (T8, T9). No migration (email already nullable; oauth_accounts reused).
- **Type consistency:** exchanger returns `{discord_id,email,email_verified,username}` everywhere; token carries `discord_id`/`email`/`username`; `provider_user_id` is the string `discord_id`.
- **Known cross-branch note:** Phase 5 (Telegram) added the set-based `_providers`, the settings-sheet account section, and the `#settingsSheet [data-act]` selector. This plan assumes those; each affected task has a fallback note if Phase 5 isn't merged yet. Merge order suggestion: land Phase 5 first, then Phase 6, to avoid duplicating `_providers`/settings-row plumbing.
