# Фаза 6 — Вход через Discord — дизайн

Дата: 2026-07-31

## Цель

Добавить вход/регистрацию через Discord к существующей системе аккаунтов (Фазы 1–5:
email/пароль, Google, профиль, сессии, Telegram). По образцу Google/Telegram. Discord
использует **OAuth2 authorization-code flow** (редирект + обмен кода через client_secret).
Domain нужен для redirect_uri — до его появления делаем «спящим» (код+тесты готовы,
активируется env+доменом). Бэкенд FastAPI (`backend/`), фронт Nuxt (`web/`).

## Принятые решения (брейншторм)

- **Механизм:** OAuth2 authorization-code. Фронт редиректит на
  `https://discord.com/api/oauth2/authorize` (scope `identify email`, `state` против CSRF)
  → Discord возвращает на `redirect_uri` (наш домен) с `code`+`state` → бэк меняет
  `code`+`client_secret` на access-токен → `GET /users/@me` → `discord_id`, `email`,
  `verified`, `username`.
- **Discord отдаёт email** (scope `email`) с флагом `verified` → **авто-связывание по
  подтверждённой почте**, как у Google (в отличие от Telegram).
- **Новый юзер:** экран «придумай ник» (тот же, что у Google/Telegram), предзаполнен из
  Discord `username`. Юзер не создаётся, пока не введён ник.
- **Привязки:** привязать Discord к существующему аккаунту (профиль/настройки, Bearer),
  коллизия → 409. Отвязка — только если остаётся другой способ входа.
- **Domain:** до появления домена — dormant (кнопка «скоро», redirect не настроен).
- **Не пушить** (по просьбе): вся Фаза 6 живёт на ветке `feature/phase6-discord`.

## Модель данных

Переиспользуем `oauth_accounts` (Фаза 3): `provider='discord'`,
`provider_user_id=<discord id>`. UNIQUE(provider, provider_user_id), ON DELETE CASCADE,
индекс по user_id — уже есть. **Новых таблиц и миграций не требуется** (email уже nullable
с Фазы 5, но Discord обычно даёт email).

## Обмен кода (discord_auth.py)

Новый модуль `app/discord_auth.py`, **внедряемый как зависимость** (в тестах — фейк, как
`google_auth`/`telegram_auth`):

```
class DiscordVerifier:
    def exchange(self, code: str, redirect_uri: str) -> dict:
        """code → {'discord_id','email','email_verified','username'} или бросает."""
```

`RealDiscordVerifier.exchange`:
1. `POST https://discord.com/api/oauth2/token` (grant_type=authorization_code, code,
   redirect_uri, client_id, client_secret) → access_token.
2. `GET https://discord.com/api/users/@me` (Bearer access_token) → `id`, `email`,
   `verified`, `username`.
3. Вернуть `{discord_id:str(id), email, email_verified:bool(verified и email), username}`.

HTTP-вызовы синхронные (httpx/requests) — в threadpool (как google-auth). Секреты
(`client_id`, `client_secret`) — из `settings`, только на бэке.

## Эндпойнты и флоу

**`POST /auth/discord`** {code, redirect_uri} — вход/регистрация:
1. Обмен `code` → `discord_id`, `email`, `email_verified`, `username`. **Из ответа Discord,
   не из тела.**
2. `oauth_accounts(discord, discord_id)` есть → сессия (`TokenOut`). Возврат.
3. Нет → `users` по `email`:
   - есть **и** `email_verified` → авто-связка (`oauth_accounts`), сессия;
   - есть, но email не verified → 400 (войди паролем/провайдером и привяжи в профиле).
4. Нет юзера → `{needs_username:true, registration_token}` (JWT
   `{discord_id, email, username, purpose:"discord_register", exp≈10мин}`), без сессии.

**`POST /auth/discord/complete`** {registration_token, username} — финал регистрации:
- Проверяем токен (`purpose=="discord_register"`), валидируем ник, гонки через UNIQUE →
  создаём `User(email, username, password_hash=NULL, email_verified=True)` +
  `oauth_accounts(discord)` в транзакции → сессия.

**`POST /auth/link/discord`** (Bearer) {code, redirect_uri} — привязать к текущему:
- `discord_id` уже у другого → 409; у текущего → идемпотентно; иначе создаём.

