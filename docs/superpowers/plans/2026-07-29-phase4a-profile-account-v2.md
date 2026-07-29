# Фаза 4A — Профиль/аккаунт v2 — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести профиль/аккаунт до продукта: загрузка аватара, внутренние модалки (ник/пароль), фикс привязки Google, реструктура профиля, вынос выхода в правый верх, лист настроек (звук/шрифт), навигация без редиректа после входа.

**Architecture:** Бэкенд FastAPI — единственное изменение: аватар (байты в Postgres, ресайз через Pillow). Остальное — фронт (Nuxt): `web/pages/index.vue` (навигация/вход), `web/pages/app.vue` + `web/assets/css/app.css` (профиль, модалки, лист настроек). Каждый кусок (модалки, лист настроек, блоки профиля) — самодостаточная единица (пользователь ожидает переделки).

**Tech Stack:** FastAPI, async SQLAlchemy, Alembic, Pillow, pytest; Nuxt 3, Web Audio, Canvas.

**Демо-данные:** уровень/XP/достижения/прогресс историй — UI на демо-данных (игровой бэкенд — домен Миши), не подключаем к БД.

---

## Файлы

Бэкенд:
- Modify `backend/app/models.py` — `avatar_data`, `avatar_updated_at`.
- Modify `backend/app/schemas.py` — `UserOut.has_avatar`, `UserOut.avatar_v`.
- Modify `backend/app/routers/auth.py` — `_user_out`, аватар-хелпер, эндпойнты аватара.
- Modify `backend/requirements.txt` — Pillow.
- Create `backend/alembic/versions/0004_avatar.py`.
- Modify `backend/tests/test_avatar.py` (Create) — тесты аватара.

Фронт:
- Modify `web/pages/index.vue` — вход без редиректа, залогиненная шапка (Миры/Профиль/Продолжить).
- Modify `web/pages/app.vue` — `?scr=`, реструктура профиля, модалки, Google-фикс, аватар, лист настроек.
- Modify `web/assets/css/app.css` — стили новых блоков (нейтральные).

---

## Task 1: Бэкенд — модель аватара + миграция 0004 + Pillow

**Files:** Modify `backend/app/models.py`, `backend/requirements.txt`; Create `backend/alembic/versions/0004_avatar.py`

- [ ] **Step 1: Pillow в requirements**

В конец `backend/requirements.txt`:
```
Pillow==11.1.0
```
Установить: `cd backend && ./.venv/Scripts/python.exe -m pip install Pillow==11.1.0`
Expected: успешно. (Если 11.1.0 недоступна — СТОП, BLOCKED.)

- [ ] **Step 2: колонки в модели User**

В `backend/app/models.py` добавить `LargeBinary` в импорт sqlalchemy (итог например:
`from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, LargeBinary, String, UniqueConstraint, func`)
и в класс `User` (после `avatar_url`) добавить:
```python
    avatar_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    avatar_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
```

- [ ] **Step 3: миграция 0004**

Create `backend/alembic/versions/0004_avatar.py`:
```python
"""avatar bytes

Revision ID: 0004
Revises: 0003
"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("avatar_data", sa.LargeBinary(), nullable=True))
        batch.add_column(sa.Column("avatar_updated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("avatar_updated_at")
        batch.drop_column("avatar_data")
```
(Сверь `down_revision` с фактической ревизией 0003 — должно быть `"0003"`.)

- [ ] **Step 4: проверить миграции на чистой SQLite**

Run (из backend): `rm -f _m.db && DATABASE_URL="sqlite+aiosqlite:///./_m.db" ./.venv/Scripts/python.exe -m alembic upgrade head 2>&1 | grep -E "Running upgrade"; rm -f _m.db`
Expected: строки про 0001→0002→0003→0004 без Traceback.

- [ ] **Step 5: Commit**
```bash
git add backend/app/models.py backend/requirements.txt backend/alembic/versions/0004_avatar.py
git commit -m "feat(db): аватар — avatar_data/avatar_updated_at + миграция 0004 + Pillow"
```

---

## Task 2: Бэкенд — эндпойнты аватара + схемы + тесты

**Files:** Modify `backend/app/schemas.py`, `backend/app/routers/auth.py`; Create `backend/tests/test_avatar.py`

- [ ] **Step 1: схемы — has_avatar/avatar_v в UserOut**

В `backend/app/schemas.py`, в класс `UserOut`, добавить поля:
```python
    has_avatar: bool = False
    avatar_v: int | None = None
```

- [ ] **Step 2: тесты аватара (сначала падают)**

