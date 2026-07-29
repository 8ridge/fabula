# Фаза 1 — Профиль и аккаунт: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать профиль в приложении рабочим на реальных данных аккаунта: уникальный ник, смена ника/пароля, выход со всех устройств, удаление аккаунта — плюс инфраструктура (`username`, `token_version`, Alembic-миграции) под будущие фазы.

**Architecture:** Достраиваем существующий FastAPI-бэкенд (`backend/app`), не переписывая. Добавляем колонки в `users`, вводим версионирование JWT для «выхода везде», новые эндпойнты профиля под Bearer. Фронт (`web/pages/app.vue`) грузит `GET /auth/me` и рендерит профиль по одобренному мокапу; глубокие действия — через нижние шиты. Тесты — pytest + httpx `TestClient` против SQLite (в стиле текущего `smoke_test.py`). Прод-миграции — Alembic (async).

**Tech Stack:** FastAPI, async SQLAlchemy 2.0, asyncpg (прод) / aiosqlite (тесты), argon2, PyJWT, Alembic, pytest, Nuxt 3 (Vue).

---

## Файлы

Бэкенд (`backend/`):
- Modify `app/models.py` — новые колонки User.
- Modify `app/schemas.py` — RegisterIn(username), UserOut(+поля), новые In-схемы.
- Modify `app/security.py` — токен несёт `ver`; decode возвращает dict.
- Modify `app/deps.py` — сверка `token_version`.
- Modify `app/routers/auth.py` — register(username), /me(+поля), новые эндпойнты.
- Create `app/email.py` — заготовка `EmailSender` (dev-реализация) под Фазу 2.
- Create `alembic.ini`, `alembic/env.py`, `alembic/versions/0001_*.py`, `alembic/versions/0002_*.py`.
- Create `tests/conftest.py`, `tests/test_auth.py`, `tests/test_profile.py`.
- Modify `requirements.txt` — alembic, pytest.

Фронт (`web/`):
- Modify `pages/index.vue` — форма регистрации шлёт `username`.
- Modify `pages/app.vue` — профиль на реальных данных + шиты действий.

---

## Task 1: Тестовый каркас (pytest + httpx против SQLite)

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Добавить dev-зависимости**

В конец `backend/requirements.txt` дописать:

```
alembic==1.14.0
pytest==8.3.4
```

Установить в venv:

Run: `cd backend && ./.venv/Scripts/python.exe -m pip install alembic==1.14.0 pytest==8.3.4 aiosqlite httpx`
Expected: успешная установка (aiosqlite/httpx уже стоят с smoke-теста).

- [ ] **Step 2: Создать пакет тестов**

Create `backend/tests/__init__.py` — пустой файл.

- [ ] **Step 3: Создать conftest.py с клиентом и генератором кредов**

Create `backend/tests/conftest.py`:

```python
"""Фикстуры тестов: SQLite-приложение и уникальные креды на каждый тест."""
import os
import uuid

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["JWT_SECRET"] = "test-secret"

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    if os.path.exists("test.db"):
        os.remove("test.db")
    from app.main import app  # импорт после подмены env

    with TestClient(app) as c:  # lifespan создаёт таблицы (init_db)
        yield c
    if os.path.exists("test.db"):
        os.remove("test.db")


@pytest.fixture
def creds():
    u = uuid.uuid4().hex[:8]
    return {"username": f"user_{u}", "email": f"{u}@t.io", "password": "secret1"}


def register(client, creds):
    r = client.post("/auth/register", json=creds)
    assert r.status_code == 201, r.text
    return r.json()


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 4: Первый тест — регистрация по username (пока упадёт)**

Create `backend/tests/test_auth.py`:

```python
from tests.conftest import auth_headers, register


def test_register_returns_username(client, creds):
    data = register(client, creds)
    assert data["user"]["username"] == creds["username"]
    assert data["user"]["email"] == creds["email"]
    assert "access_token" in data
```

- [ ] **Step 5: Запустить — тест падает (нужен username)**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/test_auth.py -v`
Expected: FAIL — текущий register принимает `name`, не `username` (422 или KeyError на `username`).

