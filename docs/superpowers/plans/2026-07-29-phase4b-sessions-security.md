# Фаза 4B — Безопасность/устройства (сессии) — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Раздел «Безопасность · устройства»: список активных сессий (устройство, страна, время), пометка текущего, отзыв отдельного устройства. Переход к сессиям с состоянием (JWT `sid` + таблица `sessions`).

**Architecture:** Новая таблица `sessions` (модель `UserSession`). При логине создаётся сессия, в JWT кладётся `sid`. `get_current_user` проверяет, что сессия не отозвана. Страна — из заголовка Cloudflare `CF-IPCountry`; IP не храним. Легаси-токены без `sid` работают до истечения.

**Tech Stack:** FastAPI, async SQLAlchemy, Alembic, PyJWT, pytest; Nuxt 3.

**Именование:** модель называется `UserSession` (не `Session`), чтобы не путать с sqlalchemy-сессией. Таблица — `sessions`.

---

## Файлы

Бэкенд:
- Modify `backend/app/models.py` — модель `UserSession`.
- Modify `backend/app/security.py` — `sid` в JWT.
- Modify `backend/app/deps.py` — проверка сессии в `get_current_user`.
- Modify `backend/app/routers/auth.py` — `_device_label`/`_country_name`/`_issue_session`, эндпойнты sessions, logout-all revoke.
- Create `backend/alembic/versions/0005_sessions.py`.
- Create `backend/tests/test_sessions.py`.

Фронт:
- Modify `web/pages/app.vue` — строка «Безопасность · устройства» + лист устройств.
- Modify `web/assets/css/app.css` — стили карточек устройств.

---

## Task 1: Модель UserSession + миграция 0005

**Files:** Modify `backend/app/models.py`; Create `backend/alembic/versions/0005_sessions.py`

- [ ] **Step 1: модель**

В `backend/app/models.py`, в конец файла, добавить (`Boolean`, `ForeignKey`, `String`, `DateTime`, `func`, `datetime` уже импортированы — сверь):
```python
class UserSession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    device: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
```

- [ ] **Step 2: миграция 0005**

Create `backend/alembic/versions/0005_sessions.py`:
```python
"""sessions

Revision ID: 0005
Revises: 0004
"""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device", sa.String(120), nullable=False, server_default=""),
        sa.Column("country", sa.String(2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_sessions_user_id", "sessions")
    op.drop_table("sessions")
```
Сверь `down_revision` с фактической ревизией 0004 (ожидается `"0004"`).

- [ ] **Step 3: миграции на чистой SQLite**

Run (из backend): `rm -f _m.db && DATABASE_URL="sqlite+aiosqlite:///./_m.db" ./.venv/Scripts/python.exe -m alembic upgrade head 2>&1 | grep -E "Running upgrade"; rm -f _m.db`
Expected: строки 0001→…→0005 без Traceback.
Регресс: `PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q` → `26 passed`.

- [ ] **Step 4: Commit**
```bash
git add backend/app/models.py backend/alembic/versions/0005_sessions.py
git commit -m "feat(db): модель UserSession + миграция 0005 (таблица sessions)"
```

---

## Task 2: JWT `sid` (security.py)

**Files:** Modify `backend/app/security.py`; Create `backend/tests/test_sessions.py` (первый тест)

- [ ] **Step 1: тест токена с sid**

Create `backend/tests/test_sessions.py`:
```python
def test_token_sid_roundtrip():
    from app.security import create_access_token, decode_access_token
    t = create_access_token(7, 0, sid=42)
    d = decode_access_token(t)
    assert d["user_id"] == 7 and d["ver"] == 0 and d["sid"] == 42
    t2 = create_access_token(7, 0)
    assert decode_access_token(t2)["sid"] is None
```

- [ ] **Step 2: запустить — падает**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/test_sessions.py -q`
Expected: FAIL (create_access_token не принимает sid / decode не возвращает sid).

- [ ] **Step 3: реализация**

В `backend/app/security.py`:
- `create_access_token` — сигнатуру сделать `def create_access_token(user_id: int, token_version: int, sid: int | None = None) -> str:` и в `payload` добавить (после `exp`):
```python
    if sid is not None:
        payload["sid"] = sid