Create `backend/tests/test_avatar.py`:
```python
import io
from PIL import Image
from tests.conftest import auth_headers, register


def _png_bytes(size=(64, 64), color=(120, 40, 200)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


def test_upload_get_delete_avatar(client, creds):
    data = register(client, creds)
    h = auth_headers(data["access_token"])
    # до загрузки — has_avatar false
    me = client.get("/auth/me", headers=h).json()
    assert me["has_avatar"] is False
    # загрузка
    r = client.post("/auth/avatar", headers=h,
                    files={"file": ("a.png", _png_bytes(), "image/png")})
    assert r.status_code == 200, r.text
    me2 = client.get("/auth/me", headers=h).json()
    assert me2["has_avatar"] is True and me2["avatar_v"]
    # публичный GET отдаёт webp
    g = client.get(f"/auth/avatar/{me2['id']}")
    assert g.status_code == 200 and g.headers["content-type"] == "image/webp"
    assert len(g.content) > 0
    # удаление
    assert client.delete("/auth/avatar", headers=h).status_code == 204
    assert client.get("/auth/me", headers=h).json()["has_avatar"] is False
    assert client.get(f"/auth/avatar/{me2['id']}").status_code == 404


def test_upload_not_an_image(client, creds):
    h = auth_headers(register(client, creds)["access_token"])
    r = client.post("/auth/avatar", headers=h,
                    files={"file": ("x.png", b"not-an-image", "image/png")})
    assert r.status_code == 400


def test_upload_requires_auth(client):
    r = client.post("/auth/avatar", files={"file": ("a.png", _png_bytes(), "image/png")})
    assert r.status_code == 401


def test_upload_too_large(client, creds):
    h = auth_headers(register(client, creds)["access_token"])
    big = b"\x89PNG\r\n\x1a\n" + b"0" * (3 * 1024 * 1024 + 10)
    r = client.post("/auth/avatar", headers=h,
                    files={"file": ("big.png", big, "image/png")})
    assert r.status_code == 400
```

- [ ] **Step 3: запустить — падают**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/test_avatar.py -q`
Expected: FAIL (404 на /auth/avatar, нет has_avatar).

- [ ] **Step 4: аватар-хелпер + эндпойнты + _user_out**

В `backend/app/routers/auth.py`:

(a) расширить импорты:
- `from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile, status` (добавить `File`, `Response`, `UploadFile` к тому, что есть)
- `from io import BytesIO`
- `from PIL import Image`
- `from datetime import datetime, timezone` (если ещё не импортированы в этом файле — добавь; сверь фактические импорты)

(b) в `_user_out(...)` добавить в `UserOut(...)` поля:
```python
        has_avatar=user.avatar_data is not None,
        avatar_v=int(user.avatar_updated_at.timestamp()) if user.avatar_updated_at else None,
```

(c) добавить хелпер и эндпойнты в конец файла:
```python
MAX_AVATAR_BYTES = 3 * 1024 * 1024
MAX_AVATAR_DIM = 6000


def _process_avatar(raw: bytes) -> bytes:
    """Валидирует картинку и возвращает webp 256x256 (квадрат, центр-кроп)."""
    if len(raw) > MAX_AVATAR_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Файл слишком большой (макс 3 МБ)")
    try:
        Image.open(BytesIO(raw)).verify()  # проверка целостности
        img = Image.open(BytesIO(raw))     # verify() «расходует» файл — открываем заново
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
```
ВАЖНО (безопасность): байты берём из БД, не из файловой системы; путь — только числовой `user_id`; выход — всегда webp, сгенерированный нами (EXIF/полезные нагрузки исходника не сохраняются).

- [ ] **Step 5: запустить весь набор**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q`
Expected: PASS всё (22 прежних + 4 новых аватар-теста = 26).

- [ ] **Step 6: Commit**
```bash
git add backend/app/schemas.py backend/app/routers/auth.py backend/tests/test_avatar.py
git commit -m "feat(auth): загрузка/отдача/удаление аватара (webp в Postgres, валидация)"
```

---

## Task 3: Фронт — вход без редиректа + залогиненная шапка + ?scr=

**Files:** Modify `web/pages/index.vue`, `web/pages/app.vue`

Прочитай `web/pages/index.vue`: функции `saveSession`, `go` (редирект на /app), `open`/закрытие модалки, обработчики входа/регистрации/Google (`onGoogleCredential`, `gNickSubmit`) и блок в `onMounted`, что обновляет шапку при наличии токена (добавлен ранее). Прочитай `web/pages/app.vue`: функцию `go(name)` (переключение экранов) и место инициализации на загрузке.

- [ ] **Step 1: index.vue — залогиненная шапка вынести в функцию + добавить «Миры»**

