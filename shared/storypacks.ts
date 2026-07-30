export const STORY_PACK_IDS = [
  'zero-line',
  'ashes-of-capua',
  'zero-citizen',
  'eighth-seal',
] as const

export type StoryPackId = (typeof STORY_PACK_IDS)[number]
export type StoryPackVersion = '0.2'
export type StoryMode = 'action' | 'exploration' | 'speech'

export interface StoryPackTheme {
  accent: string
  accentLight: string
  accentDeep: string
  accentRgb: string
  surfaceTint: string
  icon: string
}

export interface StartingItemDefinition {
  templateId: string
  name: string
  category: 'tool' | 'document' | 'medicine' | 'keepsake' | 'resource'
  description: string
  quantity: number
  charges: number | null
  condition: 'pristine' | 'usable' | 'worn'
  slot: 'hand' | 'body' | 'bag' | null
}

export interface StoryRole {
  id: string
  label: string
  competence: string
  limitation: string
  startingItem: StartingItemDefinition | null
}

export interface StorySuggestion {
  id: string
  label: string
  mode: StoryMode
  intentHint: string
}

export interface StoryPack {
  id: StoryPackId
  version: StoryPackVersion
  title: string
  shortTitle: string
  genre: string
  eyebrow: string
  rating: '16+'
  season: string
  cover: string
  video: string
  theme: StoryPackTheme
  logline: string
  entryFantasy: string
  promise: string
  systemFocus: string[]
  roles: StoryRole[]
  motivations: string[]
  opening: {
    sceneId: string
    title: string
    location: string
    storyTime: string
    narrator: string
    knownCharacterIds: string[]
    presentCharacterIds: string[]
    narrative: string
    objective: string
    journalTitle: string
    journalSummary: string
    suggestions: StorySuggestion[]
  }
  publicCharacters: Array<{
    id: string
    name: string
    role: string
    relation: string
    description: string
  }>
  publicLocations: Array<{
    id: string
    name: string
    description: string
  }>
}

const freeRole = (packId: StoryPackId): StoryRole => ({
  id: `${packId}:free`,
  label: 'Свободное воплощение',
  competence: 'Одна правдоподобная компетенция из описания игрока',
  limitation: 'Одна значимая граница, которую мир будет учитывать',
  startingItem: null,
})

