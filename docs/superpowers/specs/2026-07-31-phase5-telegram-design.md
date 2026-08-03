# Фаза 5 — Вход через Telegram — дизайн

Дата: 2026-07-31

## Цель

Добавить вход/регистрацию через Telegram к существующей системе аккаунтов (Фазы 1–4
выкатаны: email/пароль, Google OAuth, профиль, сессии). Основное — вход на сайте
(Login Widget, popup-callback). Дополнительно — экспериментальный вход внутри Telegram
как Mini App. Бэкенд FastAPI (`backend/`), фронт Nuxt (`web/`, приложение
`web/pages/app.vue`, лендинг `web/pages/index.vue`).

Бот уже создан (id `8806966365`). Домен появится позже — до `/setdomain` в BotFather
живой вход виджета не работает, но бэкенд и тесты HMAC-проверки делаем сразу.

## Принятые решения (брейншторм)

- **Метод:** Login Widget в режиме popup-callback через `Telegram.Login.auth({bot_id,
  request_access}, cb)` — сохраняет нашу стилизованную кнопку, использует публичный
  `bot_id`. НЕ redirect, НЕ навязанный Telegram-виджет.
- **Нет email от Telegram** → авто-связывания по почте нет. TG-аккаунт создаётся без
  email и без пароля.
- **Новый юзер:** обязательный экран «придумай ник» (двухшаговый флоу, как у Google) —
  юзер не создаётся, пока не введён ник. Ник предзаполняется из Telegram `username`.
- **Две связки аккаунтов:** (а) привязать Telegram к существующему аккаунту — через
  профиль (Bearer); (б) создать аккаунт по TG. Авто-слияния двух существующих
  аккаунтов нет; коллизия → 409.
- **«Привязать почту» к TG-аккаунту — ОТЛОЖЕНО** (упирается в почтовый сервис, которого
  нет). Следствие: TG-only аккаунт в Фазе 5 остаётся чисто телеграмным, без
  альтернативного входа/восстановления. `/auth/add-email` не делаем.
- **Mini App** — экспериментально, минимально, за фичефлагом; не мешает веб-входу.

## Модель данных

Переиспользуем существующую таблицу `oauth_accounts` (из Фазы 3):
- `provider='telegram'`, `provider_user_id = <telegram id>` (строкой).
- UNIQUE(`provider`, `provider_user_id`) уже есть; индекс по `user_id` есть; ON DELETE
  CASCADE есть. **Новых таблиц не требуется.**

**Миграция 0006 (Alembic, async batch как в прошлых фазах): `users.email` → nullable.**
- Причина: TG-аккаунт создаётся с `email = NULL`.
- Уникальность `email` сохраняется, но допускает несколько `NULL` (Postgres и SQLite
  так работают по умолчанию — партиальная/стандартная UNIQUE не считает NULL равными).
- `username` остаётся NOT NULL и уникальным (ник обязателен всегда).

`users` в остальном не меняется (`password_hash` уже nullable с Фазы 1,
`email_verified`, `username`, `token_version`).

## Проверка подписи Telegram

Новый модуль `app/telegram_auth.py`, **внедряемый как зависимость** (подменяется в
тестах, как `google_auth.py`).

**Login Widget (данные от popup-callback):**
1. `data_check_string` — все пришедшие поля кроме `hash`, вида `key=value`,
   отсортированные по ключу, соединённые через `\n`.
2. `secret_key = SHA256(bot_token)` (сырые байты).
3. Сверяем `HMAC_SHA256(data_check_string, secret_key)` (hex) с `hash` в
   **constant-time** (`hmac.compare_digest`).
4. Антиреплей: реджект, если `now - auth_date > TELEGRAM_AUTH_TTL` (по умолчанию ~24 ч).

**Mini App (`initData`):**
1. Парсим `initData` (query-string). `hash` отдельно; остальные пары →
   `data_check_string` (сортировка по ключу, `\n`).