Найди в `onMounted` блок «если уже есть сессия — Войти→Профиль…». Вынеси его в функцию и добавь ссылку «Миры». Заменить существующий блок на:
```js
  function markLoggedInNav(){
    const loginLink = document.querySelector('.nav-links a[data-auth="login"]')
    if (loginLink) {
      loginLink.textContent = 'Профиль'; loginLink.setAttribute('href', '/app?scr=profile'); loginLink.removeAttribute('data-auth')
      if (!document.querySelector('.nav-links a[data-worlds]')) {
        const worlds = document.createElement('a'); worlds.textContent = 'Миры'; worlds.href = '/app?scr=packs'; worlds.setAttribute('data-worlds','1')
        loginLink.parentNode.insertBefore(worlds, loginLink)
      }
    }
    const startBtn = document.querySelector('.nav-links a.btn-solid')
    if (startBtn) { startBtn.textContent = 'Продолжить'; startBtn.setAttribute('href','/app') }
  }
  try { if (localStorage.getItem('fabula-token')) markLoggedInNav() } catch (e) {}
```

- [ ] **Step 2: index.vue — вход НЕ редиректит, а остаётся на лендинге**

Найди все места вида `saveSession(data); ... go();` (в обработчике формы входа/регистрации, в `onGoogleCredential`, в обработчике `gNickSubmit`). Замени `go()` на закрытие модалки + обновление шапки. Т.е. вместо `go();` — вызвать:
```js
  saveSession(data); markLoggedInNav(); ok('Готово! Открой «Профиль» или «Миры».'); closeAuth();
```
где `closeAuth()` — существующая функция закрытия модалки (если называется иначе, напр. снятие класса `on` с `.auth-modal`/`#auth`, используй фактическую). НЕ вызывай `go()` (редирект на /app) в этих ветках. Оставь `go()` только для кнопки «Начать/Продолжить» (обычная ссылка на /app — она и так работает).
Сверь имена: `saveSession`, `ok`, закрытие модалки — используй фактические из файла.

- [ ] **Step 3: app.vue — читать ?scr= при загрузке**

В `web/pages/app.vue`, в `onMounted` (после определения `go(name)` и навешивания nav-обработчиков, ~после строки `document.querySelectorAll('#nav a')...go(a.dataset.go)`), добавить:
```js
  try {
    const scr = new URLSearchParams(location.search).get('scr')
    if (scr && ['home','packs','profile'].includes(scr)) go(scr)
  } catch(e) {}
```

- [ ] **Step 4: сборка**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build`
Expected: `✨ built`.

- [ ] **Step 5: Commit**
```bash
git add web/pages/index.vue web/pages/app.vue
git commit -m "feat(web): вход остаётся на лендинге; шапка Миры/Профиль/Продолжить; app читает ?scr="
```

---

## Task 4: Фронт — реструктура профиля (правый верх, уровень/достижения, детальные истории) + убрать «вернуться на сайт»

**Files:** Modify `web/pages/app.vue`, `web/assets/css/app.css`

- [ ] **Step 1: разметка профиля**

В `web/pages/app.vue`, в `[data-scr="profile"]`:
(a) заменить строку appbar профиля на вариант с действиями справа:
```html
          <div class="appbar" style="position:sticky"><div class="ttl">Профиль</div>
            <div class="p-actions"><button class="p-act" data-act="logout" title="Выйти"><span class="g">🚪</span>Выйти</button><button class="p-act p-gear" data-act="open-settings" title="Настройки">⚙</button></div>
          </div>
```
(b) после блока `.p-top` (личность) вставить блок «Уровень и достижения» (демо):
```html
          <div class="list-h" style="margin-top:14px">Уровень и достижения</div>
          <div class="p-card p-lvl">
            <div class="lvl-top"><span>Уровень <b>7</b> · Хроникёр</span><span><b>1 840</b> / 2 800 XP</span></div>
            <div class="lvl-bar"><i style="width:64%"></i></div>
            <div class="ach">
              <div class="badge"><span class="ic">🗝</span><span class="bl">Первый выбор</span></div>
              <div class="badge"><span class="ic">⚔</span><span class="bl">10 битв</span></div>
              <div class="badge"><span class="ic">📖</span><span class="bl">5 глав</span></div>
              <div class="badge lock"><span class="ic">👑</span><span class="bl">Финал</span></div>
              <div class="badge lock"><span class="ic">✦</span><span class="bl">Секрет</span></div>
            </div>
          </div>