- [ ] **Step 6: Коммит каркаса**

```bash
git add backend/requirements.txt backend/tests/
git commit -m "test: каркас pytest (httpx + SQLite) для auth"
```

---

## Task 2: Колонки User (username, email_verified, token_version, avatar_url)

**Files:**
- Modify: `backend/app/models.py`

- [ ] **Step 1: Заменить содержимое models.py**

Полностью заменить `backend/app/models.py` на:

```python
"""ORM-модели. Пока одна — пользователь."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    # Уникальный ник (@хендл). Уникальность регистронезависимая — проверяем в коде.
    username: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    # Хэш пароля (argon2). NULL допустим — вход только через Google (Фаза 3).
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Жёсткий гейт (Фаза 2) смотрит сюда. В Фазе 1 дефолт True (гейта ещё нет).
    email_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Версия токена: инкремент = «выход со всех устройств» (старые JWT недействительны).
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

- [ ] **Step 2: Проверить, что модель импортируется**

Run: `cd backend && ./.venv/Scripts/python.exe -c "from app.models import User; print([c.name for c in User.__table__.columns])"`
Expected: `['id', 'email', 'username', 'password_hash', 'email_verified', 'avatar_url', 'token_version', 'created_at']`

- [ ] **Step 3: Коммит**

```bash
git add backend/app/models.py
git commit -m "feat(models): username, email_verified, token_version, avatar_url"
```

---

## Task 3: Версионирование JWT (security.py + deps.py)

**Files:**
- Modify: `backend/app/security.py`
- Modify: `backend/app/deps.py`

Заметка: E2E-тест поведения (`logout-all` инвалидирует старый токен) добавляется в
Task 4, когда `register` и `logout-all` уже существуют. Здесь — только изменение
`security.py`/`deps.py` и изолированная проверка (register сейчас временно
несогласован с новой моделью — это чинится в Task 4).

- [ ] **Step 1: Токен несёт версию**

Заменить в `backend/app/security.py` функции `create_access_token` и `decode_access_token` на:

```python
def create_access_token(user_id: int, token_version: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "ver": token_version,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_ttl_min),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_access_token(token: str) -> dict | None:
    """Возвращает {'user_id': int, 'ver': int} из валидного токена или None."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        return {"user_id": int(payload["sub"]), "ver": int(payload["ver"])}
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
```

- [ ] **Step 2: get_current_user сверяет версию**

Заменить тело `get_current_user` в `backend/app/deps.py` на:

```python
async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_access_token(creds.credentials)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Недействительный токен")
    user = await db.get(User, payload["user_id"])
    if user is None or user.token_version != payload["ver"]:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Сессия недействительна")
    return user
```

(Остальные строки deps.py — импорты, `bearer` — без изменений.)

- [ ] **Step 3: Изолированная проверка согласованности токена**

`register`/`login` обновятся в Task 4 (передавать `user.token_version`); поведение
`logout-all` проверяется E2E в Task 4. Здесь проверяем только пару create/decode:

Run: `cd backend && ./.venv/Scripts/python.exe -c "from app.security import create_access_token, decode_access_token; t=create_access_token(1,0); print(decode_access_token(t))"`
Expected: `{'user_id': 1, 'ver': 0}`

- [ ] **Step 4: Коммит**

```bash
git add backend/app/security.py backend/app/deps.py
git commit -m "feat(auth): версионирование JWT (token_version) для выхода со всех устройств"
```

---

## Task 4: Схемы + register(username) + GET /auth/me

**Files:**
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/routers/auth.py`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: Заменить schemas.py**

Полностью заменить `backend/app/schemas.py` на:

```python
"""Pydantic-схемы: что приходит в запросах и что уходит в ответах."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

USERNAME_PATTERN = r"^[A-Za-z0-9_]{3,20}$"


class RegisterIn(BaseModel):
    username: str = Field(pattern=USERNAME_PATTERN)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UsernameIn(BaseModel):
    username: str = Field(pattern=USERNAME_PATTERN)


