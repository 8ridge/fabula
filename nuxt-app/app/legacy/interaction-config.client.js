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
      id: 'deepseek-turn',
      label: 'DeepSeek V4 Flash',
      slug: 'deepseek/deepseek-v4-flash',
      role: 'Авторитетный ход',
      phase: 'runtime',
      status: 'primary',
      cost: '$0.00072 типовой ход',
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
      id: 'aion-narrative',
      label: 'Aion 3.0 Mini',
      slug: 'aion-labs/aion-3.0-mini',
      role: 'Художественный рассказчик',
      phase: 'optional',
      status: 'feature-flag',
      cost: '$0.0049 типовая сцена',
      contract: 'aion-narrative@0.2',
      privacy: 'Только подтвержденный brief',
      link: 'https://openrouter.ai/aion-labs/aion-3.0-mini'
    },
    {
      id: 'mistral-fallback',
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
      status: 'queued',
      cost: 'от $0.015 за image',
      contract: 'media-job@0.2',
      link: 'https://openrouter.ai/krea/krea-2-medium-turbo'
    },
    {
      id: 'krea-hero',
      label: 'Krea 2 Large',
      slug: 'krea/krea-2-large',
      role: 'Premium hero-art',
      phase: 'async-media',
      status: 'premium',
      cost: 'от $0.06 за image',
      contract: 'media-job@0.2',
      link: 'https://openrouter.ai/krea/krea-2-large'
    },
    {
      id: 'grok-video',
      label: 'Grok Imagine Video',
      slug: 'x-ai/grok-imagine-video',
      role: 'Редкое видео кульминации',
      phase: 'async-media',
      status: 'gated',
      cost: '$0.15-0.25 за 3-5 сек',
      contract: 'video-job@0.2',
      link: 'https://openrouter.ai/x-ai/grok-imagine-video'
    },
    {
      id: 'grok-video-15',
      label: 'Grok Imagine Video 1.5',
      slug: 'x-ai/grok-imagine-video-1.5',
      role: 'Premium видео кульминации',
      phase: 'async-media',
      status: 'premium',
      cost: '$0.24-0.40 за 3-5 сек',
      contract: 'video-job@0.2',
      link: 'https://openrouter.ai/x-ai/grok-imagine-video-1.5'
    }
  ];

  const prompts = [
    {
      id: 'p01-authoritative-turn', number: '01', title: 'Авторитетный игровой ход', modelId: 'deepseek-turn',
      route: 'primary', contract: 'turn-output@0.2', file: 'prompts/01_deepseek_authoritative_turn.md'
    },
    {
      id: 'p02-scene-planner', number: '02', title: 'План сцены и сюжетной дуги', modelId: 'nemotron-free',
      route: 'advisory', contract: 'scene-plan@0.2', file: 'prompts/02_nemotron_scene_and_arc_planner.md'
    },
    {
      id: 'p03-narrative-renderer', number: '03', title: 'Художественный рассказчик', modelId: 'aion-narrative',
      route: 'optional', contract: 'aion-narrative@0.2', file: 'prompts/03_aion_narrative_scene.md'
    },
    {
      id: 'p04-fallback-audit', number: '04', title: 'Fallback и канонический аудит', modelId: 'mistral-fallback',
      route: 'fallback', contract: 'canon-audit@0.2', file: 'prompts/04_mistral_story_fallback_and_audit.md'
    },
    {
      id: 'p05-scene-image', number: '05', title: 'Дешевый ключевой кадр', modelId: 'krea-scene',
      route: 'async', contract: 'media-job@0.2', file: 'prompts/05_krea_cheap_scene_image.md'
    },
    {
      id: 'p06-hero-art', number: '06', title: 'Premium hero-art', modelId: 'krea-hero',
      route: 'premium', contract: 'media-job@0.2', file: 'prompts/06_krea_premium_hero_image.md'
    },
    {
      id: 'p07-exclusive-video', number: '07', title: 'Эксклюзивное видео', modelId: 'grok-video',
      route: 'async-gated', contract: 'video-job@0.2', file: 'prompts/07_grok_exclusive_video.md'
    },
    {
      id: 'p08-inventory-ops', number: '08', title: 'Предметы и операции инвентаря', modelId: 'deepseek-turn',
      route: 'module', contract: 'inventory-ops@0.2', file: 'prompts/08_deepseek_items_and_inventory.md'
    },
    {
      id: 'p09-journal-memory', number: '09', title: 'Журнал и память', modelId: 'deepseek-turn',
      route: 'after-commit', contract: 'journal-projection@0.2', file: 'prompts/09_deepseek_journal_and_memory.md'
    },
    {
      id: 'p10-storypack-compiler', number: '10', title: 'Компилятор мира и StoryPack', modelId: 'deepseek-turn',
      route: 'pre-production', contract: 'storypack@0.2', file: 'prompts/10_deepseek_world_story_compiler.md'
    },
    {
      id: 'p11-microstate-tracker', number: '11', title: 'Трекер действий и микросостояний', modelId: 'deepseek-turn',
      route: 'module', contract: 'microstate-tracker@0.2', file: 'prompts/11_deepseek_action_and_microstate_tracker.md'
    },
    {
      id: 'p12-difficulty-advisor', number: '12', title: 'Директор сложности', modelId: 'nemotron-free',
      route: 'advisory', contract: 'difficulty-advisory@0.2', file: 'prompts/12_nemotron_dynamic_difficulty.md'
    }
  ];

  const storyPacks = {
    fant: {
      title: 'Пепельные земли',
      eyebrow: 'Темное фэнтези',
      location: 'Руины Эхокарты',
      character: 'Старик-хранитель',
      role: 'Скиталец',
      cover: '/assets/cover_fantasy.jpg',
      accent: '#d9a94a'
    },
    scifi: {
      title: 'Станция "Кассандра"',
      eyebrow: 'Хард sci-fi',
      location: 'Сектор D-17',
      character: 'Кассандра / AI',
      role: 'Капитан',
      cover: '/assets/cover_scifi.jpg',
      accent: '#54e6d0'
    },
    hist: {
      title: 'Восстание Спартака',
      eyebrow: 'Историческая линия',
      location: 'Дорога из Капуи',
      character: 'Марк Лициний',
      role: 'Беглый гладиатор',
      cover: '/assets/cover_history.jpg',
      accent: '#c9a865'
    },
    post: {
      title: 'После тишины',
      eyebrow: 'Пост-апок',
      location: 'Старая водонапорная',
      character: 'Мира',
      role: 'Искатель',
      cover: '/assets/cover_postapoc.jpg',
      accent: '#9bbf3a'
    }
  };

  function makeTurnRequest({ text, mode, storyId, sessionVersion }) {
    return {
      schema_version: 'turn-request@0.2',
      prompt_version: 'fabula-interaction@0.1',
      trace_id: globalThis.crypto?.randomUUID?.() || 'demo-trace',
      turn_id: globalThis.crypto?.randomUUID?.() || 'demo-turn',
      session_id: 'demo-session',
      expected_session_version: sessionVersion || 0,
      mode: mode || 'action',
      player_input: { text: text || '', target_ids: [], item_ids: [], selected_suggestion_id: null },
      scene: { scene_id: storyId || 'fant', mode: mode || 'action', location_id: null, present_character_ids: [] },
      pack_rules: { story_pack_id: storyId || 'fant', operation_catalog_version: 'ops@0.2' },
      resolution_randomness: { mode: 'server', server_roll: null, rule_version: 'rules@0.2' },
      authority: { reserved_ids: { events: [], facts: [], item_instances: [] }, allowed_operation_types: [] },
      policy_hints: { media_may_be_suggested: true, safety_profile: 'default' }
    };
  }

  window.FABULA_INTERACTION_CONFIG = Object.freeze({
    schemaVersion: 'interaction-runtime@0.1',
    adapter: {
      provider: 'OpenRouter',
      status: 'not_connected',
      browserCalls: false,
      note: 'Ключ и серверный transport подключаются вне браузера.'
    },
    models: Object.freeze(models),
    prompts: Object.freeze(prompts),
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