```
- `decode_access_token` — в возвращаемый dict добавить `"sid"`:
```python
        return {"user_id": int(payload["sub"]), "ver": int(payload["ver"]), "sid": payload.get("sid")}
```

- [ ] **Step 4: тест зелёный + регресс**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q`
Expected: PASS всё (27: 26 + новый).

- [ ] **Step 5: Commit**
```bash
git add backend/app/security.py backend/tests/test_sessions.py
git commit -m "feat(auth): sid в access-JWT (create/decode)"
```

---

## Task 3: Сессии — выпуск, проверка, эндпойнты, отзыв

**Files:** Modify `backend/app/routers/auth.py`, `backend/app/deps.py`, `backend/tests/test_sessions.py`

- [ ] **Step 1: интеграционные тесты (дописать в test_sessions.py)**
```python
import uuid
from tests.conftest import auth_headers, register


def test_login_creates_session(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    r = client.get("/auth/sessions", headers=h)
    assert r.status_code == 200, r.text
    lst = r.json()
    assert len(lst) == 1 and lst[0]["current"] is True and lst[0]["device"]
    assert "country_name" in lst[0]


def test_revoke_session_blocks_token(client, creds):
    data = register(client, creds); h = auth_headers(data["access_token"])
    sid = client.get("/auth/sessions", headers=h).json()[0]["id"]
    login2 = client.post("/auth/login", json={"email": creds["email"], "password": creds["password"]}).json()
    h2 = auth_headers(login2["access_token"])
    assert len(client.get("/auth/sessions", headers=h2).json()) == 2
    assert client.delete(f"/auth/sessions/{sid}", headers=h2).status_code == 204
    assert client.get("/auth/me", headers=h).status_code == 401  # первый токен отозван


def test_revoke_other_users_session_404(client, creds):
    a = register(client, creds); ha = auth_headers(a["access_token"])
    sid_a = client.get("/auth/sessions", headers=ha).json()[0]["id"]
    cb = {"username": "u" + uuid.uuid4().hex[:8], "email": uuid.uuid4().hex[:8] + "@t.io", "password": "password1"}
    b = register(client, cb); hb = auth_headers(b["access_token"])
    assert client.delete(f"/auth/sessions/{sid_a}", headers=hb).status_code == 404


def test_logout_all_revokes_sessions(client, creds):
    data = register(client, creds); h = auth_headers(data["access_token"])
    assert client.post("/auth/logout-all", headers=h).status_code == 204
    assert client.get("/auth/me", headers=h).status_code == 401


def test_legacy_token_without_sid_works(client, creds):
    data = register(client, creds); h = auth_headers(data["access_token"])
    uid = client.get("/auth/me", headers=h).json()["id"]
    from app.security import create_access_token
    legacy = create_access_token(uid, 0)  # без sid
    assert client.get("/auth/me", headers=auth_headers(legacy)).status_code == 200


def test_device_and_country_helpers():
    from app.routers.auth import _device_label, _country_name
    assert "Chrome" in _device_label("Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit Chrome/120 Safari/537")
    assert _country_name("RU") == "Россия"
    assert _country_name(None) == "—"
```

- [ ] **Step 2: запустить — падают**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/test_sessions.py -q`
Expected: FAIL (нет /auth/sessions, нет хелперов, сессии не создаются).

- [ ] **Step 3: deps.py — проверка сессии**

В `backend/app/deps.py`:
- импорты: добавить `from datetime import datetime, timezone`; `from .models import User, UserSession`.
- в `get_current_user`, ПОСЛЕ проверки `user is None or user.token_version != payload["ver"]`, ДО `return user`, вставить:
```python
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
```
(`decode_access_token` теперь возвращает `sid` — `payload` в deps это его результат.)

- [ ] **Step 4: routers/auth.py — хелперы, выпуск сессии, эндпойнты**

В `backend/app/routers/auth.py`:

(a) импорты: `from ..models import OAuthAccount, User, UserSession`; `from sqlalchemy import delete, func, select, update` (добавить `update`).

(b) хелперы (добавить рядом с прочими приватными функциями):
```python
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
    country = request.headers.get("cf-ipcountry")  # заголовки Starlette регистронезависимы
    if country in (None, "", "XX", "T1"):  # XX/T1 — неизвестно/Tor
        country = None
    s = UserSession(user_id=user.id, device=_device_label(ua), country=country)
    db.add(s)
    await db.flush()
    return create_access_token(user.id, user.token_version, sid=s.id)
