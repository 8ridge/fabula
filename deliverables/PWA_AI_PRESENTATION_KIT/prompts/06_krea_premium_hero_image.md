# Промт 06 — Premium / hero-art

| Поле | Значение |
|---|---|
| Модель | [`krea/krea-2-large`](https://openrouter.ai/krea/krea-2-large) |
| Ценность | Редкий выразительный кадр для обложки, кульминации или Premium-награды |
| Официальный минимум | от $0.06 за изображение |
| Публичный максимум | OpenRouter не указывает |
| Проектный hard cap | $0.10 за задачу |
| Качество | Высокое/очень высокое; сильнее в фактуре, фотореализме и выразительном стиле |
| Скорость | Средне; асинхронная генерация |
| Частота | Только производство контента, обложка или подтверждённая кульминация |

## Отличие от дешёвого кадра

Hero-art должен показывать событие, которое:

- уникально для конкретной ветки;
- имеет утверждённый визуальный результат;
- заслуживает сохранения в журнале как самостоятельная награда;
- не может быть заменено общей библиотечной картинкой;
- не является просто очередным диалогом или получением уровня.

## Prompt template — копировать/вставить

```text
Create a premium hero illustration for a specific confirmed climax in an
interactive serialized game. The image must feel authored, unique to this
player's branch, and suitable for a season cover or permanent journal entry.

PACK IDENTITY:
{{pack_visual_bible}}

CONFIRMED CLIMAX:
{{confirmed_event_and_causal_price}}

PLAYER EMBODIMENT:
{{approved_player_reference_card}}

PRESENT CHARACTERS:
{{approved_character_reference_cards}}

STORY-CRITICAL OBJECTS:
{{object_visual_cards_with_current_holder_and_state}}

LOCATION:
{{current_location_layout_weather_time_and_changed_state}}

COMPOSITION:
Use {{aspect_ratio}}.
Primary focal relationship: {{player_vs_person_or_world_force}}.
Foreground: {{approved_foreground}}.
Midground: {{approved_action}}.
Background: {{approved_world_consequence}}.
Camera: {{lens_feel}}, {{angle}}, {{movement_or_stillness}}.
Guide the eye from {{first_focus}} to {{second_focus}}.

EMOTIONAL CONTRAST:
{{victory_and_cost_or_discovery_and_danger}}

LIGHT, COLOR, MATERIAL:
{{pack_palette_and_specific_light_sources}}
Emphasize tangible materials, weather, wear, injuries and the exact state of
the environment. Use rich texture without visual clutter.

CONTINUITY IS MANDATORY:
- identical face, age, body proportions, hair, outfit and equipment;
- preserve handedness, injuries, dirt and item ownership;
- preserve architecture and the physical result of the confirmed event;
- do not turn symbolic language into new literal objects;
- do not reveal hidden truths not visible in the scene.

NEGATIVE CONSTRAINTS:
no captions, no logos, no UI, no watermark, no generic centered poster lineup,
no extra characters, no invented weapon, no unexplained magic, no costume
redesign, no copyrighted character or franchise-specific composition.

Return one final hero image. Do not create variants in the same canvas.
```

## Примеры допустимых кульминаций

- трамвай уходит на сервисную ветку благодаря сохранённому ключу;
- личная группа выходит из укреплений Красса;
- игрок физически отделяет инфраструктуру блока от Реестра;
- Восьмой Предел впервые включает защитный контур.

## Причины отказа

Не запускать, если:

- событие ещё не применено к канону;
- reference cards отсутствуют;
- сцена визуально не отличается от дешёвого кадра;
- стоимость выше hard cap;
- hero-art нужен только «потому что модель красивая»;
- результат должен быть предметной иконкой, а не сценой.
