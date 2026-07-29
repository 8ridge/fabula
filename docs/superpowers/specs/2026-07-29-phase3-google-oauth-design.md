# Фаза 3 — Вход через Google (OAuth) — дизайн

Дата: 2026-07-29

## Цель

Добавить вход/регистрацию через Google к существующей системе аккаунтов (Фаза 1
выкатана). Домен не нужен — используем Google Identity Services (GIS) с ID-токеном.
Бэкенд FastAPI (`backend/`), фронт Nuxt (`web/`, приложение `web/pages/app.vue`,
лендинг `web/pages/index.vue` + статик-зеркало `index.html`).

## Принятые решения (брейншторм)

- **Механизм:** GIS ID-token flow. Фронт получает ID-токен от Google → шлёт на бэк →
  бэк проверяет → выдаёт наш JWT (как email-вход). Без redirect, без `client_secret`.
- **Новый юзер:** обязательный экран «придумай ник». Двухшаговый флоу — юзер НЕ
  создаётся, пока ник не введён (нет мусорных аккаунтов).
- **Авто-связывание:** Google с подтверждённой почтой, совпадающей с существующим
  аккаунтом, привязывается к нему (без дублей).
- **Отвязка Google:** только если есть другой способ входа (пароль).

## Модель данных

Новая таблица `oauth_accounts` (миграция Alembic 0003, async batch как в Фазе 1):
- `id` PK
- `user_id` FK → `users.id`, **ON DELETE CASCADE**
- `provider` String ('google')
- `provider_user_id` String (Google `sub` — стабильный id пользователя)
- `created_at`
- **UNIQUE (`provider`, `provider_user_id`)** + индекс по `user_id`.

`users` не меняется (в Фазе 1 уже `password_hash` nullable, `email_verified`,
`username`, `token_version`).

## Проверка Google ID-токена

Библиотека `google-auth` (pip). Функция-проверялка, **внедряемая как зависимость**
(чтобы подменять в тестах):

```
google.oauth2.id_token.verify_oauth2_token(token, google.auth.transport.requests.Request(), GOOGLE_CLIENT_ID)
```