2. `secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)`.
3. Сверяем `HMAC_SHA256(data_check_string, secret_key)` с `hash` constant-time.
4. Антиреплей по `auth_date` (порог короче, конфигурируемо).

Точные формулы и порядок закрепляем юнит-тестами на документированных векторах
Telegram. **Все поля берём из проверенных данных, никогда из тела запроса на доверии.**

## Эндпойнты и флоу

**`POST /auth/telegram`** {поля виджета: id, first_name, …, auth_date, hash} —
вход/регистрация:
1. Проверяем подпись + `auth_date`. Извлекаем `tg_id`, `tg_username`.
2. `oauth_accounts(telegram, tg_id)` есть → грузим юзера → `TokenOut` (сессия). Возврат.
3. Нет → **не создаём**. Возвращаем `{needs_username: true, registration_token}` (200,
   без сессии). `registration_token` — наш JWT `{tg_id, tg_username,
   purpose:"telegram_register", exp≈10 мин}`. Отдаём только в теле.

**`POST /auth/telegram/complete`** {registration_token, username} — финал регистрации:
- Проверяем `registration_token` (подпись, `purpose=="telegram_register"`, не истёк).
- Валидируем ник (`^[A-Za-z0-9_]{3,20}$` + уникальность).
- Гонка: если `oauth_accounts(telegram, tg_id)` появился — повторный вход (сессия);
  ник занят — 409/422. Иначе создаём `User(email=NULL, username,
  password_hash=NULL, email_verified=False)` + `oauth_accounts(telegram, tg_id)` в
  одной транзакции.
- `TokenOut` (сессия).

**`POST /auth/link/telegram`** (Bearer) {поля виджета} — привязать к текущему аккаунту:
- Проверяем подпись → `tg_id`. Если `oauth_accounts(telegram, tg_id)` уже у **другого**
  юзера → 409. У текущего → идемпотентно ок. Иначе создаём.

**`DELETE /auth/link/telegram`** (Bearer) — отвязать:
- Разрешаем только если остаётся другой способ входа: `password_hash is not None`
  **или** есть другой провайдер (google). Иначе 400. Удаляем `oauth_accounts(telegram)`
  текущего юзера.

**`GET /auth/me`** — в `providers` добавляется `'telegram'`, если есть
`oauth_accounts(telegram)`.

**Mini App (эксперимент):** отдельная ручка `POST /auth/telegram/miniapp` {init_data} →
верификация Mini-App-формулой → далее та же логика (существующий tg_id → сессия; новый →
needs_username). За фичефлагом. (Отдельная ручка, а не флаг на `/auth/telegram`, — чтобы
не смешивать две разные формулы проверки подписи.)

## Безопасность (модель угроз и меры)

1. **Проверка подписи только на бэке**, constant-time; `auth_date` обязателен
   (антиреплей). Никогда не доверяем полям из тела — берём из проверенных данных.
2. **Bot-токен — секрет:** только env бэка (`TELEGRAM_BOT_TOKEN`), не во фронт, не в
   git, не в логи. В `.env.example` — плейсхолдер. При компрометации — `/revoke` в
   BotFather.
3. **`registration_token` ≠ access-токен:** несёт `purpose:"telegram_register"`, НЕ
   несёт `ver` → `get_current_user` его отвергает. `/complete` требует именно этот
   `purpose`. TTL ~10 мин, подпись `JWT_SECRET`, только в теле ответа.
4. **Привязка от угона:** `link` отклоняет, если `tg_id` уже у другого юзера (409).
   **От локаута:** `unlink` только при наличии другого способа входа.
5. **Домен в BotFather** (`/setdomain`) ограничивает, кто может инициировать вход этим
   ботом на вебе (аналог Authorized JS origins у Google).
6. **Логи:** данные входа, `hash`, `initData`, `registration_token`, access-токены не
   логируем.
7. **Rate-limit:** добавляем `/auth/telegram`, `/auth/telegram/complete`,
   `/auth/link/telegram`, `/auth/telegram/miniapp` в существующий лимитер
   (`app/ratelimit.py`).
