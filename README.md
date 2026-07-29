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
```

При наличии ключа AI-маршруты доступны сразу. Отдельных env-переключателей
ролей, медиа, бюджета, таймаутов и частоты запросов нет. Сервер принимает только
same-origin запросы и ограничивает одного клиента восемью AI-запросами в минуту
и двумя одновременными запросами.

Платный Nemotron служит реальным fallback для `scene-plan` и `difficulty` без
отдельного включения. Бесплатный endpoint не получает `response_format`,
которого сейчас нет в его опубликованных возможностях, и принимает только
обезличенный allowlist.

Серверные таймауты заданы в коде: 180 секунд для текста, 120 секунд для
изображения, 30 секунд для отправки видео и 20 секунд для опроса video job.
Таймер остается активным до полного чтения JSON-тела, а не только до получения
HTTP-заголовков.

Каждый image-модуль имеет собственный жесткий предел стоимости в серверном
каталоге. Перед платным POST сервер читает текущий endpoint-каталог OpenRouter,
проверяет цену и закрепляет провайдера. Если OpenRouter не публикует проверяемую
цену или цена выше предела модуля, платный вызов не выполняется. Для Krea это
условие проверяется при каждом вызове; Riverflow и Recraft имеют проверяемые
цены в endpoint-каталоге.

Video route дополнительно требует `NUXT_OPENROUTER_SITE_URL` с HTTPS origin,
утвержденный стартовый кадр и жесткий предел стоимости из серверного каталога.
Произвольные внешние URL отклоняются.
Несмотря на наличие транспорта, оба Grok video-модуля остаются программно
заблокированы, пока mini-backend не получит durable idempotency: память
процесса недостаточна для безопасного платного video submit.

### API

- `GET /api/ai/catalog` - публичный безопасный статус моделей и модулей.
- `POST /api/ai/turn` - узкая preview-команда игрока. Сервер сам выбирает
  модель, промт, pack rules, authority и privacy policy.
- `POST /api/ai/modules/:module` - неавторитетные authoring, QA, narration и
  media-модули. Основной ход через этот route запрещен. Ответы текстовых
  модулей проходят строгий локальный контракт; синтаксически валидного JSON
  недостаточно.
- `GET /api/ai/video/:jobId` - polling только для job, созданного текущим
  процессом, с исходным `x-fabula-request-id`.

Основной ход использует `turn-input@0.2` и строгий `turn-output@0.2`.
DeepSeek является primary, Mistral получает тот же пакет и schema как fallback.
Nemotron получает только server-side allowlist обезличенных полей. Aion
честно отключен: его текущий endpoint отсутствует в официальном ZDR-каталоге,
а ослаблять приватную маршрутизацию сервер не будет. Journal и media не меняют
канон.

`authoritative-turn`, `inventory` и `action-tracker` нельзя вызвать через
универсальный module route. `world-compiler` также честно отключен до появления
фиксированной StoryPack JSON Schema. Это не рабочие кнопки, замаскированные под
готовую функцию.

Runtime берет правила из
`deliverables/PWA_AI_PRESENTATION_KIT/prompts/`, но несовместимые старые
output skeleton не используются как машинный контракт. Версии контрактов из
GDD имеют приоритет.

### Ограничение preview

Текущий session store живет в памяти процесса и запрещает любые canonical
operations. Он дает рабочий server-only OpenRouter transport, строгий parser,
optimistic version, concurrent idempotency, rate/concurrency limits и UI-путь,
но не заменяет production session/canon/budget services из GDD.

Успешные и неуспешные `request_id` standalone-модулей кэшируются в памяти
процесса на 24 часа. Повтор возвращает тот же результат или ту же ошибку без
нового платного вызова. Хранилище ограничено 1000 записями и при заполнении
отказывает закрыто. Session store ограничен 1000 сессиями, 64 idempotency
записями на сессию, 12 ходами истории и TTL 2 часа.

## Команды

```bash
bun run dev
bun run test
bun run typecheck
bun run build
```

Контролируемая live-матрица текстовых моделей запускается только при уже
работающем локальном сервере:

```bash
bun run live:ai:text http://127.0.0.1:3112
```

Скрипт печатает только модель, модуль, статус, задержку, токены, стоимость,
fallback и результат проверки схемы. Полные промты и ответы не сохраняются.