```

(c) заменить выдачу токена на выпуск сессии во всех точках входа (у всех есть `request: Request`):
- `register`: `return TokenOut(access_token=await _issue_session(db, user, request), user=await _user_out(db, user))`
- `login`: аналогично.
- `google_auth` — обе ветки, где сейчас `GoogleAuthOut(**_session_out(user), user=...)`, заменить на:
  `return GoogleAuthOut(access_token=await _issue_session(db, user, request), token_type="bearer", user=await _user_out(db, user))`
- `google_complete`: `return TokenOut(access_token=await _issue_session(db, user, request), user=await _user_out(db, user))`
- Функцию `_session_out` можно удалить (больше не используется) — проверь, что нигде не осталось ссылок.

(d) эндпойнты сессий (в конец файла):
```python
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
```

(e) в существующем `logout_all` — дополнительно погасить все сессии. Найди функцию `logout_all` (bump token_version) и ПЕРЕД/после bump добавить:
```python
    await db.execute(update(UserSession).where(UserSession.user_id == user.id).values(revoked=True))
```
(commit уже есть в конце функции — сверь, что и bump, и revoke попадают в один commit.)

- [ ] **Step 5: весь набор**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q`
Expected: PASS всё (27 прежних + 6 новых интеграционных = ~33; точное число не критично, главное 0 упавших).

- [ ] **Step 6: Commit**
```bash
git add backend/app/routers/auth.py backend/app/deps.py backend/tests/test_sessions.py
git commit -m "feat(auth): сессии устройств — выпуск при логине, проверка, список, отзыв, logout-all"
```

---

## Task 4: Фронт — раздел «Безопасность · устройства»

**Files:** Modify `web/pages/app.vue`, `web/assets/css/app.css`

- [ ] **Step 1: строка в карточке Аккаунт**

В `web/pages/app.vue`, в карточке «Аккаунт» (`.p-card`), ПЕРЕД строкой «Выйти со всех устройств» (`data-act="logout-all"`), добавить:
```html
            <div class="setrow" data-act="devices"><span class="l"><span class="g">🛡</span>Безопасность · устройства</span><span class="chev">›</span></div>
```

- [ ] **Step 2: лист устройств (разметка)**

Рядом с `#settingsSheet` добавить:
```html
      <div class="sheet2" id="devSheet">
        <div class="sheet2-card">
          <div class="sheet2-h">Устройства <button class="sheet2-x" id="devClose">✕</button></div>
          <div id="devList" class="dev-list"></div>
        </div>
      </div>
```

- [ ] **Step 3: JS — загрузка/отзыв (app.vue)**