class ChangePasswordIn(BaseModel):
    current_password: str | None = None
    new_password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    email_verified: bool
    avatar_url: str | None = None
    created_at: datetime
    providers: list[str] = []

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
```

- [ ] **Step 2: Хелперы + register + me в auth.py**

Полностью заменить `backend/app/routers/auth.py` на:

```python
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
```

- [ ] **Step 3: Тесты — register(username) и /me**

Дописать в `backend/tests/test_auth.py`:

```python
def test_me_returns_profile_fields(client, creds):
    data = register(client, creds)
    r = client.get("/auth/me", headers=auth_headers(data["access_token"]))
    assert r.status_code == 200
    body = r.json()
    assert body["username"] == creds["username"]
    assert body["email_verified"] is True
    assert body["providers"] == ["email"]


def test_register_rejects_duplicate_username(client, creds):
    register(client, creds)
    dup = {"username": creds["username"], "email": "other_" + creds["email"], "password": "secret1"}
    r = client.post("/auth/register", json=dup)
    assert r.status_code == 409


def test_register_rejects_bad_username(client):
    r = client.post("/auth/register", json={"username": "a b!", "email": "x@t.io", "password": "secret1"})
    assert r.status_code == 422


def test_logout_all_invalidates_old_token(client, creds):
    data = register(client, creds)
    old = data["access_token"]
    assert client.get("/auth/me", headers=auth_headers(old)).status_code == 200
    assert client.post("/auth/logout-all", headers=auth_headers(old)).status_code == 204
    assert client.get("/auth/me", headers=auth_headers(old)).status_code == 401
```

- [ ] **Step 4: Запустить весь файл auth — все проходят**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/test_auth.py -v`
Expected: PASS все тесты (register/me/version/duplicate/bad).

- [ ] **Step 5: Коммит**

```bash
git add backend/app/schemas.py backend/app/routers/auth.py backend/tests/test_auth.py
git commit -m "feat(auth): register(username), расширенный /me, эндпойнты профиля"
```

---

## Task 5: Тесты профиля (ник/пароль/удаление)

**Files:**
- Create: `backend/tests/test_profile.py`

- [ ] **Step 1: Тесты профиля**

Create `backend/tests/test_profile.py`:

```python
from tests.conftest import auth_headers, register


def test_change_username_ok(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    r = client.patch("/auth/username", json={"username": creds["username"] + "x"}, headers=h)
    assert r.status_code == 200
    assert r.json()["username"] == creds["username"] + "x"


def test_change_username_taken(client, creds):
    a = register(client, creds)
    import uuid
    b_creds = {"username": "u" + uuid.uuid4().hex[:7], "email": "b" + creds["email"], "password": "secret1"}
    register(client, b_creds)
    r = client.patch("/auth/username", json={"username": b_creds["username"]},
                     headers=auth_headers(a["access_token"]))
    assert r.status_code == 409


def test_change_password_then_login(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    r = client.post("/auth/change-password",
                    json={"current_password": creds["password"], "new_password": "newpass9"}, headers=h)
    assert r.status_code == 204
    # старый пароль больше не подходит
    assert client.post("/auth/login", json={"email": creds["email"], "password": creds["password"]}).status_code == 401
    # новый — подходит
    assert client.post("/auth/login", json={"email": creds["email"], "password": "newpass9"}).status_code == 200


def test_change_password_wrong_current(client, creds):
    data = register(client, creds)
    r = client.post("/auth/change-password",
                    json={"current_password": "wrong", "new_password": "newpass9"},
                    headers=auth_headers(data["access_token"]))
    assert r.status_code == 400


def test_delete_account(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    assert client.delete("/auth/account", headers=h).status_code == 204
    # токен больше не валиден (юзера нет)
    assert client.get("/auth/me", headers=h).status_code == 401
    # можно зарегать ту же почту заново
    assert client.post("/auth/register", json=creds).status_code == 201
```