8. **Транзакционность:** создание `User`+`oauth_accounts` — одна транзакция; UNIQUE
   (`username`, `provider+provider_user_id`) ловят гонки → `IntegrityError` → 409.
9. **Каскад:** удаление юзера удаляет его `oauth_accounts` (ON DELETE CASCADE).

## Фронт

**Вход (лендинг, модалка) — `web/pages/index.vue`:**
- Подключаем `https://telegram.org/js/telegram-widget.js`. На существующей кнопке
  «Продолжить с Telegram» — `Telegram.Login.auth({bot_id: <BOT_ID>,
  request_access:'write'}, onTelegramAuth)`.
- `onTelegramAuth(user)` → `POST /auth/telegram`:
  - сессия → токен в localStorage → `/app`;
  - `needs_username` → `registration_token` в память → экран «Придумай ник»
    (переиспользуем Google-экран Фазы 3, предзаполнен из `tg_username`) →
    `POST /auth/telegram/complete` → токен → `/app`.
- Отмена/ошибка → «Вход через Telegram отменён», остаёмся в модалке.

**Профиль (`web/pages/app.vue`):** строка «Telegram» рядом с Google:
- не привязан → «Привязать» → `Telegram.Login.auth` → `POST /auth/link/telegram` →
  рефреш `/auth/me`;
- привязан → «Отвязать» → если разрешено (есть др. способ входа):
  `DELETE /auth/link/telegram`; иначе подсказка, что нужен другой способ входа.

**Mini App (эксперимент):** точка входа, открываемая внутри Telegram; на загрузке
`window.Telegram.WebApp.initData` → `POST /auth/telegram/miniapp` → сессия. За
фичефлагом, отдельно от основного веб-входа.

## Конфиг

- `TELEGRAM_BOT_TOKEN`: env бэка (Saturn Variables). Локально — `backend/.env`
  (в `.gitignore`); `.env.example` — плейсхолдер.
- `BOT_ID` (`8806966365`, публичный): `runtimeConfig.public.telegramBotId` в Nuxt.
- `TELEGRAM_AUTH_TTL`: порог свежести `auth_date` (по умолчанию 86400 c).
- Фичефлаг Mini App (env/публичный конфиг).
- BotFather: `/setdomain` (когда появится домен), Web App URL / Menu Button (для
  эксперимента Mini App).

## Тестирование (pytest + SQLite, как Фазы 1/3)

`telegram_auth` — внедряемая зависимость; в тестах подменяем на фейк или считаем
реальный HMAC с тестовым токеном. Кейсы:
- новый юзер: `/auth/telegram` → `needs_username`+`registration_token`;
  `/auth/telegram/complete` → создан (`providers==['telegram']`, `email` NULL,
  `password_hash` NULL);
- повторный вход тем же `tg_id` → та же учётка, сессия;
- битый `hash` → 401; протухший `auth_date` → 401;
- `complete` с занятым ником → 409/422; с битым/истёкшим `registration_token` → 401;
- `registration_token` не работает как access-токен (на `/auth/me` → 401);
- `link`: привязка к текущему; `tg_id` уже у другого → 409;
- `unlink`: TG-only (нет другого способа входа) → 400; есть google/пароль → 204,
  `providers` теряет telegram;
- Mini App: валидный `init_data` → сессия; битый → 401.

## Открытые вопросы / вне Фазы 5

- **«Привязать почту» к TG-аккаунту** (`/auth/add-email` + верификация) — отложено до
  появления почтового сервиса (отдельная будущая фаза).
- **Домен** и `/setdomain` в BotFather — Ильнар сделает, когда появится домен; до этого
  живой веб-вход виджета не тестируется (только бэкенд/юнит-тесты).
- **Bot-username** — нужен только если позже захотим «родной» Telegram-виджет; при
  popup-подходе не требуется.
- **Mini App** — экспериментальный минимум; полноценный UI под Telegram — на будущее.
