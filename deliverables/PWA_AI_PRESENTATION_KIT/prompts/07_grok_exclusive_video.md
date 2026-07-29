# Промт 07 — эксклюзивное видео кульминации

| Поле | Значение |
|---|---|
| Бюджетная модель | [`x-ai/grok-imagine-video`](https://openrouter.ai/x-ai/grok-imagine-video) |
| Premium-модель | [`x-ai/grok-imagine-video-1.5`](https://openrouter.ai/x-ai/grok-imagine-video-1.5) |
| Ценность | Редкая движущаяся награда за подтверждённую кульминацию |
| Бюджетная цена | от $0.05/сек; 3–5 секунд = $0.15–$0.25 |
| Premium-цена | от $0.08/сек; 3–5 секунд = $0.24–$0.40 плюс исходный кадр |
| Качество | Grok — высокое; Grok 1.5 — очень высокое для непрерывности image-to-video |
| Скорость | Медленно, асинхронно; история не ждёт результат |
| Частота | Глобальный медиапул; не гарантируется каждому прохождению |

> Видео сознательно выходит за базовый лимит $0.10 на обычный вызов. Оно требует отдельного video budget, feature flag и подтверждённой исключительности события.

## Когда событие достаточно исключительное

Сервер разрешает видео только если одновременно выполнены условия:

1. событие уже сохранено и не может быть отменено retry;
2. это кульминация арки, необратимое решение или уникальный branch callback;
3. есть утверждённый стартовый кадр;
4. движение добавляет смысл, который не передаёт статичное изображение;
5. в последних N ходах/сценах не было видео;
6. пользователь и глобальный пул имеют бюджет;
7. лица, одежда, предметы и локация имеют reference cards;
8. видео не требуется для понимания следующего хода.

## Prompt template — копировать/вставить

```text
Animate the supplied approved starting image into one short cinematic moment
from a confirmed interactive story event.

DURATION:
{{3_to_5_seconds}}

CONFIRMED MOTION:
{{one_primary_physical_action}}

SUBJECT MOTION:
{{precise_body_face_cloth_hair_motion}}

ENVIRONMENT MOTION:
{{weather_light_smoke_dust_water_or_magic_motion}}

CAMERA:
{{locked|slow_push|short_track|controlled_handheld}}
Start exactly from the supplied image composition.
Use one continuous shot with no cut.

PACING:
0–1 sec: establish the approved frame.
1–{{end_minus_1}} sec: perform the single confirmed action.
Final second: hold the visible consequence clearly.

CONTINUITY:
- preserve every face, age, body proportion, hairstyle and outfit;
- preserve injuries, dirt, handedness and current item holders;
- preserve the architecture and the number/location of present characters;
- keep the story-critical object visible if it is the cause of the event;
- obey plausible weight, inertia, weather and material behavior;
- do not continue into an unconfirmed next event.

AUDIO:
{{approved_ambience_and_sound_effects}}
No dialogue unless CONFIRMED_DIALOGUE is provided verbatim.
No music unless a separate licensed audio policy explicitly enables it.

DO NOT:
- add or remove characters;
- morph faces, clothing, props or architecture;
- add weapons, monsters, spells, explosions or victory gestures;
- add subtitles, logos, UI or watermark;
- use a montage, time skip, flashback or camera cut;
- reveal hidden information;
- turn a grounded scene into a trailer.
```

## Pack-specific movement

### «История про то, как я попал...»

Трамвай тяжело входит на переведённую стрелку, дождь режет свет фар, персонаж удерживает механизм. Никаких взрывов и бесконечной орды.

### «Дорога из Капуи»

Физически правдоподобный прорыв малой группы или момент выбора у укреплений. Никаких средневековых клинков, одинаковой формы и фэнтезийных массовок.

### «Обнуленный»

Ручное переключение кабельного моста: этажи гаснут последовательно, аварийный свет остаётся, лицо и руки не меняются.

### «Восьмая печать»

Защитный контур проходит по уже построенным объектам поселения; каллиграфия следует договору, не создавая новых зданий.

## Fallback

Если задача не прошла budget gate или генерация упала:

- оставить исходный hero-image;
- применить лёгкую UI-анимацию, параллакс и звук;
- не повторять автоматически на более дорогой модели;
- не блокировать следующий игровой ход.