- [ ] **Step 2: Запустить — все проходят**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -v`
Expected: PASS все тесты (auth + profile).

- [ ] **Step 3: Коммит**

```bash
git add backend/tests/test_profile.py
git commit -m "test: профиль — смена ника/пароля, удаление аккаунта"
```

---

## Task 6: Alembic (async) + миграции колонок + бэкфилл ника

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/0001_baseline.py`
- Create: `backend/alembic/versions/0002_profile_columns.py`

- [ ] **Step 1: alembic.ini**

Create `backend/alembic.ini`:

```ini
[alembic]
script_location = alembic
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 2: script.py.mako**

Create `backend/alembic/script.py.mako`:

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
"""
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 3: env.py (async)**

Create `backend/alembic/env.py`:

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import settings
from app.database import Base
from app import models  # noqa: F401  — регистрируем модели

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)
if config.config_file_name:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    context.configure(url=settings.database_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    asyncio.run(run_async_migrations())
```

- [ ] **Step 4: Миграция 0001 — baseline (текущая таблица users до Фазы 1)**

Create `backend/alembic/versions/0001_baseline.py`:

```python
"""baseline: users как в проде до Фазы 1

Revision ID: 0001
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Таблица уже существует в проде (создана через create_all). На чистой БД — создаём.
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if "users" in insp.get_table_names():
        return
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("users")
```

- [ ] **Step 5: Миграция 0002 — новые колонки + бэкфилл ника + удаление name**

Create `backend/alembic/versions/0002_profile_columns.py`:

```python
"""profile: username, email_verified, avatar_url, token_version; бэкфилл ника

Revision ID: 0002
Revises: 0001
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # username: сначала nullable, бэкфиллим, потом not-null + unique.
    op.add_column("users", sa.Column("username", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("token_version", sa.Integer(), server_default="0", nullable=False))

    # Бэкфилл: ник из части email до @, только допустимые символы, обрезка до 20,
    # при коллизии добавляем id. Существующих юзеров мало (тестовые).
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, email FROM users")).fetchall()
    used = set()
    import re
    for uid, email in rows:
        base = re.sub(r"[^A-Za-z0-9_]", "", (email or "").split("@")[0])[:20] or f"user{uid}"
        if len(base) < 3:
            base = (base + "___")[:3]
        name = base
        if name.lower() in used:
            name = (base[:16] + str(uid))[:20]
        used.add(name.lower())
        bind.execute(sa.text("UPDATE users SET username = :u WHERE id = :i"), {"u": name, "i": uid})

    op.alter_column("users", "username", nullable=False)
    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.create_index("ix_users_username", "users", ["username"])

    # name больше не нужен (ник = отображаемое имя).
    op.drop_column("users", "name")


def downgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(80), nullable=False, server_default=""))
    op.drop_index("ix_users_username", "users")
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "token_version")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "username")
```

- [ ] **Step 6: Проверить миграции на чистой SQLite**

Run: `cd backend && DATABASE_URL="sqlite+aiosqlite:///./mig.db" ./.venv/Scripts/python.exe -m alembic upgrade head`
Expected: `Running upgrade -> 0001`, `Running upgrade 0001 -> 0002`, без ошибок. Затем удалить: `rm -f mig.db`.

- [ ] **Step 7: Коммит**

```bash
git add backend/alembic.ini backend/alembic/
git commit -m "feat(db): Alembic (async) + миграции колонок профиля с бэкфиллом ника"
```

---

## Task 7: Заготовка EmailSender (под Фазу 2)

**Files:**
- Create: `backend/app/email.py`

- [ ] **Step 1: Интерфейс + dev-реализация**

Create `backend/app/email.py`:

```python
"""Отправка писем — провайдер-независимая абстракция (используется в Фазе 2)."""
import logging
from typing import Protocol

log = logging.getLogger("fabula.email")


class EmailSender(Protocol):
    def send_verification(self, email: str, code: str, link: str) -> None: ...


class DevEmailSender:
    """Ничего не шлёт — пишет код в лог. Для разработки/тестов."""

    def send_verification(self, email: str, code: str, link: str) -> None:
        log.info("[DEV EMAIL] verify %s -> code=%s link=%s", email, code, link)


def get_email_sender() -> EmailSender:
    # В Фазе 2: выбор по settings.email_provider (dev|resend). Пока только dev.
    return DevEmailSender()
```

