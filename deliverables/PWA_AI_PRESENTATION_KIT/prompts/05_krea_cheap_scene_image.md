# Промт 05 — дешёвый ключевой кадр

| Поле | Значение |
|---|---|
| Модель | [`krea/krea-2-medium-turbo`](https://openrouter.ai/krea/krea-2-medium-turbo) |
| Ценность | Быстрый и дешёвый кадр сцены для runtime |
| Официальный минимум | от $0.015 за изображение |
| Публичный максимум | OpenRouter не указывает |
| Проектный hard cap | $0.025 за задачу; при превышении не запускать |
| Качество | Средне-высокое; достаточно для ключевого кадра, не гарантирует идеальную непрерывность |
| Скорость | Очень быстро; модель оптимизирована для быстрых итераций |
| Частота | Не чаще media policy; не на каждый ход |

## Когда запускать

Только если сервер подтвердил:

- произошло новое визуально различимое событие;
- событие уже сохранено в каноне;
- есть утверждённый `visual_brief`;
- изображение не дублирует недавний кадр;
- бюджет зарезервирован.

## Prompt template — копировать/вставить

Промт лучше передавать на английском, сохраняя имена только как внутренние reference IDs.

```text
Create one cinematic story illustration for an interactive serialized game.

PACK VISUAL BIBLE:
{{pack_visual_bible}}

CONFIRMED EVENT:
{{one_sentence_confirmed_event}}

PRIMARY SUBJECT:
{{character_or_object_reference_card}}

LOCATION STATE:
{{location_architecture_weather_time_lighting}}

EXACT COMPOSITION:
{{shot_size}}, {{camera_height}}, {{camera_angle}}.
Place {{subject}} at {{screen_position}}.
The focal action is: {{single_visible_action}}.
Show only these supporting elements: {{approved_objects_and_present_characters}}.

CONTINUITY ANCHORS:
- preserve the exact face, age, body proportions, hairstyle and outfit from references;
- preserve injuries, dirt, carried items and handedness;
- preserve the location layout and current door/window/object states;
- preserve the pack palette and rendering style;
- the image must depict the moment after the confirmed event, not invent the next event.

MOOD AND LIGHT:
{{approved_mood}}
{{specific_light_sources}}

DO NOT:
- add text, captions, logos, watermarks or UI;
- add absent characters, weapons, magic, monsters or props;
- redesign clothing or architecture;
- change ownership or placement of a story-critical item;
- reveal hidden information;
- create a generic poster pose;
- copy any copyrighted character, costume, logo or shot.

Output one image, {{aspect_ratio}}, optimized for mobile PWA display.
```

## Pack-specific additions

### «История про то, как я попал...»

```text
Grounded Eastern European urban realism, wet asphalt, cold LED and emergency
amber light. No green slime, fantasy mutation or heroic gun-poster composition.
```

### «Дорога из Капуи»

```text
Late Roman Republic, 73–71 BCE. No Colosseum, no imperial monumental Capua,
no lorica segmentata, no medieval armor, no identical rebel uniforms.
```

### «Обнуленный»

```text
Functional cyberpunk: graphite, oxidized teal, sodium amber, paper and ceramic.
No generic purple neon city, no floating UI without a physical owner.
```

### «Восьмая печать»

```text
Stylized webtoon with mineral pigment texture. Contract magic appears as
spatial calligraphy, seals and material threads, never as generic laser beams.
```

## Автоматическая проверка

- изображены только присутствующие персонажи;
- критический предмет находится у правильного держателя;
- нет текста и логотипов;
- исторический пак не содержит анахронизмов;
- лицо, одежда и травма совпадают с reference card;
- фактический MIME определяется по содержимому, а не по расширению файла.
