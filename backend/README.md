# ФАБУЛА · Auth API

Минимальный бэкенд аутентификации: **FastAPI + PostgreSQL**, вход по почте и паролю.
Пароли — argon2, сессия — JWT. Готов к расширению на Telegram / Google.

## Что уже есть

| Метод | Путь | Назначение |
|------|------|-----------|
| `POST` | `/auth/register` | регистрация (name, email, password) → токен + юзер |
| `POST` | `/auth/login` | вход (email, password) → токен + юзер |
| `GET`  | `/auth/me` | текущий пользователь (нужен `Authorization: Bearer <token>`) |
| `GET`  | `/health` | проверка живости |

Интерактивная документация — на `http://localhost:8000/docs`.

## Запуск локально

Нужен Python 3.12+ и Docker (для Postgres).

```bash
# 1. база
docker compose up -d db

# 2. окружение
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate    # Linux/Mac
pip install -r requirements.txt

# 3. конфиг
copy .env.example .env         # Windows (cp на Linux/Mac), затем впиши свой JWT_SECRET

# 4. сервер
uvicorn app.main:app --reload
```

Проверка:

```bash
curl -X POST http://localhost:8000/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Тест\",\"email\":\"t@t.io\",\"password\":\"secret1\"}"
```

## Структура

```
backend/
  app/
    main.py        — приложение, CORS, подключение роутов
    config.py      — настройки из .env
    database.py    — async-подключение к Postgres, создание таблиц
    models.py      — модель User
    schemas.py     — валидация запросов/ответов
    security.py    — хэш паролей (argon2) + JWT
    deps.py        — get_current_user из токена
    routers/auth.py — /register /login /me
  docker-compose.yml — Postgres 16
  Dockerfile         — образ бэка (для Saturn)
  requirements.txt
```

## Дальше (не сделано, по плану)

- Подтверждение почты письмом (Resend/Postmark/SMTP).
- Вход через **Telegram** (Login Widget + проверка подписи бота).
- Вход через **Google** (OAuth2).
- Alembic-миграции вместо `create_all`.
- Деплой на **Saturn** (Dockerfile готов; нужен доступ RND Team к репозиторию).

## Как подключается фронт

Nuxt-форма шлёт `fetch` на `/auth/register` и `/auth/login`, сохраняет `access_token`
(localStorage или httpOnly-кука) и с ним дёргает `/auth/me`. См. `CORS_ORIGINS` в `.env`.