- [ ] **Step 2: Проверить импорт**

Run: `cd backend && ./.venv/Scripts/python.exe -c "from app.email import get_email_sender; get_email_sender().send_verification('a@b.io','123456','http://x')"`
Expected: без ошибок (лог-строка).

- [ ] **Step 3: Коммит**

```bash
git add backend/app/email.py
git commit -m "feat(email): заготовка EmailSender (dev) под Фазу 2"
```

---

## Task 8: Фронт — форма регистрации шлёт username

**Files:**
- Modify: `web/pages/index.vue`
- Modify: `index.html` (статик-зеркало)

- [ ] **Step 1: Заменить сбор поля в submit (index.vue)**

В `web/pages/index.vue`, в обработчике `form.addEventListener('submit', ...)`:
найти блок, где для регистрации берётся `name`, и заменить тело reg-ветки так,
чтобы поле уходило как `username`. Итоговый payload при регистрации:

```js
      const {r, data} = await apiPost(reg ? '/auth/register' : '/auth/login',
        reg ? {username: name, email, password:pass} : {email, password:pass});
```

(Переменная `name` уже берётся из `$('afName').value.trim()` — оставляем как есть,
меняем только ключ `name` → `username` в объекте запроса. Плейсхолдер поля можно
оставить «Имя героя».)

- [ ] **Step 2: Тот же правкой в index.html**

В `index.html` найти аналогичный `apiPost(reg ? '/auth/register'...` и заменить
`{name, email, password:pass}` → `{username: name, email, password:pass}`.

- [ ] **Step 3: Проверить сборку фронта**

Run: `cd web && npm run build`
Expected: `✔ built` без ошибок.

- [ ] **Step 4: Коммит**

```bash
git add web/pages/index.vue index.html
git commit -m "feat(web): форма регистрации шлёт username"
```

---

## Task 9: Фронт — профиль на реальных данных

**Files:**
- Modify: `web/pages/app.vue`

Профиль-экран сейчас (`data-scr="profile"`) — хардкод. Привяжем к `GET /auth/me`.

- [ ] **Step 1: Хелпер API и загрузка профиля в onMounted**

В `web/pages/app.vue`, внутри `onMounted(() => { ... })`, добавить в начало
(после чтения сессии `window.__fabulaSession`) блок:

```js
  const AUTH_API = (location.hostname==='localhost' || location.hostname==='127.0.0.1')
    ? 'http://127.0.0.1:8000' : 'https://dungeon20-p5svbq.saturn.ac';

  async function apiAuth(path, method='GET', body=null){
    const token = localStorage.getItem('fabula-token') || '';
    const opt = { method, headers: { 'Authorization': 'Bearer ' + token } };
    if (body){ opt.headers['Content-Type']='application/json'; opt.body = JSON.stringify(body); }
    const res = await fetch(AUTH_API + path, opt);
    let data = null; try { data = await res.json(); } catch(_){}
    return { res, data };
  }

  function fmtJoined(iso){
    try { return new Date(iso).toLocaleDateString('ru-RU', {day:'numeric', month:'long', year:'numeric'}); }
    catch(_){ return ''; }
  }

  async function loadProfile(){
    const { res, data } = await apiAuth('/auth/me');
    if (res.status === 401){ location.href = '/'; return; }  // нет сессии → на сайт
    if (!res.ok || !data) return;
    window.__fabulaUser = data;
    const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    set('[data-p="username"]', '@' + data.username);
    set('[data-p="email"]', data.email);
    set('[data-p="joined"]', 'на ФАБУЛЕ с ' + fmtJoined(data.created_at));
    const badge = document.querySelector('[data-p="verified"]');
    if (badge) badge.style.display = data.email_verified ? '' : 'none';
    const gp = document.querySelector('[data-p="google"]');
    if (gp) gp.textContent = data.providers.includes('google') ? 'подключён' : 'скоро';
  }
  loadProfile();
```