export const STORY_PACKS: Record<StoryPackId, StoryPack> = {
  'zero-line': {
    id: 'zero-line',
    version: '0.2',
    title: 'История про то, как я попал...',
    shortTitle: 'До рассвета',
    genre: 'Современный зомби-триллер',
    eyebrow: 'Современность · survival drama',
    rating: '16+',
    season: 'Первые 18 часов катастрофы',
    cover: '/assets/cover_postapoc.jpg',
    video: '/assets/cover_postapoc.mp4',
    theme: {
      accent: '#e37662',
      accentLight: '#ffb09f',
      accentDeep: '#8f382f',
      accentRgb: '227 118 98',
      surfaceTint: '#241311',
      icon: '◒',
    },
    logline: 'В 21:14 Велинск теряет связь, а последний трамвай становится транспортом, убежищем и конфликтующей общиной.',
    entryFantasy: 'Ты обычный человек, чья внимательность и конкретная компетенция делают тебя незаменимым.',
    promise: 'Каждая открытая дверь, оставленный след и замеченный сосед могут вернуться последствием позже.',
    systemFocus: ['Ресурсы', 'Двери и шум', 'Наблюдатели', 'Отложенные последствия'],
    roles: [
      {
        id: 'zero-line:paramedic',
        label: 'Фельдшер-стажер',
        competence: 'Распознает травмы и ранние симптомы',
        limitation: 'Тяжело переживает сортировку пострадавших',
        startingItem: {
          templateId: 'tourniquet',
          name: 'Турникет',
          category: 'medicine',
          description: 'Одноразовый жгут в запечатанной упаковке.',
          quantity: 1,
          charges: 1,
          condition: 'pristine',
          slot: 'bag',
        },
      },
      {
        id: 'zero-line:electromechanic',
        label: 'Электромеханик',
        competence: 'Понимает питание, замки и трамвайные механизмы',
        limitation: 'Слаб в управлении напуганной толпой',
        startingItem: {
          templateId: 'multitool',
          name: 'Карманный мультитул',
          category: 'tool',
          description: 'Пассатижи, отвертка и короткое лезвие; не заменяет тяжелый инструмент.',
          quantity: 1,
          charges: null,
          condition: 'worn',
          slot: 'body',
        },
      },
      {
        id: 'zero-line:courier',
        label: 'Курьер',
        competence: 'Знает дворы, проходы и короткие маршруты',
        limitation: 'Не имеет защитного снаряжения',
        startingItem: {
          templateId: 'city-map',
          name: 'Карта дворов Велинска',
          category: 'document',
          description: 'Бумажная схема с отмеченными арками и закрытыми проходами.',
          quantity: 1,
          charges: null,
          condition: 'worn',
          slot: 'bag',
        },
      },
      {
        id: 'zero-line:reporter',
        label: 'Репортер',
        competence: 'Проверяет слухи и добивается признаний',
        limitation: 'Привлекает внимание тех, кому есть что скрывать',
        startingItem: {
          templateId: 'voice-recorder',
          name: 'Карманный диктофон',
          category: 'tool',
          description: 'Небольшой диктофон с ограниченным зарядом.',
          quantity: 1,
          charges: 3,
          condition: 'usable',
          slot: 'body',
        },
      },
      freeRole('zero-line'),
    ],
    motivations: [
      'Найти близкого',
      'Добыть лекарство',
      'Довезти раненого',
      'Выяснить источник вспышки',
      'Не повторить прежнюю ошибку',
    ],
    opening: {
      sceneId: 'scene:zero-line:apartment',
      title: 'За дверью',
      location: 'Квартира в Велинске',
      storyTime: '21:14',
      narrator: 'Рассказчик',
      knownCharacterIds: ['character:nina-gromova'],
      presentCharacterIds: [],
      narrative: 'Связь пропадает не сразу. Сначала сообщения перестают отмечаться прочитанными, затем карта показывает старые пробки, а во дворе одновременно срабатывают две сигнализации. Из подъезда слышны быстрые шаги — слишком быстрые для человека, который просто спускается по лестнице. На кухонном столе лежат ключи. Свет в коридоре еще горит. До закрытия аптеки оставалось шестнадцать минут, если ее двери вообще откроются.',
      objective: 'Решить, выходить ли из квартиры и что взять с собой.',
      journalTitle: 'Велинск, 21:14',
      journalSummary: 'Связь пропала, во дворе сработали сигнализации, а из подъезда донеслись быстрые шаги. Первая задача — понять, безопасно ли выходить и что действительно нужно взять.',
      suggestions: [
        { id: 'zero-line:check-door', label: 'Тихо проверить глазок и дверь', mode: 'exploration', intentHint: 'inspect_apartment_door' },
        { id: 'zero-line:prepare', label: 'Собрать самое необходимое', mode: 'action', intentHint: 'prepare_to_leave' },
        { id: 'zero-line:call-neighbor', label: 'Позвать соседку через дверь', mode: 'speech', intentHint: 'speak_to_neighbor_through_door' },
      ],
    },
    publicCharacters: [
      { id: 'character:vera-sokolova', name: 'Вера Соколова', role: 'Водитель трамвая № 27', relation: 'Еще не встречена', description: 'Знает поврежденные пути и ищет дочь у депо.' },
      { id: 'character:timur-agaev', name: 'Тимур Агаев', role: 'Фельдшер-стажер', relation: 'Еще не встречен', description: 'Видел две стадии симптомов, но не знает точный срок.' },
      { id: 'character:nina-gromova', name: 'Нина Громова', role: 'Соседка', relation: 'Знакома', description: 'Видит двор и защищает сына.' },
    ],
    publicLocations: [
      { id: 'location:player-apartment', name: 'Квартира', description: 'Исходная безопасная точка, состояние дверей и света сохраняется.' },
      { id: 'location:tram-27', name: 'Трамвай № 27', description: 'Будущая мобильная база с общим запасом энергии.' },
      { id: 'location:north-depot', name: 'Северное депо', description: 'Узел путей, инструментов и закрытых проходов.' },
    ],
  },
  'ashes-of-capua': {
    id: 'ashes-of-capua',
    version: '0.2',
    title: 'Дорога из Капуи',
    shortTitle: 'Имена на воске',
    genre: 'Историческая драма',
    eyebrow: 'История · 73 год до н. э.',
    rating: '16+',
    season: 'Восстание 73–71 годов до н. э.',
    cover: '/assets/cover_history.jpg',
    video: '/assets/cover_history.mp4',
    theme: {
      accent: '#c9a865',
      accentLight: '#f0d59b',
      accentDeep: '#76552d',
      accentRgb: '201 168 101',
      surfaceTint: '#20180e',
      icon: '⚜',
    },
    logline: 'Во время побега из школы Батиата ты забираешь табличку с именами проданных рабов и маршрутами их отправки.',
    entryFantasy: 'Ты входишь в восстание через конкретную компетенцию и личный долг, не подменяя исторических лидеров.',
    promise: 'Личная ветка меняет судьбы людей и отрядов, а крупное отклонение честно становится контрфактической историей.',
    systemFocus: ['Исторические якоря', 'Снабжение', 'Источники знания', 'Фракции'],
    roles: [
      {
        id: 'ashes-of-capua:gladiator',
        label: 'Гладиатор-новобранец',
        competence: 'Боевой опыт и выносливость',
        limitation: 'Слабо знает местность и письмо',
        startingItem: {
          templateId: 'kitchen-knife',
          name: 'Кухонный нож',
          category: 'tool',
          description: 'Нож из хозяйственного двора, пригодный для работы и крайней защиты.',
          quantity: 1,
          charges: null,
          condition: 'worn',
          slot: 'hand',
        },
      },
      {
        id: 'ashes-of-capua:healer',
        label: 'Порабощенный лекарь',
        competence: 'Лечение, греческий и латынь',
        limitation: 'Низкая выносливость в строю',
        startingItem: {
          templateId: 'needle-thread',
          name: 'Игла и льняная нить',
          category: 'medicine',
          description: 'Малый набор для обработки и ушивания раны.',
          quantity: 1,
          charges: 2,
          condition: 'usable',
          slot: 'bag',
        },
      },
      {
        id: 'ashes-of-capua:scribe',
        label: 'Писец хозяйства',
        competence: 'Читает сделки, имена и маршруты',
        limitation: 'Уязвим в открытом бою',
        startingItem: {
          templateId: 'wax-stylus',
          name: 'Костяной стиль',
          category: 'tool',
          description: 'Инструмент для письма на восковых табличках.',
          quantity: 1,
          charges: null,
          condition: 'usable',
          slot: 'body',
        },
      },
      {
        id: 'ashes-of-capua:driver',
        label: 'Ремесленник или возчик',
        competence: 'Ремонт, упряжь и оценка груза',
        limitation: 'Не имеет статуса среди гладиаторов',
        startingItem: {
          templateId: 'leather-awl',
          name: 'Шорное шило',
          category: 'tool',
          description: 'Рабочий инструмент для кожи, ремней и обуви.',
          quantity: 1,
          charges: null,
          condition: 'worn',
          slot: 'body',
        },
      },
      freeRole('ashes-of-capua'),
    ],
    motivations: [
      'Найти проданного родственника',
      'Вывести малую группу из Италии',
      'Сохранить список имен',
      'Добиться признания среди беглецов',
      'Создать порядок без нового рабства',
    ],
    opening: {
      sceneId: 'scene:ashes-of-capua:batiatus-yard',
      title: 'Имена в доме Батиата',
      location: 'Хозяйственный двор школы Батиата',
      storyTime: 'Перед рассветом, 73 год до н. э.',
      narrator: 'Хронист',
      knownCharacterIds: [],
      presentCharacterIds: [],
      narrative: 'Побег начинается раньше условленного знака. На кухне падает медный таз, во дворе кричит надсмотрщик, и короткий план распадается на отдельные решения. У двери хозяйственной комнаты лежит раненый. За ней — счетные таблички, зерно и восковой список с именами тех, кого собирались продать дальше по Италии. До внешних ворот можно добежать сейчас. Вернуться за человеком или документом потом уже не получится.',
      objective: 'Выбрать, что сохранить в первые минуты побега.',
      journalTitle: 'Побег из Капуи',
      journalSummary: 'План сорвался раньше срока. Во дворе школы Батиата остались раненый человек и хозяйственная комната с документами; путь к воротам пока открыт.',
      suggestions: [
        { id: 'capua:help-wounded', label: 'Поднять раненого и идти к воротам', mode: 'action', intentHint: 'help_wounded_escape' },
        { id: 'capua:check-tablets', label: 'Проверить восковые таблички', mode: 'exploration', intentHint: 'inspect_sale_tablets' },
        { id: 'capua:warn-others', label: 'Предупредить беглецов у кухни', mode: 'speech', intentHint: 'warn_escapees' },
      ],
    },
    publicCharacters: [
      { id: 'character:tertia', name: 'Терция', role: 'Порабощенная лекарка', relation: 'Еще не встречена', description: 'Хочет обменять табличку на освобождение сестры.' },
      { id: 'character:daphnus', name: 'Дафн', role: 'Пастух и проводник', relation: 'Еще не встречен', description: 'Не верит, что большая армия сохранит мобильность.' },
      { id: 'character:nabira', name: 'Набира', role: 'Ткачиха из Сирии', relation: 'Еще не встречена', description: 'Собирает имена и требует искать семьи.' },
    ],
    publicLocations: [
      { id: 'location:batiatus-yard', name: 'Школа Батиата', description: 'Место побега и первая точка невозврата.' },
      { id: 'location:vesuvius', name: 'Склоны Везувия', description: 'Ранний лагерь, где победа еще не означает снабжение.' },
      { id: 'location:rebel-camp', name: 'Подвижный лагерь', description: 'Разнородная община с обозом, семьями и спором о порядке.' },
    ],
  },
  'zero-citizen': {
    id: 'zero-citizen',
    version: '0.2',
    title: 'Обнуленный',
    shortTitle: 'Право на продолжение',
    genre: 'Киберпанк-детектив',
    eyebrow: 'Научная фантастика · identity mystery',
    rating: '16+',
    season: '36 часов в мегаблоке «Лимб-47»',
    cover: '/assets/cover_scifi.jpg',
    video: '/assets/cover_scifi.mp4',
    theme: {
      accent: '#54e6d0',
      accentLight: '#b7fff2',
      accentDeep: '#197e83',
      accentRgb: '84 230 208',
      surfaceTint: '#0e2021',
      icon: '⌁',
    },
    logline: 'Городская система считает тебя умершим, но старая цифровая подпись уже готовит преступление от твоего имени.',
    entryFantasy: 'Ты ведешь камерное расследование: сопоставляешь цифровые следы с физическими и решаешь, кому показывать найденное.',
    promise: 'Каждый вывод опирается на происхождение улики, ограниченный доступ и конкретного свидетеля.',
    systemFocus: ['Цепочка доказательств', 'Физический доступ', 'Права и токены', 'След'],
    roles: [
      {
        id: 'zero-citizen:courier',
        label: 'Курьер защищенных грузов',
        competence: 'Маршруты, наблюдение и физическая безопасность',
        limitation: 'Ограниченные цифровые права',
        startingItem: {
          templateId: 'ceramic-token',
          name: 'Керамический сервисный жетон',
          category: 'tool',
          description: 'Одноразовый физический ключ к служебному проходу.',
          quantity: 1,
          charges: 1,
          condition: 'pristine',
          slot: 'body',
        },
      },
      {
        id: 'zero-citizen:neurotech',
        label: 'Специалист по нейроинтерфейсам',
        competence: 'Диагностика имплантов и снимков памяти',
        limitation: 'Высокая чувствительность к neural stress',
        startingItem: {
          templateId: 'stress-medicine',
          name: 'Нейростабилизатор',
          category: 'medicine',
          description: 'Одна доза для снижения перегрузки после работы с памятью.',
          quantity: 1,
          charges: 1,
          condition: 'pristine',
          slot: 'bag',
        },
      },
      {
        id: 'zero-citizen:auditor',
        label: 'Аудитор Реестра',
        competence: 'Подписи, договоры и процедуры доступа',
        limitation: 'Высокая заметность для системы',
        startingItem: {
          templateId: 'old-contract',
          name: 'Распечатка старого договора',
          category: 'document',
          description: 'Бумажная копия с подписью и датой до юридической смерти.',
          quantity: 1,
          charges: null,
          condition: 'worn',
          slot: 'bag',
        },
      },
      {
        id: 'zero-citizen:technician',
        label: 'Городской техник',
        competence: 'Инфраструктура и автономный доступ',
        limitation: 'Слабая социальная сеть',
        startingItem: {
          templateId: 'optical-key',
          name: 'Одноразовый оптический ключ',
          category: 'tool',
          description: 'Ключ с узкой областью доступа и одним использованием.',
          quantity: 1,
          charges: 1,
          condition: 'pristine',
          slot: 'body',
        },
      },
      freeRole('zero-citizen'),
    ],
    motivations: [
      'Доказать, что я жив',
      'Понять решение прошлой версии',
      'Защитить жителя блока',
      'Раскрыть аварию Mnemos Civic',
      'Получить новую личность',
    ],
    opening: {
      sceneId: 'scene:zero-citizen:apartment',
      title: 'Вы умерли',
      location: 'Квартира в «Лимб-47»',
      storyTime: 'За 11 часов до Согласования',
      narrator: 'Реестр / Рассказчик',
      knownCharacterIds: [],
      presentCharacterIds: [],
      narrative: 'Квартира узнает твое лицо, голос и рисунок вен — но не право здесь находиться. На стене появляется сухая строка: «Субъект умер 36 часов назад». Счет пуст. Знакомым уже разослано предупреждение о мошеннике. Домашний принтер, отключенный от сети, вдруг втягивает лист и выводит твоим почерком: «Не позволяй им восстановить меня. Начни с квартиры 6B». В коридоре останавливается служебный дрон.',
      objective: 'Выбрать первый проверяемый источник и не выдать направление расследования.',
      journalTitle: 'Статус: умер',
      journalSummary: 'Реестр считает тебя умершим 36 часов назад. Офлайн-принтер оставил записку твоим почерком и указал на квартиру 6B; в коридоре появился служебный дрон.',
      suggestions: [
        { id: 'zeroed:inspect-note', label: 'Проверить бумагу и почерк записки', mode: 'exploration', intentHint: 'inspect_printed_note' },
        { id: 'zeroed:shut-network', label: 'Отключить квартиру от сети', mode: 'action', intentHint: 'disconnect_apartment_network' },
        { id: 'zeroed:address-drone', label: 'Попросить дрон назвать основание ордера', mode: 'speech', intentHint: 'question_service_drone' },
      ],
    },
    publicCharacters: [
      { id: 'character:mira-dein', name: 'Мира Дейн', role: 'Аналоговый курьер', relation: 'Бывшая близкая подруга', description: 'Помнит обещание старой версии, но не доверяет восстановленной.' },
      { id: 'character:dara-sol', name: 'Дара Сол', role: 'Инспектор целостности', relation: 'Не знакома', description: 'Верит Реестру, но замечает невозможную временную подпись.' },
      { id: 'character:echo-7', name: 'Эхо-7', role: 'Ограниченная модель прошлой версии', relation: 'Не встречена', description: 'Знает только момент снимка и скрывает пробелы.' },
    ],
    publicLocations: [
      { id: 'location:limb47-apartment', name: 'Квартира', description: 'Рабочая станция, принтер и слепая зона камеры.' },
      { id: 'location:apartment-6b', name: 'Квартира 6B', description: 'Физическая пломба противоречит цифровому журналу.' },
      { id: 'location:paper-archive', name: 'Бумажный архив', description: 'Независимый источник договоров и цепочек подписей.' },
    ],
  },
  'eighth-seal': {
    id: 'eighth-seal',
    version: '0.2',
    title: 'Восьмая печать',
    shortTitle: 'Лишний круг',
    genre: 'Контрактное фэнтези',
    eyebrow: 'Исекай · договорная магия',
    rating: '16+',
    season: 'Первый сезон о семи героях и одном лишнем',
    cover: '/assets/cover_fantasy.jpg',
    video: '/assets/cover_fantasy.mp4',
    theme: {
      accent: '#d9a94a',
      accentLight: '#f2cd7c',
      accentDeep: '#8a6122',
      accentRgb: '217 169 74',
      surfaceTint: '#21170c',
      icon: '✦',
    },
    logline: 'Семь героев появляются в завершенных кругах, а ты — в сломанном восьмом, которого не должно существовать.',
    entryFantasy: 'Ты незапланированный свидетель, который видит цену магии и может построить дом без чужого права на твое имя.',
    promise: 'Сила растет через доказанные договоры, отношения, артефакты и видимое развитие Восьмого Предела.',
    systemFocus: ['Договоры и цена', 'Артефакты', 'Milestone-прогрессия', 'Поселение'],
    roles: [
      {
        id: 'eighth-seal:medic',
        label: 'Первая помощь',
        competence: 'Оценивает состояние и организует помощь',
        limitation: 'Земные методы не отменяют цену магического исцеления',
        startingItem: {
          templateId: 'earth-first-aid',
          name: 'Карманная аптечка с Земли',
          category: 'medicine',
          description: 'Небольшой набор первой помощи без чудесных свойств.',
          quantity: 1,
          charges: 2,
          condition: 'usable',
          slot: 'bag',
        },
      },
      {
        id: 'eighth-seal:engineer',
        label: 'Инженерное мышление',
        competence: 'Разбирает задачу на материалы, этапы и проверки',
        limitation: 'Не помнит готовые технологии энциклопедически',
        startingItem: {
          templateId: 'earth-pencil',
          name: 'Механический карандаш',
          category: 'tool',
          description: 'Личный предмет для схем и заметок; запас грифеля ограничен.',
          quantity: 1,
          charges: 5,
          condition: 'usable',
          slot: 'body',
        },
      },
      {
        id: 'eighth-seal:negotiator',
        label: 'Переговоры',
        competence: 'Слышит интересы сторон и формулирует ясные условия',
        limitation: 'Не получает доверие без поступков и свидетелей',
        startingItem: {
          templateId: 'earth-keepsake',
          name: 'Личный предмет с Земли',
          category: 'keepsake',
          description: 'Небольшая вещь, связывающая героя с прежней жизнью.',
          quantity: 1,
          charges: null,
          condition: 'worn',
          slot: 'body',
        },
      },
      {
        id: 'eighth-seal:craftsperson',
        label: 'Ремесло',
        competence: 'Работает с материалом и оценивает качество',
        limitation: 'Нуждается в инструментах, времени и местной практике',
        startingItem: {
          templateId: 'earth-knife',
          name: 'Складной нож с Земли',
          category: 'tool',
          description: 'Практичный инструмент, не магическое оружие.',
          quantity: 1,
          charges: null,
          condition: 'usable',
          slot: 'body',
        },
      },
      freeRole('eighth-seal'),
    ],
    motivations: [
      'Вернуться домой',
      'Начать заново',
      'Защитить других призванных',
      'Построить место без чужого права на имя',
      'Понять причину восьмого круга',
    ],
    opening: {
      sceneId: 'scene:eighth-seal:summoning-hall',
      title: 'Лишний круг',
      location: 'Зал Призыва, Эллар',
      storyTime: 'Первый час после призыва',
      narrator: 'Рассказчик',
      knownCharacterIds: ['character:ilva-rein', 'character:kassar-vel'],
      presentCharacterIds: ['character:ilva-rein', 'character:kassar-vel'],
      narrative: 'Семь кругов горят ровно. Над каждым уже склоняется придворный писец, записывая имя нового героя. Под твоими ногами линии восьмого круга обрываются, словно чертеж остановили на полуслове. Защитные печати поворачиваются к тебе острыми гранями. Молодая архивистка роняет свиток и, пока рыцари еще не понимают, что произошло, шепчет: «Не позволяй королю назвать тебя». На камне рядом лежит пустая медная печать.',
      objective: 'Сохранить право на собственное имя и понять, кто может помочь.',
      journalTitle: 'Восьмой круг',
      journalSummary: 'В Зале Призыва появился незавершенный восьмой круг. Защитные печати считают тебя ошибкой, архивистка советует не принимать имя короля, рядом лежит пустая медная печать.',
      suggestions: [
        { id: 'seal:inspect-circle', label: 'Изучить разрыв в восьмом круге', mode: 'exploration', intentHint: 'inspect_broken_summoning_circle' },
        { id: 'seal:take-seal', label: 'Поднять пустую медную печать', mode: 'action', intentHint: 'take_empty_copper_seal' },
        { id: 'seal:ask-archivist', label: 'Тихо спросить архивистку об имени', mode: 'speech', intentHint: 'question_archivist_about_name' },
      ],
    },
    publicCharacters: [
      { id: 'character:ilva-rein', name: 'Илва Рейн', role: 'Младшая архивистка', relation: 'Первый возможный союзник', description: 'Обнаружила восьмой круг и скрывает запись учителя.' },
      { id: 'character:kassar-vel', name: 'Кассар Вель', role: 'Рыцарь-защитник', relation: 'Связан буквой клятвы', description: 'Его присяга велит защищать только семерых.' },
      { id: 'character:maelis-arden', name: 'Маэлис Арден', role: 'Архитектор ритуала', relation: 'Не встречена', description: 'Нарушила клятву, оставив возможность переписать договор.' },
    ],
    publicLocations: [
      { id: 'location:summoning-hall', name: 'Зал Призыва', description: 'Семь завершенных кругов и сломанный восьмой.' },
      { id: 'location:unfinished-contracts-archive', name: 'Архив договоров', description: 'Место незавершенных и скрытых клятв.' },
      { id: 'location:eighth-boundary', name: 'Восьмой Предел', description: 'Заброшенная застава, способная стать независимым поселением.' },
    ],
  },
}