Проверяет: подпись (Google JWKS), `iss` ∈ {accounts.google.com,
https://accounts.google.com}, `aud` == `GOOGLE_CLIENT_ID`, `exp`. Возвращает claims:
`sub`, `email`, `email_verified`, `name`. Вызов синхронный (requests) — выполняем в
threadpool (FastAPI сам гоняет sync-зависимости в пуле, либо `run_in_executor`).

## Эндпойнты и флоу

**`POST /auth/google`** {id_token} — вход/регистрация:
1. Проверяем токен → `sub`, `email`, `email_verified`. **Из токена, не из тела.**
2. `oauth_accounts(google, sub)` есть → грузим юзера → `TokenOut` (сессия). Возврат.
3. Нет → `users` по `email`:
   - есть **и** `email_verified==true` от Google → **авто-связывание** (пишем
     `oauth_accounts`), `TokenOut`.
   - есть, но Google-почта **не** подтверждена → 400 (не связываем без доказательства
     владения; просим войти паролем и привязать в профиле).
4. Нет юзера → **не создаём**. Возвращаем `{needs_username: true, registration_token}`
   (200, без сессии). `registration_token` — наш подписанный JWT: `{sub, email,
   purpose:"google_register", exp≈10 мин}`.

**`POST /auth/google/complete`** {registration_token, username} — финал новой регистрации:
- Проверяем `registration_token` (наш JWT): подпись, `purpose=="google_register"`,
  не истёк. Достаём `sub`, `email`.
- Валидируем ник (формат + уникальность).
- Гонка: если за это время `oauth_accounts(google, sub)` или `users.email` появились
  — обрабатываем (409/повторный вход). Иначе создаём `User(email, username,
  password_hash=NULL, email_verified=True)` + `oauth_accounts` в одной транзакции.
- `TokenOut` (сессия).

**`POST /auth/link/google`** {id_token} (Bearer) — привязать Google к текущему аккаунту:
- Проверяем токен → `sub`. Если `oauth_accounts(google, sub)` уже есть у **другого**
  юзера → 409 (защита от угона). Если у текущего — идемпотентно ок. Иначе создаём.

**`DELETE /auth/link/google`** (Bearer) — отвязать:
- Требуем `password_hash is not None` (иначе 400 «сначала добавь пароль»). Удаляем
  `oauth_accounts(google)` текущего юзера.

**`GET /auth/me`** — в `providers` добавляется `'google'`, если есть `oauth_accounts`.
«Добавить пароль» (Google-only) — переиспользуем существующий
`POST /auth/change-password` (уже умеет ставить пароль без текущего при `password_hash=NULL`).

## Безопасность (модель угроз и меры)

1. **Проверка токена только на бэке.** Никогда не доверяем `email`/`sub` из тела
   запроса — берём из проверенного ID-токена. `aud`==наш `client_id` (отсекает
   токены, выписанные другому приложению), `iss` и `exp` обязательны.
2. **Авто-связывание строго при `email_verified==true`** от Google (доказательство
   владения почтой). Иначе — не связываем.
3. **`registration_token` ≠ access-токен.** Несёт `purpose:"google_register"`, НЕ
   несёт `ver` → `get_current_user` (требует `ver`) его отвергает. `/complete`
   требует именно `purpose=="google_register"`. TTL ~10 мин, подпись нашим
   `JWT_SECRET`. Отдаём только в теле ответа — не в URL, не в логах.
4. **Защита привязки от угона:** `link` отклоняет, если Google-`sub` уже привязан к
   другому юзеру. **Защита от локаута:** `unlink` только при наличии пароля.
5. **Секреты:** `GOOGLE_CLIENT_ID` публичный — можно на фронте и в env бэка.
   **`client_secret` НЕ используется** (GIS ID-token). В Google Cloud — только
   Authorized JavaScript origins (наш web-домен + localhost), что ограничивает, кто
   может инициировать вход этим client_id.
6. **Логи:** ID-токены, `registration_token`, access-токены НЕ логируем (ни в
   plaintext, ни в отладке). В логах — только несекретные идентификаторы.
7. **Транспорт/CORS:** всё по HTTPS (Saturn). CORS уже ограничен нашим web-origin;
   `/auth/google*` вызываются кросс-доменно (web→backend) — разрешено настроенным
   CORS. `GOOGLE_CLIENT_ID` в CORS-ответах не участвует.
8. **Rate-limit (в объёме Фазы 3):** лёгкий in-memory лимитер (напр. `slowapi`) на
   чувствительные ручки — `/auth/google`, `/auth/google/complete`,
   `/auth/link/google`, а также существующие `/auth/login`, `/auth/register` —
   антибрутфорс/антиспам. Для одного инстанса на Saturn in-memory достаточно.
9. **Транзакционность:** создание `User`+`oauth_accounts` — в одной транзакции;
   уникальные ограничения (`email`, `username`, `provider+sub`) ловят гонки на уровне
   БД (обрабатываем `IntegrityError` → 409).
10. **Каскад:** удаление юзера удаляет его `oauth_accounts` (ON DELETE CASCADE).
11. **Реплей ID-токена** (defense-in-depth): токен короткоживущий и aud/exp/подпись
    проверяются; кража в полёте закрыта HTTPS. Одноразовый серверный nonce —
    возможное усиление на будущее (требует серверного состояния), в Фазу 3 не берём.

## Фронт

**Вход (лендинг, модалка):**
- Подключаем GIS-скрипт `https://accounts.google.com/gsi/client`, init с
  `GOOGLE_CLIENT_ID`. Рендерим **официальную кнопку Google** (бренд-гайдлайны) в
  модалке (заменяет текущую кастомную «Продолжить с Google»).
- Callback с ID-токеном → `POST /auth/google`:
  - сессия → токен в localStorage → `/app`;
  - `needs_username` → держим `registration_token` в памяти → **экран «Придумай ник»**
    (инпут + валидация `^[A-Za-z0-9_]{3,20}$`) → `POST /auth/google/complete` → токен
    → `/app`.
- Отмена/ошибка Google → «Вход через Google отменён», остаёмся в модалке.

**Профиль (`app.vue`, строка Google «скоро»):**
- Не привязан → «Привязать» → GIS → `POST /auth/link/google` → рефреш `/auth/me`.
- Привязан → «Отвязать» → если пароль есть: `DELETE /auth/link/google`; нет пароля →
  предложить «Добавить пароль» (`change-password`).

**Telegram-кнопка** на лендинге остаётся «скоро» (вне Фазы 3).

## Конфиг

- `GOOGLE_CLIENT_ID`: env бэка (Saturn Variables) **и** рантайм-конфиг Nuxt
  (`runtimeConfig.public.googleClientId`), т.к. публичный.
- Google Cloud OAuth client (Web): Authorized JavaScript origins =
  `https://dungeon20-km8sy7.saturn.ac`, `http://localhost:3000`, `http://localhost:8090`.
  Redirect URI не требуется.
- Бэк: зависимость `google-auth` в `requirements.txt`.

## Тестирование (pytest + SQLite, как Фаза 1)

Проверялка Google-токена — внедряемая зависимость; в тестах подменяем на фейк,
возвращающий заданные `{sub, email, email_verified}`. Кейсы:
- новый юзер: `/auth/google`→`needs_username`+`registration_token`;
  `/auth/google/complete`→создан юзер (`providers==['google']`, `password_hash` NULL);
- авто-связывание: есть email/password-юзер, Google с тем же verified email →
  `/auth/google` привязывает и логинит (без дубля, `providers` содержит и email, и google);
- повторный вход: второй `/auth/google` тем же `sub` → та же учётка, сессия;
- `email_verified=false` от Google при существующем email → 400;
- `complete` с занятым ником → 409/422; с истёкшим/битым `registration_token` → 401;
- `registration_token` НЕ работает как access-токен (на `/auth/me` → 401);
- `link`: привязка к текущему; `sub` уже у другого → 409;
- `unlink`: без пароля → 400; с паролем → 204, `providers` теряет google.

## Открытые вопросы / вне Фазы 3

- `GOOGLE_CLIENT_ID`/OAuth-клиент создаёт Ильнар в Google Cloud (Testing-режим ок).
- Одноразовый серверный nonce (усиление против реплея) — на будущее.
- Косметика экрана «Придумай ник» и профиль-шитов — как в Фазе 1, prompt/шиты.
- (Rate-limit включён в объём Фазы 3 — см. раздел «Безопасность» п.8.)