- [ ] **Step 2: Разметка профиля — data-атрибуты вместо хардкода**

В `web/pages/app.vue`, в секции `data-scr="profile"`, заменить `.p-top`-блок
(строки с именем/почтой) на:

```html
          <div class="p-top">
            <div class="avatar"><img src="/assets/avatar.jpg" onerror="this.style.display='none'"><span class="fb">♞</span><span class="ring"></span></div>
            <div class="p-name" data-p="username">@…</div>
            <div class="p-tier"><span data-p="email">…</span> <span data-p="verified" style="color:#7cc47f">✓ подтверждена</span></div>
            <div class="p-joined" data-p="joined" style="font-size:12px;color:var(--ink-mute)"></div>
          </div>
```

(Игровой блок XP/статы оставить как есть — плейсхолдер.)

- [ ] **Step 3: Секция АККАУНТ перед секцией «Настройки»**

В той же секции, перед `<div class="list-h" style="margin-top:16px">Настройки</div>`,
вставить:

```html
          <div class="list-h" style="margin-top:16px">Аккаунт</div>
          <div class="setrow" data-act="username"><span class="l"><span class="g">◈</span>Никнейм</span><span class="chev" data-p="username-mini"></span></div>
          <div class="setrow" data-act="password"><span class="l"><span class="g">⚿</span>Пароль</span><span class="chev">Изменить ›</span></div>
          <div class="setrow"><span class="l"><span class="g">✉</span>Почта</span><span class="chev" style="color:#7cc47f">подключена</span></div>
          <div class="setrow"><span class="l"><span class="g">G</span>Google</span><span class="chev" data-p="google">скоро</span></div>
          <div class="setrow" data-act="logout"><span class="l"><span class="g">⎋</span>Выйти</span><span class="chev">›</span></div>
          <div class="setrow" data-act="logout-all"><span class="l"><span class="g">⎇</span>Выйти со всех устройств</span><span class="chev">›</span></div>
```

- [ ] **Step 4: Опасная зона в конце секции**

Перед закрывающим `</div>` блока `.scroll` секции профиля добавить:

```html
          <div class="setrow" data-act="delete" style="margin-top:10px"><span class="l" style="color:#d9655f"><span class="g">🗑</span>Удалить аккаунт</span></div>
```

- [ ] **Step 5: Проверить сборку**

Run: `cd web && npm run build`
Expected: `✔ built`.

- [ ] **Step 6: Коммит**

```bash
git add web/pages/app.vue
git commit -m "feat(web): профиль грузит /auth/me и показывает реальные данные"
```

---

## Task 10: Фронт — действия аккаунта через шиты

**Files:**
- Modify: `web/pages/app.vue`

- [ ] **Step 1: Обработчики действий (делегирование по data-act)**

В `onMounted` `web/pages/app.vue`, после `loadProfile();`, добавить:

```js
  function toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.textContent=msg; t.classList.add('on'); setTimeout(()=>t.classList.remove('on'),2200); }

  function clearSession(){ try{ localStorage.removeItem('fabula-token'); localStorage.removeItem('fabula-user'); }catch(_){}; location.href='/'; }

  document.querySelectorAll('[data-scr="profile"] [data-act]').forEach(row => {
    row.addEventListener('click', async () => {
      const act = row.dataset.act;
      if (act === 'logout') { clearSession(); return; }
      if (act === 'logout-all') {
        const { res } = await apiAuth('/auth/logout-all', 'POST');
        if (res.ok) { toast('Вышли со всех устройств'); clearSession(); }
        return;
      }
      if (act === 'username') {
        const cur = (window.__fabulaUser && window.__fabulaUser.username) || '';
        const val = prompt('Новый ник (3–20, латиница/цифры/_):', cur);
        if (!val || val === cur) return;
        const { res, data } = await apiAuth('/auth/username', 'PATCH', { username: val });
        if (res.ok) { toast('Ник обновлён'); loadProfile(); }
        else toast(res.status === 409 ? 'Ник занят' : 'Проверь формат ника');
        return;
      }
      if (act === 'password') {
        const cur = prompt('Текущий пароль:'); if (cur === null) return;
        const nw = prompt('Новый пароль (от 6 символов):'); if (!nw) return;
        const { res } = await apiAuth('/auth/change-password', 'POST', { current_password: cur, new_password: nw });
        toast(res.ok ? 'Пароль изменён' : 'Неверный текущий пароль');
        return;
      }
      if (act === 'delete') {
        if (!confirm('Удалить аккаунт навсегда? Это необратимо.')) return;
        const { res } = await apiAuth('/auth/account', 'DELETE');
        if (res.ok) { toast('Аккаунт удалён'); clearSession(); }
        return;
      }
    });
  });
```

