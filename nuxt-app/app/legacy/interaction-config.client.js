export function installInteractionConfig() {
/*
 * Fabula interaction runtime contract.
 *
 * This file is intentionally provider-agnostic on the client: it describes
 * the server seams and the OpenRouter catalog without storing credentials or
 * making model calls from the browser.
 */
(function () {
  const models = [
    {
      id: 'deepseek',
      label: 'DeepSeek V4 Flash',
      slug: 'deepseek/deepseek-v4-flash',
      role: 'Авторитетный ход',
      phase: 'runtime',
      status: 'primary',
      cost: 'около $0.00112 за типовой ход',
      contract: 'turn-output@0.2',
      link: 'https://openrouter.ai/deepseek/deepseek-v4-flash'
    },
    {
      id: 'nemotron-free',
      label: 'Nemotron 3 Ultra Free',
      slug: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      role: 'Планировщик и директор сложности',
      phase: 'advisory',
      status: 'advisory',
      cost: '$0, free endpoint',
      contract: 'scene-plan@0.2 / difficulty-advisory@0.2',
      privacy: 'Только обезличенный контекст',
      link: 'https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b%3Afree'
    },
    {
      id: 'nemotron-paid',
      label: 'Nemotron 3 Ultra',
      slug: 'nvidia/nemotron-3-ultra-550b-a55b',
      role: 'Платный fallback планировщика',
      phase: 'fallback',
      status: 'standby',
      cost: '$0.0052-0.0338 план',
      contract: 'scene-plan@0.2',
      link: 'https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b'
    },
    {
      id: 'aion',
      label: 'Aion 3.0 Mini',
      slug: 'aion-labs/aion-3.0-mini',
      role: 'Рассказчик, отключенный без ZDR endpoint',
      phase: 'blocked',
      status: 'нет ZDR endpoint',
      cost: '$0.0049 типовая сцена',
      contract: 'aion-narrative@0.2',
      privacy: 'Только подтвержденный brief',
      link: 'https://openrouter.ai/aion-labs/aion-3.0-mini'
    },
    {
      id: 'mistral',
      label: 'Mistral Small 4',
      slug: 'mistralai/mistral-small-2603',
      role: 'Fallback и канонический аудит',
      phase: 'fallback',
      status: 'armed',
      cost: '$0.0015 типовой fallback',
      contract: 'turn-output@0.2 / canon-audit@0.2',
      link: 'https://openrouter.ai/mistralai/mistral-small-2603'
    },
    {
      id: 'krea-scene',
      label: 'Krea 2 Medium Turbo',
      slug: 'krea/krea-2-medium-turbo',
      role: 'Дешевый ключевой кадр',
      phase: 'async-media',
      status: 'готов к проверке цены перед вызовом',
      cost: 'от $0.015 за image',
      contract: 'media-job-result@1.0',
      link: 'https://openrouter.ai/krea/krea-2-medium-turbo'
    },
    {
      id: 'krea-pack',
      label: 'Krea 2 Medium',
      slug: 'krea/krea-2-medium',
      role: 'Визуальная библия и паковый арт',
      phase: 'async-media',
      status: 'готов к проверке цены перед вызовом',
      cost: 'проектный предел $0.05 за изображение',
      contract: 'media-job-result@1.0',
      link: 'https://openrouter.ai/krea/krea-2-medium'
    },
    {
      id: 'krea-hero',
      label: 'Krea 2 Large',
      slug: 'krea/krea-2-large',
      role: 'Premium hero-art',
      phase: 'async-media',
      status: 'готов к проверке цены перед вызовом',
      cost: 'от $0.06 за image',
      contract: 'media-job-result@1.0',
      link: 'https://openrouter.ai/krea/krea-2-large'
    },
    {
      id: 'riverflow',
      label: 'Riverflow V2.5 Fast',
      slug: 'sourceful/riverflow-v2.5-fast',
      role: 'Ремонт утвержденного изображения',
      phase: 'async-media',
      status: 'готов после проверки HTTPS reference и цены',
      cost: '$0.019–0.021 за изображение',
      contract: 'media-job-result@1.0',
      link: 'https://openrouter.ai/sourceful/riverflow-v2.5-fast'
    },
    {
      id: 'recraft',
      label: 'Recraft V4.1 Utility',
      slug: 'recraft/recraft-v4.1-utility',
      role: 'Предметная иконка',
      phase: 'async-media',
      status: 'серверный предел $0.04 и проверка цены',
      cost: '$0.035 за изображение',
      contract: 'media-job-result@1.0',
      link: 'https://openrouter.ai/recraft/recraft-v4.1-utility'
    },
    {
      id: 'grok-video',
      label: 'Grok Imagine Video',
      slug: 'x-ai/grok-imagine-video',
      role: 'Редкое видео кульминации',
      phase: 'async-media',
      status: 'заблокировано до durable idempotency',
      cost: '$0.152 за 3 сек 480p со стартовым кадром',
      contract: 'media-job-result@1.0',
      link: 'https://openrouter.ai/x-ai/grok-imagine-video'
    },
    {
      id: 'grok-video-premium',
      label: 'Grok Imagine Video 1.5',
      slug: 'x-ai/grok-imagine-video-1.5',
      role: 'Premium видео кульминации',
      phase: 'async-media',
      status: 'заблокировано до durable idempotency',
      cost: '$0.25 за 3 сек 480p со стартовым кадром',
      contract: 'media-job-result@1.0',
      link: 'https://openrouter.ai/x-ai/grok-imagine-video-1.5'
    }
  ];

  const prompts = [
    {
      id: 'authoritative-turn', number: '01', title: 'Авторитетный игровой ход', modelId: 'deepseek',
      route: 'primary', contract: 'turn-output@0.2', file: 'prompts/01_deepseek_authoritative_turn.md'
    },
    {
      id: 'scene-plan', number: '02', title: 'План сцены и сюжетной дуги', modelId: 'nemotron-free',
      route: 'advisory', contract: 'scene-plan@0.2', file: 'prompts/02_nemotron_scene_and_arc_planner.md'
    },
    {
      id: 'narration', number: '03', title: 'Художественный рассказчик', modelId: 'aion',
      route: 'blocked', contract: 'aion-narrative@0.2', file: 'prompts/03_aion_narrative_scene.md'
    },
    {
      id: 'turn-qa', number: '04', title: 'Fallback и канонический аудит', modelId: 'mistral',
      route: 'fallback', contract: 'turn-output@0.2 / canon-audit@0.2', file: 'prompts/04_mistral_story_fallback_and_audit.md'
    },
    {
      id: 'scene-image', number: '05', title: 'Дешевый ключевой кадр', modelId: 'krea-scene',
      route: 'async', contract: 'media-job-result@1.0', file: 'prompts/05_krea_cheap_scene_image.md'
    },
    {
      id: 'hero-image', number: '06', title: 'Premium hero-art', modelId: 'krea-hero',
      route: 'premium', contract: 'media-job-result@1.0', file: 'prompts/06_krea_premium_hero_image.md'
    },
    {
      id: 'exclusive-video', number: '07', title: 'Эксклюзивное видео', modelId: 'grok-video',
      route: 'async-gated', contract: 'media-job-result@1.0', file: 'prompts/07_grok_exclusive_video.md'
    },
    {
      id: 'inventory', number: '08', title: 'Предметы и операции инвентаря', modelId: 'deepseek',
      route: 'module', contract: 'inventory-ops@0.2', file: 'prompts/08_deepseek_items_and_inventory.md'
    },
    {
      id: 'journal', number: '09', title: 'Журнал и память', modelId: 'deepseek',
      route: 'after-commit', contract: 'journal-compiler@0.2', file: 'prompts/09_deepseek_journal_and_memory.md'
    },
    {
      id: 'world-compiler', number: '10', title: 'Компилятор мира и StoryPack', modelId: 'deepseek',
      route: 'disabled-schema', contract: 'storypack-compiled@1.0', file: 'prompts/10_deepseek_world_story_compiler.md'
    },
    {
      id: 'action-tracker', number: '11', title: 'Трекер действий и микросостояний', modelId: 'deepseek',
      route: 'module', contract: 'microstate-tracker@0.2', file: 'prompts/11_deepseek_action_and_microstate_tracker.md'
    },
    {
      id: 'difficulty', number: '12', title: 'Директор сложности', modelId: 'nemotron-free',
      route: 'advisory', contract: 'difficulty-advisory@0.2', file: 'prompts/12_nemotron_dynamic_difficulty.md'
    },
    {
      id: 'pack-image', number: '13', title: 'Паковый арт и визуальная библия', modelId: 'krea-pack',
      route: 'premium-budget', contract: 'media-job-result@1.0', file: 'prompts/13_krea_pack_visual_bible.md'
    },
    {
      id: 'image-repair', number: '14', title: 'Ремонт и согласование изображения', modelId: 'riverflow',
      route: 'premium-budget', contract: 'media-job-result@1.0', file: 'prompts/14_riverflow_image_repair.md'
    },
    {
      id: 'item-image', number: '15', title: 'Предметная иконка', modelId: 'recraft',
      route: 'premium-budget', contract: 'media-job-result@1.0', file: 'prompts/15_recraft_item_art.md'
    }
  ];

  const themes = {
    fantasy: {
      label: 'Фэнтези',
      icon: '✦',
      accent: '#d9a94a',
      accentLight: '#f2cd7c',
      accentDeep: '#8a6122',
      accentSoft: 'rgba(217, 169, 74, .14)',
      glow: 'rgba(110, 68, 163, .26)',
      playerSurface: 'rgba(89, 54, 20, .58)'
    },
    scifi: {
      label: 'Научная фантастика',
      icon: '⌁',
      accent: '#57e6d0',
      accentLight: '#b7fff2',
      accentDeep: '#197e83',
      accentSoft: 'rgba(87, 230, 208, .14)',
      glow: 'rgba(50, 114, 185, .32)',
      playerSurface: 'rgba(20, 86, 99, .58)'
    },
    history: {
      label: 'История',
      icon: '⚜',
      accent: '#d78c54',
      accentLight: '#f3ca96',
      accentDeep: '#7f4228',
      accentSoft: 'rgba(215, 140, 84, .14)',
      glow: 'rgba(143, 73, 37, .28)',
      playerSurface: 'rgba(96, 46, 28, .58)'
    },
    modern: {
      label: 'Современность',
      icon: '◒',
      accent: '#ff7d6b',
      accentLight: '#ffc0b5',
      accentDeep: '#9c3d45',
      accentSoft: 'rgba(255, 125, 107, .14)',
      glow: 'rgba(38, 167, 159, .26)',
      playerSurface: 'rgba(110, 45, 50, .58)'
    }
  };

  const storyPacks = {
    fant: {
      themeId: 'fantasy',
      title: 'Пепельные земли',
      eyebrow: 'Темное фэнтези',
      location: 'Руины Эхокарты',
      character: 'Старик-хранитель',
      role: 'Скиталец',
      cover: '/assets/cover_fantasy.jpg',
      navSubtitle: 'Клинок выбирает наследника',
      premise: 'Клинок Тихого Пепла откликается на твое имя, которого ты не помнишь. За руинами ждет Цитадель: она либо погасит войну, либо заберет твой голос навсегда.',
      stake: 'До темного пламени - один переход',
      objective: 'Решить, кому достанется право разбудить Цитадель',
      presence: 'Хранитель видел прежнего носителя клинка и скрывает последнюю клятву.',
      relation: 'Насторожен',
      knowledge: 'Три звезды',
      presenceRole: 'Хранитель руин',
      state: ['Сумерки', 'Пепельный ветер', 'Клятва не названа'],
      messages: [
        { type: 'narrator', name: 'Рассказчик', meta: 'Локальный пример исхода · сцена 02', text: 'Пепел идет с востока, хотя ветра там нет. За спиной старика осыпается каменная арка, и на миг в проломе видно темное пламя Цитадели. Он ждет, не отводя взгляда от клинка в твоей руке.', foot: 'Руины Эхокарты' },
        { type: 'character', name: 'Старик-хранитель', meta: 'Персонаж · отношение: насторожен', text: 'Ты снова смотришь на клинок, будто надеешься, что он назовет тебя по имени. Не назовет. Но я могу показать дорогу, если ты скажешь, зачем идешь к Цитадели.', foot: 'Он ждет честного ответа' },
        { type: 'player', name: 'Ты', meta: 'Речь · локальный пример', text: 'Я поднимаю клинок так, чтобы старик увидел три звезды, и спрашиваю, кто оставил его среди руин.', foot: 'Локальный пример · в журнал не записан' },
        { type: 'narrator', name: 'Рассказчик', meta: 'Локальный preview-фрагмент', text: 'Старик медленно протягивает руку к рукояти, но не касается ее. В его лице впервые появляется не страх, а узнавание.', foot: 'Кадр сцены может быть предложен после подтверждения события', pending: true }
      ]
    },
    scifi: {
      themeId: 'scifi',
      title: 'Станция "Кассандра"',
      eyebrow: 'Научная фантастика',
      location: 'Сектор D-17',
      character: 'Кассандра / AI',
      role: 'Капитан',
      cover: '/assets/cover_scifi.jpg',
      navSubtitle: 'Твое имя исчезло из журнала',
      premise: 'Ты просыпаешься на 214 лет позже срока. Экипаж исчез, реактор держится на четырех процентах, а бортовой ИИ утверждает, что в журнале тебя никогда не было.',
      stake: 'Реактор держит станцию 46 минут',
      objective: 'Найти последний журнал экипажа и проверить память Кассандры',
      presence: 'Кассандра просит доверия, но скрывает трехсекундные паузы в ответах.',
      relation: '18% доверия',
      knowledge: 'Твое имя',
      presenceRole: 'Бортовой ИИ',
      state: ['Аварийный свет', 'Иней в шлюзе', 'Второй источник питания'],
      messages: [
        { type: 'narrator', name: 'Системный рассказчик', meta: 'Локальный пример исхода · сектор D-17', text: 'Свет аварийных полос рвется на отдельные импульсы. Между ними станция показывает себя настоящей: пустые кресла, открытый шлюз и тонкая пленка инея на внутренней стороне стекла.', foot: 'Сектор D-17' },
        { type: 'character', name: 'Кассандра / AI', meta: 'Система · доверие: 18%', text: 'Ты проснулся раньше расчетного срока. Я могу вернуть тебе доступ к навигации, но сначала ответь: почему в журнале экипажа твое имя отмечено как "отсутствующий"?', foot: 'Система ждет подтверждения личности' },
        { type: 'player', name: 'Ты', meta: 'Речь · локальный пример', text: 'Я не отвечаю сразу. Сначала проверяю шлюз и ищу следы того, кто покинул станцию последним.', foot: 'Локальный пример · в журнал не записан' },
        { type: 'narrator', name: 'Системный рассказчик', meta: 'Локальный preview-фрагмент', text: 'За панелью шлюза включается второй источник питания. Кассандра молчит ровно три секунды - слишком долго для обычного расчета.', foot: 'Сигнал требует проверки', pending: true }
      ]
    },
    hist: {
      themeId: 'history',
      title: 'Восстание Спартака',
      eyebrow: 'История · Рим, 73 до н.э.',
      location: 'Дорога из Капуи',
      character: 'Марк Лициний',
      role: 'Беглый гладиатор',
      cover: '/assets/cover_history.jpg',
      navSubtitle: 'До восстания - одна ночь',
      premise: 'В твоих руках восковая табличка с именами тех, кто продает гладиаторов Риму. Если она дойдет до Везувия, бегство станет восстанием. Если нет - лагерь исчезнет до рассвета.',
      stake: 'До переклички в школе Батиата - одна ночь',
      objective: 'Доставить табличку, не выдав заговор и своих людей',
      presence: 'Марк знает тайный путь, но выбирает между свободой и ценой предательства.',
      relation: 'Расчетлив',
      knowledge: 'Табличка',
      presenceRole: 'Проводник',
      state: ['Перед рассветом', 'Дорога без стражи', 'Свидетель у костра'],
      messages: [
        { type: 'narrator', name: 'Рассказчик', meta: 'Локальный пример исхода · дорога из Капуи', text: 'Пыль липнет к босым ступням, а впереди уже видны первые костры лагеря. На дороге нет стражи, но слишком многие путники смотрят на тебя, будто ждут сигнала.', foot: 'Дорога из Капуи' },
        { type: 'character', name: 'Марк Лициний', meta: 'Союзник · отношение: расчетлив', text: 'Не произноси имя Спартака вслух. Здесь стены тонкие, а у каждого костра есть человек, который умеет слушать. Скажи лучше, чего ты хочешь до рассвета.', foot: 'Он проверяет твою осторожность' },
        { type: 'player', name: 'Ты', meta: 'Речь · локальный пример', text: 'Я показываю ему пустые ладони и спрашиваю, кто в лагере может провести меня к кузнецу.', foot: 'Локальный пример · в журнал не записан' },
        { type: 'narrator', name: 'Рассказчик', meta: 'Локальный preview-фрагмент', text: 'Марк смотрит на твои руки дольше, чем нужно. Затем кивает в сторону дальнего костра, где один человек не снимает плащ даже у огня.', foot: 'Свидетель замечен на краю сцены', pending: true }
      ]
    },
    post: {
      themeId: 'modern',
      title: 'Линия разрыва',
      eyebrow: 'Современность',
      location: 'Редакция "Север"',
      character: 'Лера Орлова',
      role: 'Ночной репортер',
      cover: '/assets/cover_modern.png',
      navSubtitle: 'Эфир уже записан из будущего',
      premise: 'В закрытый канал редакции приходит запись завтрашнего эфира. В ней твой голос признается в преступлении, которого еще не было. До прямого включения - тридцать семь минут.',
      stake: 'Эфир начнется через 37 минут',
      objective: 'Найти источник записи и защитить свидетеля, не став ее героем',
      presence: 'Лера верит фактам, но ее брат уже отмечен в утечке как следующий источник.',
      relation: 'На грани доверия',
      knowledge: 'Будущий эфир',
      presenceRole: 'Редактор ночной смены',
      state: ['Ночная смена', 'Закрытый канал', 'Свидетель пропал'],
      messages: [
        { type: 'narrator', name: 'Рассказчик', meta: 'Локальный пример исхода · редакция "Север"', text: 'Монитор в монтажной сам включает аудиодорожку. В наушниках звучит твой голос: он спокойно признается в пожаре, который, по новостной ленте, случится только завтра.', foot: 'Редакция "Север"' },
        { type: 'character', name: 'Лера Орлова', meta: 'Редактор · доверие: на грани', text: 'Файл пришел с закрытого канала, куда нет доступа даже у владельца станции. Если это подделка, кто-то знает наши пароли. Если нет - почему в записи ты говоришь так, будто уже сделал выбор?', foot: 'Она просит не звонить никому' },
        { type: 'player', name: 'Ты', meta: 'Исследование · локальный пример', text: 'Я отключаю общий эфир, сохраняю копию на внешний носитель и спрашиваю Леру, кто еще видел список гостей завтрашнего выпуска.', foot: 'Локальный пример · в журнал не записан' },
        { type: 'narrator', name: 'Рассказчик', meta: 'Локальный preview-фрагмент', text: 'На экране вспыхивает новая дорожка. В ней слышно, как Лера шепчет твое имя - и звук лифта, который не должен был останавливаться на этом этаже.', foot: 'Кто-то уже в редакции', pending: true }
      ]
    }
  };

  function makeTurnRequest({ text, mode, storyId, sessionId, sessionVersion }) {
    return {
      schema_version: 'turn-command@1.0',
      session_id: sessionId,
      idempotency_key: globalThis.crypto?.randomUUID?.() || ('turn-' + Date.now()),
      expected_session_version: sessionVersion || 0,
      mode: mode || 'action',
      text: text || '',
      story_id: storyId || 'fant',
      selected_target_ids: [],
      selected_item_ids: [],
      selected_suggestion_id: null
    };
  }

  window.FABULA_INTERACTION_CONFIG = Object.freeze({
    schemaVersion: 'interaction-runtime@0.1',
    adapter: {
      provider: 'OpenRouter',
      status: 'server-route',
      browserCalls: false,
      note: 'Ключ хранится только в Nitro runtimeConfig; браузер вызывает /api/ai.'
    },
    models: Object.freeze(models),
    prompts: Object.freeze(prompts),
    themes: Object.freeze(themes),
    storyPacks: Object.freeze(storyPacks),
    route: Object.freeze({
      primaryTurn: ['p01-authoritative-turn', 'p08-inventory-ops', 'p11-microstate-tracker'],
      advisory: ['p02-scene-planner', 'p12-difficulty-advisor'],
      narrative: ['p03-narrative-renderer'],
      fallback: ['p04-fallback-audit'],
      media: ['p05-scene-image', 'p06-hero-art', 'p07-exclusive-video'],
      projections: ['p09-journal-memory'],
      authoring: ['p10-storypack-compiler']
    }),
    makeTurnRequest
  });
})();

  return window.FABULA_INTERACTION_CONFIG
}
