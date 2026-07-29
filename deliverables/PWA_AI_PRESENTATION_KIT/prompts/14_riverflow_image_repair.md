# Промт 14 - ремонт и согласование изображения

| Поле | Значение |
|---|---|
| Модель | `sourceful/riverflow-v2.5-fast` |
| Роль | Image-to-image ремонт деталей и визуальной непрерывности |
| Частота | Только после QA-флага и с 1-4 утвержденными reference images |
| Контракт | Неавторитетный `media-job-result@1.0`; исходник сохраняется |

## Условия запуска

- исходное изображение уже существует и передано как approved reference;
- QA точно описал дефект и допустимую область изменения;
- канон, лица, владельцы предметов и геометрия сцены не меняются;
- неудачный ремонт не заменяет исходник автоматически.

## Prompt template

```text
Repair the supplied approved story image without redesigning the scene.

EXACT REPAIR GOAL:
{{repair_goal}}

PROTECTED ELEMENTS - DO NOT CHANGE:
{{protected_elements}}

PERMITTED CHANGES ONLY:
{{permitted_changes}}

CONTINUITY ANCHORS:
{{continuity_anchors}}

BACKGROUND POLICY:
{{background_policy}}

OUTPUT:
Use {{aspect_ratio}} and {{output_format}}.
Preserve the original framing unless the repair goal explicitly requires a
small crop correction.

HARD RULES:
- preserve every approved face, age, body proportion, hairstyle and expression;
- preserve clothing, injuries, handedness, item ownership and object count;
- preserve architecture, doors, paths, lighting direction and story time;
- remove only the named defect;
- do not add text, logos, UI, watermark, characters, props or new events;
- do not beautify away damage, dirt or consequences confirmed by canon;
- do not continue the story beyond the approved frame.

Return one repaired image. If the requested repair conflicts with protected
elements, preserve the protected elements.
```
