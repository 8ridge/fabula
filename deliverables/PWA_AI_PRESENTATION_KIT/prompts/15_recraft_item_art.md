# Промт 15 - предметная иконка

| Поле | Значение |
|---|---|
| Модель | `recraft/recraft-v4.1-utility` |
| Роль | Общая библиотека предметов и отдельный Premium item art |
| Частота | Один раз на item template или версию визуального описания экземпляра |
| Контракт | Неавторитетный `media-job-result@1.0`; повторное открытие использует cache |

## Условия запуска

- предмет существует в утвержденном паке или подтвержденном экземпляре;
- visual description, состояние и provenance зафиксированы;
- изображение не меняет свойства, редкость или историю предмета;
- бюджет item-art зарезервирован.

## Prompt template

```text
Create one clean item illustration for an original interactive story game.

APPROVED ITEM VISUAL SPEC:
{{item_visual_spec}}

MATERIALS AND CONSTRUCTION:
{{materials_and_construction}}

CURRENT CONDITION:
{{current_condition}}

SILHOUETTE AND VIEW:
{{silhouette_and_view}}

PACK PALETTE:
{{pack_palette}}

BACKGROUND:
{{background_policy}}

COMPOSITION:
Use {{aspect_ratio}}.
Show one item, centered, fully visible, with a clear readable silhouette and
physically plausible scale, wear and material response.

CONTINUITY:
- preserve every story-critical mark, repair, stain, missing part and seal;
- show only the approved quantity and assembled state;
- do not imply powers, value or ownership not present in the visual spec;
- keep the result suitable for a mobile inventory card.

DO NOT INCLUDE:
{{forbidden_elements}}
No hands, character portrait, environment scene, caption, logo, UI, watermark,
decorative text, duplicate item or invented attachment.

Return one final item image.
```