```
(c) заменить существующие две `.story-row` на детальный вариант (роль + активность). Найди блок «Активные истории» с двумя `.story-row` и замени содержимое строк, добавив `.meta` (сохрани `data-open`):
```html
          <div class="story-row" data-open="fant"><div class="th pv-fant"><img src="/assets/cover_fantasy.jpg" onerror="this.style.display='none'"></div>
            <div style="flex:1"><div class="st">Королевство Пепельных земель</div><div class="s-meta"><span>Глава 5 · 62%</span><span>Роль: Странник</span><span>2 дня назад</span></div><div class="sp"><i style="width:62%"></i></div></div></div>
          <div class="story-row" data-open="scifi"><div class="th pv-scifi"><img src="/assets/cover_scifi.png" onerror="this.style.display='none'"></div>
            <div style="flex:1"><div class="st">Станция «Кассандра»</div><div class="s-meta"><span>Глава 2 · 28%</span><span>Роль: Капитан</span><span>неделю назад</span></div><div class="sp"><i style="width:28%"></i></div></div></div>
```
(d) в карточке «Аккаунт» УБРАТЬ строку одиночного «Выйти» (`data-act="logout"`) — она теперь в правом верху. Оставить «Выйти со всех устройств».
(e) УБРАТЬ строку `<a ... href="/">Вернуться на сайт</a>` полностью.

- [ ] **Step 2: стили новых блоков (нейтральные)**

В `web/assets/css/app.css`, в конец (в блок нейтрального профиля со scope `.scr[data-scr="profile"]`), добавить:
```css
  .scr[data-scr="profile"] .p-actions{display:flex;gap:8px}
  .scr[data-scr="profile"] .p-act{display:flex;align-items:center;gap:7px;border:1px solid var(--shell-line);background:#ffffff06;
    color:var(--shell-dim);padding:8px 13px;border-radius:10px;font-family:'Forum',serif;font-size:13px;letter-spacing:.04em;cursor:pointer}
  .scr[data-scr="profile"] .p-act:hover{color:var(--shell-ink);background:#ffffff0e}
  .scr[data-scr="profile"] .p-act .g{color:inherit}
  .scr[data-scr="profile"] .p-gear{padding:8px 11px}
  .scr[data-scr="profile"] .p-lvl{padding:16px 18px}
  .scr[data-scr="profile"] .lvl-top{display:flex;justify-content:space-between;font-family:'Forum',serif;font-size:13px;color:var(--shell-dim)}
  .scr[data-scr="profile"] .lvl-top b{color:var(--shell-ink)}
  .scr[data-scr="profile"] .lvl-bar{height:8px;border-radius:100px;background:#000;margin-top:8px;overflow:hidden}
  .scr[data-scr="profile"] .lvl-bar i{display:block;height:100%;background:linear-gradient(90deg,#7a7a85,#eaeaee)}
  .scr[data-scr="profile"] .ach{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
  .scr[data-scr="profile"] .badge{display:flex;flex-direction:column;align-items:center;gap:4px;width:64px}
  .scr[data-scr="profile"] .badge .ic{width:44px;height:44px;border-radius:12px;background:#1a1a1e;border:1px solid var(--shell-line);display:grid;place-items:center;font-size:20px}
  .scr[data-scr="profile"] .badge .bl{font-family:'Forum',serif;font-size:9px;letter-spacing:.03em;color:var(--shell-mute);text-align:center;text-transform:uppercase}
  .scr[data-scr="profile"] .badge.lock .ic{opacity:.35}
  .scr[data-scr="profile"] .story-row .s-meta{display:flex;gap:14px;margin-top:4px;font-family:'Forum',serif;font-size:12px;color:var(--shell-mute)}
```

- [ ] **Step 3: сборка**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build`
Expected: `✨ built`.

- [ ] **Step 4: Commit**
```bash
git add web/pages/app.vue web/assets/css/app.css
git commit -m "feat(web): реструктура профиля — правый верх [Выйти][⚙], уровень/достижения, детальные истории"
```

---

## Task 5: Фронт — внутренние модалки ника и пароля (вместо prompt)

**Files:** Modify `web/pages/app.vue`, `web/assets/css/app.css`

- [ ] **Step 1: разметка модалки**

В `web/pages/app.vue`, перед закрывающим тегом контейнера приложения (рядом с `<div class="toast">`), добавить универсальную модалку:
```html
      <div class="pmodal" id="pmodal">
        <div class="pmodal-card">
          <div class="pmodal-h" id="pmTitle">Заголовок</div>
          <div id="pmBody"></div>
          <div class="pmodal-msg" id="pmMsg"></div>
          <div class="pmodal-btns"><button class="pmodal-cancel" id="pmCancel">Отмена</button><button class="pmodal-ok" id="pmOk">Сохранить</button></div>
        </div>
      </div>
```

- [ ] **Step 2: JS-хелпер модалки + обработчики ника/пароля**

В `onMounted` (после определения `toast`), добавить хелпер и переписать ветки `username`/`password`:
```js
  const pm = document.getElementById('pmodal');
  function openModal(title, bodyHtml, onOk){
    document.getElementById('pmTitle').textContent = title;
    document.getElementById('pmBody').innerHTML = bodyHtml;
    document.getElementById('pmMsg').textContent = '';
    pm.classList.add('on');
    const ok = document.getElementById('pmOk'), cancel = document.getElementById('pmCancel');
    const close = ()=>{ pm.classList.remove('on'); ok.onclick=null; cancel.onclick=null; };
    cancel.onclick = close;
    ok.onclick = async ()=>{ const keep = await onOk(document.getElementById('pmMsg')); if(!keep) close(); };
    const first = document.querySelector('#pmBody input'); if(first) first.focus();
  }
```
Затем заменить существующую ветку `if (act === 'username') { ... prompt ... }` на:
```js
      if (act === 'username') {
        const cur = (window.__fabulaUser && window.__fabulaUser.username) || '';
        openModal('Смена ника',
          `<label class="pm-l">Новый ник</label><input id="pmNick" value="${cur}" placeholder="3–20, латиница/цифры/_">`,
          async (msg)=>{
            const v = (document.getElementById('pmNick').value||'').trim();
            if(!/^[A-Za-z0-9_]{3,20}$/.test(v)){ msg.textContent='Ник: 3–20, латиница, цифры, _'; return true; }
            const { res } = await apiAuth('/auth/username','PATCH',{ username:v });
            if(res.ok){ toast('Ник обновлён'); loadProfile(); return false; }
            msg.textContent = res.status===409 ? 'Ник занят' : 'Проверь формат'; return true;
          });
        return;
      }
```
И ветку `if (act === 'password')` на:
```js
      if (act === 'password') {
        openModal('Смена пароля',
          `<label class="pm-l">Текущий пароль</label><input id="pmCur" type="password" autocomplete="current-password">`+
          `<label class="pm-l">Новый пароль (≥6)</label><input id="pmNew" type="password" autocomplete="new-password">`+
          `<label class="pm-l">Повтор нового</label><input id="pmRep" type="password" autocomplete="new-password">`,
          async (msg)=>{
            const cur=document.getElementById('pmCur').value, nw=document.getElementById('pmNew').value, rp=document.getElementById('pmRep').value;
            if(nw.length<6){ msg.textContent='Новый пароль от 6 символов'; return true; }
            if(nw!==rp){ msg.textContent='Пароли не совпадают'; return true; }
            const { res } = await apiAuth('/auth/change-password','POST',{ current_password:cur, new_password:nw });
            if(res.ok){ toast('Пароль изменён, войдите заново'); clearSession(); return false; }
            msg.textContent='Неверный текущий пароль'; return true;
          });
        return;
      }
```

- [ ] **Step 3: стили модалки**

В `web/assets/css/app.css` в конец добавить:
```css
  .pmodal{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;background:#000000c0;backdrop-filter:blur(4px)}
  .pmodal.on{display:flex}
  .pmodal-card{width:min(420px,92vw);background:#141416;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:22px}
  .pmodal-h{font-family:'Forum',serif;font-size:19px;letter-spacing:.06em;color:#fff;margin-bottom:14px}
  .pmodal .pm-l{display:block;font-family:'Forum',serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a92;margin:12px 0 6px}
  .pmodal input{width:100%;background:#0d0d0f;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px 14px;color:#eaeaee;font-family:'Cormorant Garamond',serif;font-size:16px}
  .pmodal input:focus{outline:none;border-color:rgba(255,255,255,.3)}
  .pmodal-msg{color:#d9655f;font-family:'Forum',serif;font-size:13px;min-height:18px;margin-top:10px}
  .pmodal-btns{display:flex;gap:10px;margin-top:12px;justify-content:flex-end}
  .pmodal-btns button{padding:10px 18px;border-radius:10px;font-family:'Forum',serif;font-size:14px;cursor:pointer;border:1px solid rgba(255,255,255,.14)}
  .pmodal-cancel{background:#ffffff08;color:#a2a2ab}
  .pmodal-ok{background:linear-gradient(180deg,#fff,#dcdce4);color:#141416;border-color:transparent}
```

- [ ] **Step 4: сборка + Commit**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build` → `✨ built`.
```bash
git add web/pages/app.vue web/assets/css/app.css
git commit -m "feat(web): внутренние модалки смены ника и пароля вместо prompt()"
```

---

## Task 6: Фронт — фикс привязки Google (кнопка в модалке вместо One Tap)

**Files:** Modify `web/pages/app.vue`

- [ ] **Step 1: переписать ветку привязки**

Найди ветку `if (act === 'google') { ... }`. Ветку ОТВЯЗКИ (`providers includes google` → DELETE) оставь. Ветку ПРИВЯЗКИ (сейчас `google.accounts.id.prompt()`) замени на открытие модалки с отрисованной Google-кнопкой:
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
        openModal('Привязать Google', `<div id="pmGoogleBtn" style="display:flex;justify-content:center;padding:6px 0"></div>`, async ()=>true);
        // спрятать стандартные кнопки Сохранить/Отмена оставляем — Отмена закрывает
        await new Promise((resolve)=>{ if(window.google&&window.google.accounts) return resolve(); const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true; s.onload=()=>resolve(); document.head.appendChild(s); });
        window.google.accounts.id.initialize({ client_id: clientId, callback: async (resp)=>{
          const { res } = await apiAuth('/auth/link/google','POST',{ id_token: resp.credential });
          document.getElementById('pmodal').classList.remove('on');
          if (res.status === 409) toast('Этот Google уже привязан к другому'); else if (res.ok) { toast('Google привязан'); loadProfile(); }
        }});
        const holder = document.getElementById('pmGoogleBtn');
        if (holder) window.google.accounts.id.renderButton(holder, { theme:'filled_black', size:'large', text:'continue_with', shape:'pill', width: 280 });
        return;
      }
```
Примечание: «Сохранить» в этой модалке не нужен — привязка происходит по клику на Google-кнопку. Скрой кнопку «Сохранить» когда тело содержит `#pmGoogleBtn`: в `openModal` добавь в начало `document.getElementById('pmOk').style.display = bodyHtml.includes('pmGoogleBtn') ? 'none' : '';` (и сбрасывай на `''` в остальных вызовах — т.е. по умолчанию видима).

- [ ] **Step 2: сборка + Commit**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build` → `✨ built`.
```bash
git add web/pages/app.vue
git commit -m "fix(web): привязка Google через кнопку в модалке (не One Tap, который молча подавлялся)"
```

---

## Task 7: Фронт — загрузка/удаление аватара

**Files:** Modify `web/pages/app.vue`

- [ ] **Step 1: сделать аватар кликабельным + input**

В разметке `.p-top` заменить `.avatar` на кликабельный с значком и скрытым input:
```html
            <div class="avatar" id="avaBtn" title="Загрузить фото"><img id="avaImg" src="/assets/avatar.jpg" onerror="this.style.display='none'"><span class="fb">♞</span><span class="ring"></span><span class="ava-cam">✎</span></div>
            <input type="file" id="avaFile" accept="image/*" style="display:none">
```

- [ ] **Step 2: JS — кроп на canvas + загрузка**

В `onMounted` (после `loadProfile()`), добавить:
```js
  const avaBtn=document.getElementById('avaBtn'), avaFile=document.getElementById('avaFile');
  if(avaBtn&&avaFile){
    avaBtn.addEventListener('click', ()=>avaFile.click());
    avaFile.addEventListener('change', async ()=>{
      const f=avaFile.files&&avaFile.files[0]; if(!f) return;
      if(f.size>3*1024*1024){ toast('Файл больше 3 МБ'); return; }
      const img=new Image(); img.onload=async ()=>{
        const s=Math.min(img.width,img.height), c=document.createElement('canvas'); c.width=256; c.height=256;
        c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,256,256);
        c.toBlob(async (blob)=>{
          const fd=new FormData(); fd.append('file', blob, 'avatar.webp');
          const { res, data } = await apiAuth('/auth/avatar','POST',fd);
          if(res.ok){ toast('Аватар обновлён'); const id=(window.__fabulaUser||{}).id; const el=document.getElementById('avaImg'); if(el&&id){ el.style.display=''; el.src='/auth/avatar/'+id+'?v='+((data&&data.v)||Date.now()); } }
          else toast('Не удалось загрузить');
        }, 'image/webp', 0.9);
      };
      img.src=URL.createObjectURL(f);
    });
  }
```
ВАЖНО: проверь, что `apiAuth` умеет слать `FormData` (не форсит `Content-Type: application/json` и не `JSON.stringify` тело). Если `apiAuth` всегда ставит json-заголовок — добавь в него ветку: если body — `FormData`, не ставить `Content-Type` и не сериализовать. Сверь реализацию `apiAuth` и при необходимости поправь минимально.

- [ ] **Step 3: загрузка аватара в loadProfile (если есть свой)**

В функции `loadProfile()`, после получения `data`, добавить установку аватара:
```js
    const av=document.getElementById('avaImg');
    if(av && data.has_avatar){ av.style.display=''; av.src='/auth/avatar/'+data.id+'?v='+(data.avatar_v||''); }
```

- [ ] **Step 4: стиль значка камеры**

В `web/assets/css/app.css` (scope профиля) добавить:
```css
  .scr[data-scr="profile"] .avatar{cursor:pointer}
  .scr[data-scr="profile"] .ava-cam{position:absolute;right:-2px;bottom:-2px;width:30px;height:30px;border-radius:50%;background:#1a1a1e;border:1px solid var(--shell-line);display:grid;place-items:center;font-size:13px;color:var(--shell-ink)}
```

- [ ] **Step 5: сборка + Commit**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build` → `✨ built`.
```bash
git add web/pages/app.vue web/assets/css/app.css
git commit -m "feat(web): загрузка аватара (кроп на canvas → webp → POST /auth/avatar)"
```

---

## Task 8: Фронт — лист «Настройки» за шестерёнкой (звук, размер шрифта, подписка)

**Files:** Modify `web/pages/app.vue`, `web/assets/css/app.css`

- [ ] **Step 1: разметка листа настроек**

В `web/pages/app.vue`, рядом с `#pmodal`, добавить лист:
```html
      <div class="sheet2" id="settingsSheet">
        <div class="sheet2-card">
          <div class="sheet2-h">Настройки <button class="sheet2-x" id="setClose">✕</button></div>
          <div class="set-grp"><div class="set-lh">Звук и музыка</div>
            <label class="set-tog"><span>Общий звук</span><input type="checkbox" id="sndMaster"></label>
            <label class="set-tog"><span>Музыка / эмбиент</span><input type="checkbox" id="sndMusic"></label>
            <label class="set-tog"><span>Эффекты (клики)</span><input type="checkbox" id="sndSfx"></label>
          </div>
          <div class="set-grp"><div class="set-lh">Оформление</div>
            <div class="set-seg" id="fontSeg"><button data-fs="s">S</button><button data-fs="m">M</button><button data-fs="l">L</button></div>
            <div class="set-hint">Размер шрифта в чтении</div>
          </div>
          <div class="set-grp"><div class="set-lh">Подписка</div>
            <div class="set-row-soon"><span>Подписка и грейды</span><span class="soon">Скоро</span></div>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: JS — открытие листа + тумблеры + размер шрифта**

В `onMounted`, добавить (обработчик `open-settings` уже сработает через делегирование `[data-act]`, но лист открываем отдельно — добавь в делегированный обработчик ветку, ЛИБО повесь прямой слушатель на `.p-gear`):
```js
  // открытие листа настроек
  const setSheet=document.getElementById('settingsSheet');
  document.querySelectorAll('[data-act="open-settings"]').forEach(b=>b.addEventListener('click',()=>setSheet.classList.add('on')));
  const setClose=document.getElementById('setClose'); if(setClose) setClose.addEventListener('click',()=>setSheet.classList.remove('on'));
  // звук
  const snd={ master:document.getElementById('sndMaster'), music:document.getElementById('sndMusic'), sfx:document.getElementById('sndSfx') };
  const sndGet=(k)=>localStorage.getItem('fabula-snd-'+k)!=='off';
  function applySound(){
    if(master) master.gain.value = sndGet('master') ? 0.9 : 0;
    if(ambGain) ambGain.gain.value = (sndGet('master')&&sndGet('music')) ? ambGain.gain.value||0.2 : 0;
    window.__fabulaSfxOff = !(sndGet('master')&&sndGet('sfx'));
  }
  Object.entries(snd).forEach(([k,el])=>{ if(!el) return; el.checked=sndGet(k); el.addEventListener('change',()=>{ localStorage.setItem('fabula-snd-'+k, el.checked?'on':'off'); applySound(); }); });
  applySound();
  // размер шрифта
  const fsSeg=document.getElementById('fontSeg');
  function applyFont(){ const fs=localStorage.getItem('fabula-fontsize')||'m'; document.documentElement.style.setProperty('--read-fs', fs==='s'?'16px':fs==='l'?'21px':'18px'); if(fsSeg) fsSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.fs===fs)); }
  if(fsSeg) fsSeg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ localStorage.setItem('fabula-fontsize', b.dataset.fs); applyFont(); }));
  applyFont();
```
ВАЖНО: сверь имена `master`, `ambGain` (объявлены в блоке SOUND, Web Audio). Если `applySound` вызывается до инициализации аудио (`AC` может быть null), оберни присвоения в проверки (`if(master)`), как выше. Для sfx — в существующих функциях воспроизведения кликов (`sfxClick` и т.п.) в начале добавь `if(window.__fabulaSfxOff) return;`.

- [ ] **Step 3: применить размер шрифта в чтении**

В `web/assets/css/app.css` найди правила размера текста страницы чтения (`.page p`, `.choice` и т.п.) и добавь использование переменной там, где уместно — минимально: в `.page p{...}` заменить `font-size:18px` на `font-size:var(--read-fs,18px)`. (Сверь фактическое правило; если размер задан иначе — примени переменную к основному тексту чтения.)

- [ ] **Step 4: стили листа**

В `web/assets/css/app.css` в конец добавить:
```css
  .sheet2{position:fixed;inset:0;z-index:190;display:none;align-items:center;justify-content:center;background:#000000c0;backdrop-filter:blur(4px)}
  .sheet2.on{display:flex}
  .sheet2-card{width:min(440px,94vw);max-height:86vh;overflow:auto;background:#141416;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:20px}
  .sheet2-h{display:flex;justify-content:space-between;align-items:center;font-family:'Forum',serif;font-size:19px;letter-spacing:.06em;color:#fff;margin-bottom:6px}
  .sheet2-x{background:none;border:none;color:#8a8a92;font-size:18px;cursor:pointer}
  .set-grp{margin-top:16px}
  .set-lh{font-family:'Forum',serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6d6d78;margin-bottom:8px}
  .set-tog{display:flex;align-items:center;justify-content:space-between;padding:12px 2px;border-bottom:1px solid rgba(255,255,255,.07);font-family:'Forum',serif;font-size:15px;color:#eaeaee}
  .set-tog input{width:20px;height:20px;accent-color:#eaeaee}
  .set-seg{display:inline-flex;border:1px solid rgba(255,255,255,.14);border-radius:10px;overflow:hidden}
  .set-seg button{padding:9px 20px;background:#0000;color:#a2a2ab;border:none;border-right:1px solid rgba(255,255,255,.14);font-family:'Forum',serif;cursor:pointer}
  .set-seg button:last-child{border-right:none}
  .set-seg button.on{background:#ffffff14;color:#fff}
  .set-hint{font-family:'Forum',serif;font-size:12px;color:#6d6d78;margin-top:8px}
  .set-row-soon{display:flex;justify-content:space-between;padding:12px 2px;font-family:'Forum',serif;font-size:15px;color:#eaeaee}
  .set-row-soon .soon{color:#6d6d78}
```

- [ ] **Step 5: сборка + Commit**

Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build` → `✨ built`.
```bash
git add web/pages/app.vue web/assets/css/app.css
git commit -m "feat(web): лист «Настройки» за ⚙ — тумблеры звука, размер шрифта, подписка «Скоро»"
```

---

## Task 9: Деплой (авто по main)

**Files:** нет — операционная задача.

- [ ] **Step 1: полный регресс перед мержем**

Run: `cd backend && PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest tests/ -q` → 26 passed.
Run: `cd web && export PATH="/c/Program Files/nodejs:$PATH" && npm run build` → `✨ built`.

- [ ] **Step 2: мерж в main + пуш**

Слить ветку 4A в `main`, запушить. Saturn авто-деплой: backend применит миграцию 0004 при старте (`alembic upgrade head`), Pillow добавится в образ из requirements. Web пересоберётся.

- [ ] **Step 3: проверка на проде**

Залогинен: загрузка аватара (виден после ресайза), модалки ника/пароля (внутренние, не браузерные), привязка Google (кнопка в модалке появляется), отвязка, выход из правого верха, лист настроек (тумблеры звука, размер шрифта), навигация (после входа остаёмся на лендинге; Миры→app-паки, Профиль→app-профиль).

---

## Проверка плана против спеки

- Аватар: модель+миграция (Task 1), эндпойнты+валидация+тесты (Task 2), UI загрузки (Task 7). ✓
- Вход без редиректа + шапка Миры/Профиль/Продолжить + ?scr= — Task 3. ✓
- Убрать «вернуться на сайт» — Task 4 (e). ✓
- Реструктура профиля (правый верх [Выйти][⚙], уровень/достижения, детальные истории) — Task 4. ✓
- Модалки ника/пароля вместо prompt — Task 5. ✓
- Фикс Google-привязки (renderButton в модалке) — Task 6. ✓
- Лист настроек: звук-тумблеры, размер шрифта S/M/L, подписка «Скоро» — Task 8. ✓
- Безопасность аватара (verify+перекодирование webp, лимиты, auth) — Task 2. ✓
- Демо-данные уровня/историй — UI-only (Task 4). ✓
- Вне 4A (устройства/оплата/email-код) — не в плане. ✓
- Каждый кусок независим (модалки/лист/блоки профиля — отдельные задачи). ✓