**`DELETE /auth/link/discord`** (Bearer) — отвязать: только если остаётся другой способ
входа (`password_hash` или другой провайдер). Иначе 400.

**`GET /auth/me`** — `providers` += `'discord'`.

## Безопасность (модель угроз и меры)

1. **Обмен кода только на бэке**, `client_secret` — env бэка (Saturn), не во фронт/git/логи.
   `.env.example` — плейсхолдер. При компрометации — сброс секрета в Discord Dev Portal.
2. **`state` (CSRF):** фронт генерит случайный `state`, кладёт в `sessionStorage`, передаёт
   в authorize; на возврате сверяет `state` из URL с сохранённым до отправки `code` на бэк.
3. **email-авто-связка строго при `verified`** от Discord. Иначе не связываем.
4. **`registration_token` ≠ access-токен:** `purpose:"discord_register"`, без `ver` →
   `get_current_user` отвергает. TTL ~10 мин, только в теле ответа.
5. **Привязка от угона:** `discord_id` уже у другого → 409. **От локаута:** unlink только
   при наличии другого входа.
6. **`redirect_uri`** — фиксирован и совпадает с зарегистрированным в Discord-приложении
   (Discord отвергает несовпадение). Бэк тоже проверяет allowlist redirect_uri.
7. **Rate-limit:** `/auth/discord`, `/auth/discord/complete`, `/auth/link/discord` в
   существующий лимитер.
8. **Транзакционность:** `User`+`oauth_accounts` — одна транзакция; UNIQUE ловят гонки → 409.
9. **Логи:** `code`, токены Discord, наш access/registration — не логируем.

## Фронт

**Вход (лендинг, модалка):**
- Кнопка «Войти через Discord» → генерим `state` → `sessionStorage` → редирект на
  `discord.com/api/oauth2/authorize?client_id=…&redirect_uri=…&response_type=code&scope=identify%20email&state=…`.
- **Возврат:** Discord редиректит на `redirect_uri` (наш `/app` или спец. путь) с
  `?code=…&state=…`. На загрузке приложение видит `code`+`state`, сверяет `state`, шлёт
  `POST /auth/discord {code, redirect_uri}`:
  - сессия → токен в localStorage → чистим query → `/app`;
  - `needs_username` → экран «Придумай ник» (общий с Google/Telegram через
    `pendingProvider='discord'`) → `POST /auth/discord/complete`.
- Ошибка/отказ Discord (`?error=…`) → «Вход через Discord отменён».

**Профиль → шит настроек (`app.vue`):** строка «Discord» рядом с Google/Telegram
(«привязать»/«привязан · отвязать»); привязка — тот же редирект, но `POST /auth/link/discord`.

## Конфиг

- `DISCORD_CLIENT_ID` (публичный): env бэка **и** `runtimeConfig.public.discordClientId`.
- `DISCORD_CLIENT_SECRET`: только env бэка (Saturn). `.env.example` — плейсхолдер.
- `DISCORD_REDIRECT_URI`: наш прод-URL возврата (напр. `https://<домен>/app`).
- Discord Dev Portal: OAuth2 → добавить redirect (наш домен + localhost для дева), scopes
  `identify email`.

## Тестирование (pytest + SQLite, как Фазы 1/3/5)

`discord_auth` — внедряемая зависимость; в тестах фейк возвращает
`{discord_id, email, email_verified}` по «коду». Кейсы:
- новый: `/auth/discord`→`needs_username`+`registration_token`; `/complete`→создан
  (`providers==['discord']`, `password_hash` NULL);
- авто-связка: есть email/пароль-юзер, Discord с тем же verified email → связал+залогинил
  (`providers` содержит email и discord);
- повторный вход тем же `discord_id` → та же учётка;
- `email_verified=false` при существующем email → 400;
- битый `code` → 401;
- `complete`: занятый ник → 409; битый `registration_token` → 401; не работает как access → 401;
- `link`: к текущему; `discord_id` у другого → 409;
- `unlink`: только-discord (нет др. входа) → 400; есть пароль/google → 204.

## Открытые вопросы / вне Фазы 6

- **Домен** и redirect_uri в Discord Dev Portal — Ильнар (домен общий с Telegram). До него —
  живой вход не тестируется (только бэкенд/юнит).
- Реальные `DISCORD_CLIENT_ID/SECRET` — Ильнар (в env Saturn).
- **Не пушить** — вся фаза на ветке до ручной проверки.