В `onMounted` (после других обработчиков `[data-act]` / рядом с листом настроек) добавить ветку и логику. В делегированном обработчике `[data-act]` добавить:
```js
      if (act === 'devices') { openDevices(); return; }
```
И функции (в том же скоупе onMounted):
```js
  const devSheet=document.getElementById('devSheet');
  const devCloseBtn=document.getElementById('devClose'); if(devCloseBtn) devCloseBtn.addEventListener('click',()=>devSheet.classList.remove('on'));
  function relTime(iso){ if(!iso) return ''; const d=new Date(iso), now=new Date(), days=Math.floor((now-d)/86400000);
    if(days<=0) return 'сегодня'; if(days===1) return 'вчера'; if(days<7) return days+' дн. назад'; return d.toLocaleDateString('ru-RU'); }
  async function openDevices(){
    devSheet.classList.add('on');
    const list=document.getElementById('devList'); list.innerHTML='<div class="dev-empty">Загрузка…</div>';
    const { res, data } = await apiAuth('/auth/sessions','GET');
    if(!res.ok || !Array.isArray(data)){ list.innerHTML='<div class="dev-empty">Не удалось загрузить</div>'; return; }
    list.innerHTML = data.map(s=>`<div class="dev-row">
        <div class="dev-info"><div class="dev-name">${s.device||'Устройство'} ${s.current?'<span class=\\'dev-cur\\'>это устройство</span>':''}</div>
          <div class="dev-meta">${s.country_name||'—'} · вход ${relTime(s.created_at)} · активно ${relTime(s.last_seen_at)}</div></div>
        ${s.current?'':`<button class="dev-kill" data-sid="${s.id}">Выйти</button>`}
      </div>`).join('') || '<div class="dev-empty">Нет активных устройств</div>';
    list.querySelectorAll('.dev-kill').forEach(b=>b.addEventListener('click',async ()=>{
      const { res } = await apiAuth('/auth/sessions/'+b.dataset.sid,'DELETE');
      if(res.ok){ toast('Устройство отключено'); openDevices(); }
    }));
  }
```
Сверь `apiAuth`/`toast` — реальные имена. Экранирование кавычек в шаблоне поправь при необходимости (можно вынести бейдж/кнопку в отдельные переменные, если так надёжнее).

- [ ] **Step 4: стили (app.css)**

В конец `web/assets/css/app.css`:
```css
  .dev-list{display:flex;flex-direction:column;gap:2px;margin-top:6px}
  .dev-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 2px;border-bottom:1px solid rgba(255,255,255,.07)}
  .dev-row:last-child{border-bottom:none}
  .dev-name{font-family:'Forum',serif;font-size:15px;color:#eaeaee}
  .dev-cur{font-family:'Forum',serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#7cc47f;margin-left:8px}
  .dev-meta{font-family:'Forum',serif;font-size:12px;color:#6d6d78;margin-top:3px}
  .dev-kill{background:#ffffff08;border:1px solid rgba(255,255,255,.14);color:#d9655f;border-radius:9px;padding:7px 14px;font-family:'Forum',serif;font-size:13px;cursor:pointer}
  .dev-kill:hover{background:#ffffff12}
  .dev-empty{font-family:'Forum',serif;font-size:14px;color:#6d6d78;padding:14px 2px}
```

- [ ] **Step 5: сборка + Commit**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build` → успех.
```bash
git add web/pages/app.vue web/assets/css/app.css
git commit -m "feat(web): раздел «Безопасность · устройства» — список сессий + отзыв"
```

---

## Task 5: Деплой (авто по main)

- [ ] **Step 1: регресс**

Backend: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q` → 0 упавших.
Web: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build` → `✨`.

- [ ] **Step 2: мерж в main + пуш**

Слить ветку 4B в `main`, запушить. Saturn применит миграцию 0005 при старте. `CF-IPCountry` приходит от Cloudflare (Saturn за CF) — на проде страна определится; локально/без CF — «—».

- [ ] **Step 3: проверка на проде**

Залогинен: Профиль → Аккаунт → «Безопасность · устройства» → лист со списком (текущее устройство помечено, страна показана); повторный вход в другом браузере → появляется вторым; «Выйти» на чужом устройстве отзывает его.

---

## Проверка плана против спеки

- Таблица `sessions`/`UserSession` (cascade, revoked) — Task 1.
- `sid` в JWT (create/decode) — Task 2.
- Проверка сессии в get_current_user + троттл last_seen + легаси — Task 3 (deps).
- Выпуск сессии при логине (все точки входа) — Task 3.
- `GET /auth/sessions` (current), `DELETE /auth/sessions/{id}` (скоуп 404), logout-all revoke — Task 3.
- Устройство из UA, страна из CF-IPCountry (маппинг), IP не храним — Task 3.
- Фронт: раздел + лист + отзыв — Task 4.
- Безопасность (скоуп по user_id, мгновенный отзыв, минимум PII) — Task 3.
- Тесты (сессия при логине, отзыв блокирует токен, чужой 404, logout-all, легаси, хелперы) — Task 3.