export const STORY_PACK_LIST = STORY_PACK_IDS.map(id => STORY_PACKS[id])

const LEGACY_STORY_PACK_ALIASES: Record<string, StoryPackId> = {
  fant: 'eighth-seal',
  scifi: 'zero-citizen',
  hist: 'ashes-of-capua',
  post: 'zero-line',
  zeroed: 'zero-citizen',
  'road-from-capua': 'ashes-of-capua',
  'history-of-how-i-got-here': 'zero-line',
  'modern-zombie-velinsk': 'zero-line',
  'spartacus-road-from-capua': 'ashes-of-capua',
  'cyberpunk-zeroed-limb47': 'zero-citizen',
  'fantasy-eighth-seal': 'eighth-seal',
}

export function isStoryPackId(value: unknown): value is StoryPackId {
  return typeof value === 'string' && STORY_PACK_IDS.includes(value as StoryPackId)
}

export function normalizeStoryPackId(value: unknown): StoryPackId | null {
  if (isStoryPackId(value))
    return value
  if (typeof value !== 'string')
    return null
  const withoutVersion = value.trim().toLowerCase().replace(/@0\.2$/, '')
  return LEGACY_STORY_PACK_ALIASES[withoutVersion] || null
}

export function getStoryPack(value: unknown): StoryPack | null {
  const id = normalizeStoryPackId(value)
  return id ? STORY_PACKS[id] : null
}
