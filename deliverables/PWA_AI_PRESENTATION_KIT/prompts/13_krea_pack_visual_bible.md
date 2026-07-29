# Промт 13 - паковый арт и визуальная библия

| Поле | Значение |
|---|---|
| Модель | `krea/krea-2-medium` |
| Роль | Moodboard, окружение, обложки и утвержденные изображения StoryPack |
| Частота | Только производство контента или новая версия визуальной библии |
| Контракт | Неавторитетный `media-job-result@1.0` после проверки человеком |

## Условия запуска

- StoryPack и его originality boundary утверждены;
- визуальная задача не относится к автоматическому кадру каждого хода;
- бюджет изображения зарезервирован;
- результат не публикуется без проверки композиции, оригинальности и непрерывности.

## Prompt template

```text
Create one production concept image for the approved visual bible of an
original interactive story world.

PACK IDENTITY:
{{pack_identity}}

GENRE AND EMOTIONAL PROMISE:
{{genre_and_emotional_promise}}

ENVIRONMENT BRIEF:
{{environment_brief}}

PALETTE AND LIGHT:
{{approved_palette_and_light}}

ARCHITECTURE AND MATERIALS:
{{architecture_and_materials}}

SIGNATURE MOTIFS:
{{signature_motifs}}

COMPOSITION:
{{composition}}
Use {{aspect_ratio}}.

CONTINUITY:
- establish reusable shapes, materials, weather and lighting rules;
- keep scale, entrances, paths and landmark placement physically coherent;
- show only approved characters, objects and symbols;
- make the image useful as a reference for later scene generation.

ORIGINALITY:
- use only the abstract genre and mood directions above;
- do not copy a copyrighted character, costume, logo, building or signature shot;
- do not imitate a named living artist.

DO NOT INCLUDE:
{{forbidden_elements}}
No captions, logos, UI, watermark, collage or unexplained story event.

Return one finished concept image for human approval.
```
