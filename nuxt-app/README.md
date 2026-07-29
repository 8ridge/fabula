# Fabula Nuxt PWA

## OpenRouter mini-backend

AI-вызовы выполняются только в Nitro server routes. Ключ OpenRouter не попадает
в public runtime config, клиентский bundle, localStorage или API-ответы.

Подготовка локального preview:

```bash
bun install
cp .env.example .env
```

Заполните в `.env`:

```text
NUXT_OPENROUTER_API_KEY=<server-only key>
NUXT_FABULA_AI_ENABLED=true
NUXT_FABULA_AI_ALLOW_UNAUTHENTICATED=true
```

`NUXT_FABULA_AI_ALLOW_UNAUTHENTICATED=true` допустим только для локального или
закрытого preview. В репозитории пока нет аккаунтов, проверки владельца сессии,
PostgreSQL-транзакций и durable budget ledger. По умолчанию AI-контур закрыт.

Опциональные роли включаются отдельно:

```text
NUXT_FABULA_AI_NEMOTRON_ENABLED=true
NUXT_FABULA_AI_AION_ENABLED=true
NUXT_FABULA_AI_MEDIA_ENABLED=true
NUXT_FABULA_AI_PREMIUM_MEDIA_ENABLED=true
```

Для video route также нужен `NUXT_OPENROUTER_SITE_URL` с HTTPS origin, на
котором хранится утвержденный стартовый кадр. Произвольные внешние URL
отклоняются.

### API

- `GET /api/ai/catalog` - публичный безопасный статус моделей и модулей.
- `POST /api/ai/turn` - узкая preview-команда игрока. Сервер сам выбирает
  модель, промт, pack rules, authority и privacy policy.
- `POST /api/ai/modules/:module` - неавторитетные authoring, QA, narration и
  media-модули. Основной ход через этот route запрещен.
- `GET /api/ai/video/:jobId` - polling только для job, созданного текущим
  процессом, с исходным `x-fabula-request-id`.

Основной ход использует `turn-input@0.2` и строгий `turn-output@0.2`.
DeepSeek является primary, Mistral получает тот же пакет и schema как fallback.
Nemotron получает только server-side allowlist обезличенных полей. Aion,
journal и media не меняют канон.

Runtime берет правила из
`../deliverables/PWA_AI_PRESENTATION_KIT/prompts/`, но несовместимые старые
output skeleton не используются как машинный контракт. Версии контрактов из
GDD имеют приоритет.

### Ограничение preview

Текущий session store живет в памяти процесса и запрещает любые canonical
operations. Он дает рабочий server-only OpenRouter transport, строгий parser,
optimistic version, concurrent idempotency, rate/concurrency limits и UI-путь,
но не заменяет production session/canon/budget services из GDD.

## Команды

```bash
bun run dev
bun run test
bun run typecheck
bun run build
```
