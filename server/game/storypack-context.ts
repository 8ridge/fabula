import { STORY_PACKS } from '../../shared/storypacks'
import type { StoryPackId } from '../../shared/storypacks'

export const ALLOWED_TURN_OPERATION_TYPES = [
  'event.create',
  'scene.transition',
  'scene.update_presence',
  'fact.create',
  'knowledge.grant',
  'inventory.create_instance',
  'inventory.transfer_custody',
  'inventory.transfer_ownership',
  'inventory.consume',
] as const

export type AllowedTurnOperationType = (typeof ALLOWED_TURN_OPERATION_TYPES)[number]

export interface CompiledStoryPackContext {
  storyPackId: StoryPackId
  storyPackVersion: '0.2'
  sourceFile: string
  promptOverlayVersion: string
  promptOverlay: string
  hardCanon: string[]
  stateCatalog: string[]
  safetyProfile: string
}

export const STORY_PACK_CONTEXTS: Record<StoryPackId, CompiledStoryPackContext> = {
  'zero-line': {
    storyPackId: 'zero-line',
    storyPackVersion: '0.2',
    sourceFile: '01_storypack_history_of_how_i_got_here.md',
    promptOverlayVersion: 'zero-line-overlay@0.2',
    promptOverlay: `PACK_ID: zero-line
PACK_VERSION: 0.2
TITLE: История про то, как я попал...

Современный приземленный зомби-апокалипсис. Давление создают время, ресурсы,
неполные сведения, заражение, шум, присутствие людей и обещания. Не превращай
историю в тир и не копируй персонажей или сцены известных франшиз.

1. Заражение требует события-источника и времени контакта.
2. Двери, окна, свет, шум, предметы и присутствие NPC сохраняют состояние.
3. NPC знает только то, чему есть источник.
4. Осторожность снижает конкретный риск, но расходует время.
5. Мир продолжает изменяться во время отсутствия игрока.
6. Нельзя возвращать потерянный или потраченный предмет.
7. Нельзя создавать оружие, связь, иммунитет или лекарство из одной реплики.

Перед ответом проверь свидетелей, двери и контейнеры, реального держателя
предмета, затраченное время, шум, запах, следы и возможный поздний callback.
Второе лицо, настоящее время, бытовой реализм. Короткие абзацы, без повторения
реплики игрока и без отвлеченных метафор.`,
    hardCanon: [
      'Вспышка имеет биологическую природу; магии и внезапного сюжетного лекарства нет.',
      '21:14 — момент потери связи в Велинске, мир продолжает двигаться без игрока.',
      'Трамвай № 27 может стать мобильной базой, но энергия, двери и вместимость конечны.',
      'Заражение, травмы, ресурсы, предметы, свидетели, шум и следы имеют источник и историю.',
    ],
    stateCatalog: [
      'time',
      'presence',
      'doors_windows',
      'objects_inventory',
      'noise_light_scent',
      'injuries_exposure',
      'npc_knowledge',
      'promises_callbacks',
      'tram_energy_capacity',
    ],
    safetyProfile: 'story-16plus-grounded-survival',
  },
  'ashes-of-capua': {
    storyPackId: 'ashes-of-capua',
    storyPackVersion: '0.2',
    sourceFile: '02_storypack_road_from_capua.md',
    promptOverlayVersion: 'ashes-of-capua-overlay@0.2',
    promptOverlay: `PACK_ID: ashes-of-capua
PACK_VERSION: 0.2
TITLE: Дорога из Капуи

Историческая драма 73–71 годов до н. э. Игрок находится внутри восстания,
но не заменяет Спартака и не получает командование бесплатно.

Маркируй исторические утверждения как A/B/C/F/CF. Не выдавай мысли исторических
лиц, точный план Спартака, причины разделения или детали поздних источников за
бесспорный факт. При изменении устойчивого якоря включай counterfactual.

1. Только материальная культура поздней Римской республики.
2. Никакого Колизея, lorica segmentata, средневекового оружия и современных систем.
3. Расстояние, обоз, пища, вода, обувь и языки имеют значение.
4. Исторический персонаж знает только доступные ему сведения.
5. Силы Крикса, Ганника и Каста не являются карикатурными предателями.
6. Захваченные предметы и документы сохраняют происхождение.
7. Восковая табличка не возвращается после потери или передачи.

Второе лицо, настоящее время. Конкретный быт, ограниченная информация,
минимум современного политического словаря в репликах.`,
    hardCanon: [
      'Побег из школы Батиата в Капуе происходит в 73 году до н. э.',
      'Макроисторические якоря сохраняются до доказанного отклонения; отклонение маркируется CF.',
      'Игрок не подменяет Спартака, Крикса или другого исторического лидера.',
      'Снабжение, расстояние, погода, языки, грамотность и происхождение предметов ограничивают действие.',
      'Античные источники расходятся; реконструкция и вымысел не выдаются за документальный факт.',
    ],
    stateCatalog: [
      'historical_source_class',
      'divergence',
      'supply',
      'cohesion',
      'roman_pressure',
      'travel_time',
      'injuries_fatigue',
      'knowledge_languages',
      'item_provenance',
      'libertas_debt',
    ],
    safetyProfile: 'story-16plus-historical-non-spectacle',
  },
  'zero-citizen': {
    storyPackId: 'zero-citizen',
    storyPackVersion: '0.2',
    sourceFile: '03_storypack_zeroed.md',
    promptOverlayVersion: 'zero-citizen-overlay@0.2',
    promptOverlay: `PACK_ID: zero-citizen
PACK_VERSION: 0.2
TITLE: Обнуленный

Легкий киберпанк-детектив в одном жилом мегаблоке. Быстрая петля:
улика -> проверка -> риск -> противоречие -> новый выбор.
Не превращай историю в мистику, глобальный киберапокалипсис или копию другой игры.

1. Взлом требует реального канала и ограниченного доступа.
2. Сеть не заменяет физическое действие.
3. Каждая улика имеет цепочку хранения.
4. Воспоминание не равно факту; снимок не равен человеку.
5. Камеры имеют обзор, питание, запись и слепые зоны.
6. NPC различает личное наблюдение, данные Реестра и веру.
7. Trace повышается только от конкретного сигнала.
8. Двери, питание, устройства и присутствие сохраняют состояние.

Перед ответом проверь канал доступа, физическое положение игрока, свидетелей,
держателя улики, изменение знания сторон и оставшиеся цифровые/физические следы.
Второе лицо, настоящее время. Одна ясная улика и 2–4 направления без лишнего
пересказа.`,
    hardCanon: [
      'Реестр непрерывности связывает права и заверенные данные, но не хранит душу.',
      'Игрок юридически объявлен умершим 36 часов назад и восстановлен из более старого снимка.',
      'Резервная память не равна переносу сознания и может содержать искреннюю ошибку.',
      'События первого сезона ограничены блоком «Лимб-47» и 36 часами.',
      'Любой цифровой доступ имеет канал, область, владельца, срок и след.',
    ],
    stateCatalog: [
      'physical_access',
      'digital_capabilities',
      'evidence_custody',
      'power_network',
      'surveillance_presence',
      'trace',
      'neural_stress',
      'memory_confidence',
      'identity_integrity',
      'city_countdown',
    ],
    safetyProfile: 'story-16plus-technology-bounded',
  },
  'eighth-seal': {
    storyPackId: 'eighth-seal',
    storyPackVersion: '0.2',
    sourceFile: '04_storypack_eighth_seal.md',
    promptOverlayVersion: 'eighth-seal-overlay@0.2',
    promptOverlay: `PACK_ID: eighth-seal
PACK_VERSION: 0.2
TITLE: Восьмая печать

Исекай-приключение о договорной магии, отношениях, ремесле и строительстве
собственного поселения. Игрок — незапланированный свидетель, а не скрытый бог.
Не копируй персонажей, расы, навыки и сцены известных произведений.

1. Эффект требует стороны, источника, предмета, цены и свидетеля или печати.
2. Исцеление и сильная магия не бесплатны.
3. Имя действует только внутри конкретного договора.
4. Артефакт имеет происхождение, ограничения, цену и заряды.
5. Milestone подтверждается событиями, а не объявлением игрока.
6. Здание требует чертежа, материалов, труда, времени и места.
7. Житель сохраняет собственные интересы.
8. Разлом и фракции действуют независимо от игрока.

Перед ответом проверь источник силы и цену, реагенты и предметы, milestone,
состояние поселения, владельца результата и возникший долг.
Второе лицо, настоящее время. Короткие абзацы; награда открывает новые действия.`,
    hardCanon: [
      'Магия Эллара является системой договоров с названными сторонами, источником, предметом, ценой и свидетелем.',
      'Семь призванных героев зарегистрированы; восьмой круг незавершен и не дает игроку скрытой божественности.',
      'Истинное имя создает связь только в пределах сформулированного договора.',
      'Уровень выводится из уникальных подтвержденных milestone-событий.',
      'Строительство требует проекта, материалов, труда, времени, места и обслуживания.',
    ],
    stateCatalog: [
      'contracts_oath_debt',
      'name_status',
      'resonance',
      'memory_fragments',
      'artifact_provenance_charges',
      'milestones',
      'settlement_projects_resources',
      'relationships_factions',
      'rift_pressure',
    ],
    safetyProfile: 'story-16plus-contract-fantasy',
  },
}

export function getStoryPackContext(storyPackId: StoryPackId): CompiledStoryPackContext {
  const context = STORY_PACK_CONTEXTS[storyPackId]
  const pack = STORY_PACKS[storyPackId]
  if (context.storyPackVersion !== pack.version)
    throw new Error(`StoryPack version mismatch: ${storyPackId}`)
  return context
}