Примечание: `prompt/confirm` — временный минимально-рабочий UX (замена на красивые
нижние шиты — отдельная косметическая задача, вне критического пути Фазы 1). Тосты
идут через существующий `#toast`.

- [ ] **Step 2: Проверить сборку**

Run: `cd web && npm run build`
Expected: `✔ built`.

- [ ] **Step 3: Полный прогон бэкенд-тестов (регресс)**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -v`
Expected: PASS всё.

- [ ] **Step 4: Коммит**

```bash
git add web/pages/app.vue
git commit -m "feat(web): действия профиля — смена ника/пароля, выход, удаление"
```

---

## Task 11: Прод-миграция и деплой

**Files:** нет новых — операционная задача.

- [ ] **Step 1: Прогнать Alembic на проде (Saturn Postgres)**

Один раз применить миграции к боевой базе. Из окружения бэкенда с боевым
`DATABASE_URL` (порт/креды Saturn-Postgres):

Run: `cd backend && ./.venv/Scripts/python.exe -m alembic upgrade head`
Expected: `Running upgrade -> 0001` (no-op, таблица есть), `0001 -> 0002` (добавлены
колонки, бэкфилл ников). Проверить: `GET /auth/me` у существующего тестового юзера
возвращает сгенерённый `username`.

Примечание: для прод-запуска Dockerfile бэкенда должен применять миграции при
старте — добавить в `backend/Dockerfile` перед CMD шаг
`RUN`→нет; правильнее энтрипойнт: заменить CMD на
`sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"`.

- [ ] **Step 2: Обновить CMD в Dockerfile (авто-миграции при старте)**

В `backend/Dockerfile` заменить строку `CMD [...]` на:

```dockerfile
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

- [ ] **Step 3: Коммит и пуш (авто-деплой Saturn подхватит)**

```bash
git add backend/Dockerfile
git commit -m "chore(deploy): применять alembic-миграции при старте бэкенда"
git push origin main
```

- [ ] **Step 4: Проверка на боевом**

После деплоя: зарегистрировать нового юзера через боевой лендинг, зайти в профиль
на `/app`, убедиться, что видны реальные `@ник`, почта, дата; смена ника/пароля,
выход и удаление работают (curl или через UI).

---

## Проверка плана против спеки

- Гейт верификации / жёсткий гейт — **Фаза 2** (в плане не реализуется; `email_verified` дефолт `true` в Фазе 1 — Task 2).
- Код+ссылка, Resend — **Фаза 2** (заготовка `EmailSender` — Task 7).
- Уникальный ник — Task 2 (модель), Task 4 (register+валидация), Task 6 (бэкфилл).
- Авто-связывание Google — **Фаза 3** (в способах входа «скоро» — Task 9).
- Профиль полный: реальные данные (Task 9), смена ника (Task 4/10), смена пароля
  (Task 4/10), выход (Task 10), выход везде (Task 3/4/10), удаление (Task 4/10).
  Аватар-загрузка — вне Фазы 1 (по решению; поле `avatar_url` заведено).
- Сессия JWT+localStorage, `token_version` — Task 3.
- Тесты httpx+SQLite — Task 1/4/5.
- Миграции Alembic + бэкфилл — Task 6; прод-применение — Task 11.

Открытые вопросы из спеки (домен, ключи Google, хранилище аватаров) — вне Фазы 1,
не блокируют этот план.
