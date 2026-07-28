(function () {
  const config = window.FABULA_INTERACTION_CONFIG;
  if (!config) return;

  const app = document.getElementById('interactionApp');
  const chatScroll = document.getElementById('chatScroll');
  const composer = document.getElementById('composer');
  const input = document.getElementById('playerInput');
  const count = document.getElementById('composerCount');
  const hint = document.getElementById('composerHint');
  const modal = document.getElementById('toolModal');
  const modalBody = document.getElementById('toolModalBody');
  const modalTitle = document.getElementById('toolModalTitle');
  const modalKicker = document.getElementById('toolModalKicker');
  const scrim = document.getElementById('appScrim');
  const toastEl = document.getElementById('toast');
  const storyTitle = document.getElementById('storyTitle');
  const storyEyebrow = document.getElementById('storyEyebrow');
  const characterName = document.getElementById('characterName');
  const railCharacterName = document.getElementById('railCharacterName');
  const storyLocation = document.getElementById('storyLocation');

  let storyId = new URLSearchParams(location.search).get('story') || 'fant';
  let mode = 'action';
  let sessionVersion = 2;
  let toastTimer = null;

  const storyFixtures = {
    fant: {
      messages: [
        { type: 'narrator', name: 'Рассказчик', meta: 'Подтвержденный исход · сцена 02', text: 'Пепел идет с востока, хотя ветра там нет. За спиной старика осыпается каменная арка, и на миг в проломе видно темное пламя Цитадели. Он ждет, не отводя взгляда от клинка в твоей руке.', foot: 'Руины Эхокарты' },
        { type: 'character', name: 'Старик-хранитель', meta: 'Персонаж · отношение: насторожен', text: 'Ты снова смотришь на клинок, будто надеешься, что он назовет тебя по имени. Не назовет. Но я могу показать дорогу, если ты скажешь, зачем идешь к Цитадели.', foot: 'Он ждет честного ответа' },
        { type: 'player', name: 'Ты', meta: 'Речь · только что', text: 'Я поднимаю клинок так, чтобы старик увидел три звезды, и спрашиваю, кто оставил его среди руин.', foot: 'Ход записан в журнал' },
        { type: 'narrator', name: 'Рассказчик', meta: 'Готовит последствие', text: 'Старик медленно протягивает руку к рукояти, но не касается ее. В его лице впервые появляется не страх, а узнавание.', foot: 'Кадр сцены может быть предложен после подтверждения события', pending: true }
      ]
    },
    scifi: {
      messages: [
        { type: 'narrator', name: 'Системный рассказчик', meta: 'Подтвержденный исход · сектор D-17', text: 'Свет аварийных полос рвется на отдельные импульсы. Между ними станция показывает себя настоящей: пустые кресла, открытый шлюз и тонкая пленка инея на внутренней стороне стекла.', foot: 'Сектор D-17' },
        { type: 'character', name: 'Кассандра / AI', meta: 'Система · доверие: 18%', text: 'Ты проснулся раньше расчетного срока. Я могу вернуть тебе доступ к навигации, но сначала ответь: почему в журнале экипажа твое имя отмечено как "отсутствующий"?', foot: 'Система ждет подтверждения личности' },
        { type: 'player', name: 'Ты', meta: 'Речь · только что', text: 'Я не отвечаю сразу. Сначала проверяю шлюз и ищу следы того, кто покинул станцию последним.', foot: 'Ход записан в журнал' },
        { type: 'narrator', name: 'Системный рассказчик', meta: 'Готовит последствие', text: 'За панелью шлюза включается второй источник питания. Кассандра молчит ровно три секунды - слишком долго для обычного расчета.', foot: 'Сигнал требует проверки', pending: true }
      ]
    },
    hist: {
      messages: [
        { type: 'narrator', name: 'Рассказчик', meta: 'Подтвержденный исход · дорога из Капуи', text: 'Пыль липнет к босым ступням, а впереди уже видны первые костры лагеря. На дороге нет стражи, но слишком многие путники смотрят на тебя, будто ждут сигнала.', foot: 'Дорога из Капуи' },
        { type: 'character', name: 'Марк Лициний', meta: 'Союзник · отношение: расчетлив', text: 'Не произноси имя Спартака вслух. Здесь стены тонкие, а у каждого костра есть человек, который умеет слушать. Скажи лучше, чего ты хочешь до рассвета.', foot: 'Он проверяет твою осторожность' },
        { type: 'player', name: 'Ты', meta: 'Речь · только что', text: 'Я показываю ему пустые ладони и спрашиваю, кто в лагере может провести меня к кузнецу.', foot: 'Ход записан в журнал' },
        { type: 'narrator', name: 'Рассказчик', meta: 'Готовит последствие', text: 'Марк смотрит на твои руки дольше, чем нужно. Затем кивает в сторону дальнего костра, где один человек не снимает плащ даже у огня.', foot: 'Свидетель замечен на краю сцены', pending: true }
      ]
    },
    post: {
      messages: [
        { type: 'narrator', name: 'Рассказчик', meta: 'Подтвержденный исход · старая водонапорная', text: 'Насос не работает, но вода внутри есть. На бетонном кольце остались свежие царапины, а на ступени лежит мокрый кусок ткани, которого не было утром.', foot: 'Старая водонапорная' },
        { type: 'character', name: 'Мира', meta: 'Союзник · отношение: осторожна', text: 'Если ты нашел это первым, значит, тот, кто оставил след, все еще рядом. Я не уйду без воды, но не стану ждать, пока нас заметят.', foot: 'Она готова рискнуть ради запаса' },
        { type: 'player', name: 'Ты', meta: 'Исследование · только что', text: 'Я осматриваю царапины, не поднимая ткань, и ищу направление, в котором уходил человек.', foot: 'Ход записан в журнал' },
        { type: 'narrator', name: 'Рассказчик', meta: 'Готовит последствие', text: 'Следы уходят к сухому руслу. На глине виден отпечаток тяжелого ботинка, а рядом - маленькая вмятина от металлического контейнера.', foot: 'Найдено новое направление', pending: true }
      ]
    }
  };

  const inventory = [
    { icon: '⚔', name: 'Клинок Тихого Пепла', meta: 'Легендарный · оружие', text: 'Я показываю Клинок Тихого Пепла.' },
    { icon: '✦', name: 'Амулет Трех Звезд', meta: 'Эпический · артефакт', text: 'Я показываю Амулет Трех Звезд.' },
    { icon: '❦', name: 'Обрывок карты', meta: 'Обычный · ключ', text: 'Я разворачиваю Обрывок карты и сверяю его с дорогой.' },
    { icon: '✚', name: 'Целебный мох', meta: 'Редкий · расходник', text: 'Я достаю Целебный мох и осматриваю его.' }
  ];

  const journal = [
    { title: 'Старик-хранитель', meta: 'Персонажи · сцена 02', text: 'Ждал носителя клинка двадцать лет.' },
    { title: 'Клинок Тихого Пепла', meta: 'Предметы · подтверждено', text: 'На лезвии три звезды над разбитой короной.' },
    { title: 'Тёмная Цитадель', meta: 'Места · открытое последствие', text: 'Горит на горизонте вечным пламенем.' }
  ];

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function currentStory() {
    return config.storyPacks[storyId] || config.storyPacks.fant;
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
  }

  function messageMarkup(message) {
    const safeText = escapeHTML(message.text).replace(/\n/g, '<br>');
    const avatar = message.type === 'character'
      ? '<span class="message-avatar avatar-character"><img src="assets/avatar.jpg" alt=""></span>'
      : message.type === 'player'
        ? '<span class="message-avatar avatar-player">Б</span>'
        : '<span class="message-avatar avatar-narrator">✦</span>';
    const actions = message.type === 'player'
      ? '<button type="button" data-message-action="edit" aria-label="Изменить действие">✎</button>'
      : '<button type="button" data-message-action="copy" aria-label="Скопировать сообщение">⧉</button><button type="button" data-message-action="retry" aria-label="Запросить другую формулировку">↻</button>';
    const extra = message.type === 'character'
      ? '<div class="character-mood"><span class="mood-dot"></span>' + escapeHTML(message.foot) + '</div>'
      : message.pending
        ? '<div class="message-media-hint"><span>◌</span><span>' + escapeHTML(message.foot) + '</span></div>'
        : '<div class="message-foot"><span>' + escapeHTML(message.foot) + '</span>' + actions + '</div>';
    return '<article class="message message-' + message.type + (message.pending ? ' message-pending' : '') + '">' +
      '<div class="message-head">' + avatar + '<span><strong>' + escapeHTML(message.name) + '</strong><small>' + escapeHTML(message.meta) + '</small></span></div>' +
      '<p>' + safeText + '</p>' + extra + '</article>';
  }

  function renderConversation() {
    const fixture = storyFixtures[storyId] || storyFixtures.fant;
    chatScroll.innerHTML = '<div class="day-divider"><span>СЕГОДНЯ · 21:14</span></div>' + fixture.messages.map(messageMarkup).join('');
    requestAnimationFrame(() => { chatScroll.scrollTop = chatScroll.scrollHeight; });
  }

  function applyStory(nextId) {
    storyId = config.storyPacks[nextId] ? nextId : 'fant';
    const story = currentStory();
    app.dataset.story = storyId;
    app.style.setProperty('--accent', story.accent);
    storyTitle.textContent = story.title;
    storyEyebrow.textContent = story.eyebrow;
    storyLocation.textContent = story.location;
    characterName.textContent = story.character;
    railCharacterName.textContent = story.character;
    document.title = 'ФАБУЛА · ' + story.title;
    document.querySelectorAll('.thread-item[data-story]').forEach((item) => item.classList.toggle('is-active', item.dataset.story === storyId));
    renderConversation();
  }

  function setMode(nextMode) {
    mode = nextMode;
    const labels = {
      action: ['Действие', 'Опиши действие, речь или исследование', 'Что ты делаешь?'],
      speech: ['Речь', 'Говори от лица своего персонажа', 'Что ты говоришь?'],
      exploration: ['Исследование', 'Опиши, что именно ты проверяешь вокруг', 'Что ты исследуешь?']
    };
    const current = labels[mode] || labels.action;
    hint.textContent = current[1];
    input.placeholder = current[2];
    document.querySelectorAll('.mode-button').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    try { localStorage.setItem('fabula-interaction-mode', mode); } catch (_) {}
  }

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
    count.textContent = input.value.length + ' / 1200';
  }

  function appendDemoTurn(text) {
    const user = { type: 'player', name: 'Ты', meta: mode === 'speech' ? 'Речь · только что' : mode === 'exploration' ? 'Исследование · только что' : 'Действие · только что', text, foot: 'Локальный demo fixture' };
    chatScroll.insertAdjacentHTML('beforeend', messageMarkup(user));
    const pending = { type: 'narrator', name: 'Рассказчик', meta: 'Демо-ответ · adapter не подключен', text: mode === 'speech' ? 'Старик не отвечает сразу. Его взгляд скользит от твоего лица к клинку, а затем возвращается обратно - теперь уже без прежнего недоверия.' : mode === 'exploration' ? 'Ты замечаешь две вещи: свежую пыль на внутренней стороне арки и следы сапог, ведущие не к Цитадели, а обратно к руинам.' : 'Действие принято как намерение. Серверный движок проверит доступность, риск и последствия перед изменением канона.', foot: 'Ничего не записано в канон до server commit', pending: true };
    const pendingNode = document.createElement('div');
    pendingNode.className = 'demo-pending';
    pendingNode.innerHTML = '<div class="message pending-placeholder"><span class="loading-dots">● ● ●</span><span>Собираю demo-ответ для проверки интерфейса</span></div>';
    chatScroll.appendChild(pendingNode);
    chatScroll.scrollTop = chatScroll.scrollHeight;
    const request = config.makeTurnRequest({ text, mode, storyId, sessionVersion });
    window.__fabulaLastTurnRequest = request;
    sessionVersion += 1;
    setTimeout(() => {
      pendingNode.outerHTML = messageMarkup(pending);
      chatScroll.scrollTop = chatScroll.scrollHeight;
      document.querySelector('.turn-badge').innerHTML = '<i></i> Твой ход';
      showToast('Demo-ответ добавлен локально');
    }, 720);
  }

  function submitTurn() {
    const text = input.value.trim();
    if (!text) {
      input.focus();
      showToast('Сначала опиши свое намерение');
      return;
    }
    appendDemoTurn(text);
    input.value = '';
    resizeInput();
    document.querySelector('.turn-badge').innerHTML = '<i></i> Ход собирается';
  }

  function closeModal() {
    if (modal.open) modal.close();
  }

  function modelForPrompt(prompt) {
    return config.models.find((model) => model.id === prompt.modelId) || {};
  }

  function renderModels() {
    const modelCards = config.models.map((model) => '<div class="model-catalog-card"><strong>' + escapeHTML(model.label) + '</strong><small>' + escapeHTML(model.slug) + '</small><b>' + escapeHTML(model.phase) + ' · ' + escapeHTML(model.status) + '</b></div>').join('');
    const rows = config.prompts.map((prompt) => {
      const model = modelForPrompt(prompt);
      const statusClass = prompt.route === 'primary' ? 'primary' : prompt.route.indexOf('async') === 0 || prompt.route === 'premium' ? 'async' : prompt.route === 'advisory' ? 'advisory' : '';
      return '<div class="prompt-row"><span class="prompt-number">' + prompt.number + '</span><span><strong>' + escapeHTML(prompt.title) + '</strong><small>' + escapeHTML(model.label) + ' · ' + escapeHTML(prompt.contract) + '</small></span><span class="prompt-status ' + statusClass + '">' + escapeHTML(prompt.route) + '</span></div>';
    }).join('');
    return '<div class="model-summary"><span>⌘</span><span><strong>OpenRouter transport подготовлен</strong><small>browserCalls: false · server-owned budget and secrets</small></span></div><p class="modal-note">Все модели остаются серверными seams: только авторитетный ход меняет состояние, advisory-модели предлагают, media работает асинхронно.</p><div class="model-catalog-grid">' + modelCards + '</div><div class="prompt-list-heading">12 prompt-модулей</div><div class="prompt-list">' + rows + '</div><div class="modal-actions"><a class="modal-button primary" href="https://openrouter.ai" target="_blank" rel="noopener">Открыть OpenRouter</a></div>';
  }

  function renderInventory() {
    return '<p class="modal-note">Предмет можно добавить в composer как намерение. Финальная операция принадлежит авторитетному ходу.</p><div class="inventory-list">' + inventory.map((item) => '<div class="inventory-item"><span class="inventory-symbol">' + item.icon + '</span><span><strong>' + escapeHTML(item.name) + '</strong><small>' + escapeHTML(item.meta) + '</small></span><button class="insert-button" type="button" data-insert="' + escapeHTML(item.text) + '">В ход</button></div>').join('') + '</div>';
  }

  function renderJournal() {
    return '<p class="modal-note">Журнал - проекция подтвержденных событий. Его записи не создают параллельный канон.</p><div class="journal-list">' + journal.map((item) => '<div class="journal-item"><span>✒</span><span><strong>' + escapeHTML(item.title) + '</strong><small>' + escapeHTML(item.meta) + ' · ' + escapeHTML(item.text) + '</small></span><button class="insert-button" type="button" data-insert="' + escapeHTML(item.text) + '">В ход</button></div>').join('') + '</div>';
  }

  function renderCharacter() {
    return '<div class="character-sheet"><div class="sheet-portrait"><img src="assets/avatar.jpg" alt="Портрет Безымянного"></div><div class="sheet-copy"><h3>Безымянный</h3><p>' + escapeHTML(currentStory().role) + ' · уровень 7</p><div class="sheet-stats"><div class="sheet-stat"><b>31</b><small>здоровье</small></div><div class="sheet-stat"><b>14</b><small>защита</small></div><div class="sheet-stat"><b>248</b><small>золото</small></div></div><div class="meter"><i></i></div></div></div><div class="modal-actions"><button class="modal-button primary" type="button" data-tool="inventory">Открыть инвентарь</button></div>';
  }

  function renderCheck() {
    return '<p class="modal-note">Проверка остается инструментом игрока. В runtime итоговый порог и typed operations решает сервер.</p><div class="modal-grid"><div class="modal-card"><h3>Ловкость</h3><p>Тихо обойти разрушенную арку</p><div class="modal-meta"><b>+3</b> · пример · DC 13</div></div><div class="modal-card"><h3>Харизма</h3><p>Убедить старика говорить прямо</p><div class="modal-meta"><b>+4</b> · пример · DC 12</div></div><div class="modal-card"><h3>Разум</h3><p>Сопоставить герб и старые записи</p><div class="modal-meta"><b>+1</b> · пример · DC 14</div></div><div class="modal-card"><h3>Мудрость</h3><p>Замечать следы до того, как станет поздно</p><div class="modal-meta"><b>+1</b> · пример · DC 13</div></div></div>';
  }

  function renderSettings() {
    return '<div class="settings-group"><label>Тон сцены</label><div class="settings-segment"><button type="button" class="is-active">Мрачный</button><button type="button">Героический</button><button type="button">Ироничный</button></div></div><div class="settings-group"><label>Темп</label><div class="settings-segment"><button type="button" class="is-active">Спокойно</button><button type="button">Быстро</button></div></div><label class="settings-check"><input type="checkbox" checked> Показывать подсказки действий</label><div class="modal-actions"><button class="modal-button primary" type="button" data-close-modal>Сохранить для сессии</button></div>';
  }

  function openTool(tool) {
    const views = {
      models: ['КОНТУР OPENROUTER', 'Модели и промты', renderModels],
      inventory: ['ИНВЕНТАРЬ', 'Добавить предмет', renderInventory],
      journal: ['ЖУРНАЛ ПАМЯТИ', 'Подтвержденные события', renderJournal],
      character: ['ЛИСТ ПЕРСОНАЖА', 'Безымянный', renderCharacter],
      check: ['ПРОВЕРКА', 'Инструмент действия', renderCheck],
      settings: ['НАСТРОЙКИ СЦЕНЫ', 'Опыт взаимодействия', renderSettings]
    };
    const view = views[tool];
    if (!view) return;
    closeDrawers();
    modalKicker.textContent = view[0];
    modalTitle.textContent = view[1];
    modalBody.innerHTML = view[2]();
    if (!modal.open) modal.showModal();
  }

  function compose(text) {
    input.value = text;
    resizeInput();
    closeModal();
    input.focus();
    showToast('Добавлено в поле хода');
  }

  function openDrawer(name) {
    closeDrawers();
    const drawer = document.getElementById(name === 'threads' ? 'threadRail' : 'detailRail');
    if (!drawer) return;
    drawer.classList.add('is-open');
    scrim.hidden = false;
  }

  function closeDrawers() {
    document.querySelectorAll('.thread-rail.is-open, .detail-rail.is-open').forEach((drawer) => drawer.classList.remove('is-open'));
    scrim.hidden = true;
  }

  document.addEventListener('click', (event) => {
    const tool = event.target.closest('[data-tool]');
    if (tool) {
      event.preventDefault();
      openTool(tool.dataset.tool);
      return;
    }
    const drawerButton = event.target.closest('[data-drawer]');
    if (drawerButton) {
      openDrawer(drawerButton.dataset.drawer);
      return;
    }
    const closeDrawerButton = event.target.closest('[data-close-drawer]');
    if (closeDrawerButton) {
      closeDrawers();
      return;
    }
    const storyButton = event.target.closest('.thread-item[data-story]');
    if (storyButton) {
      applyStory(storyButton.dataset.story);
      closeDrawers();
      showToast('Открыта история: ' + currentStory().title);
      return;
    }
    const modeButton = event.target.closest('.mode-button[data-mode]');
    if (modeButton) {
      setMode(modeButton.dataset.mode);
      return;
    }
    const composeButton = event.target.closest('[data-compose]');
    if (composeButton) {
      compose(composeButton.dataset.compose);
      return;
    }
    const insertButton = event.target.closest('[data-insert]');
    if (insertButton) {
      compose(insertButton.dataset.insert);
      return;
    }
    const messageAction = event.target.closest('[data-message-action]');
    if (messageAction) {
      const action = messageAction.dataset.messageAction;
      if (action === 'copy') showToast('Текст сообщения скопирован в контекст');
      if (action === 'retry') showToast('Повтор будет доступен через серверный fallback');
      if (action === 'edit') {
        input.focus();
        showToast('Измени ход в поле ввода');
      }
      return;
    }
    const autoToggle = event.target.closest('[data-auto-toggle]');
    if (autoToggle) {
      autoToggle.classList.toggle('is-on');
      showToast(autoToggle.classList.contains('is-on') ? 'Автопродолжение включено' : 'Автопродолжение выключено');
    }
    const settingsButton = event.target.closest('.settings-segment button');
    if (settingsButton) {
      settingsButton.parentElement.querySelectorAll('button').forEach((button) => button.classList.remove('is-active'));
      settingsButton.classList.add('is-active');
    }
    const newThread = event.target.closest('[data-new-thread]');
    if (newThread) {
      input.value = '';
      resizeInput();
      input.focus();
      showToast('Новая сцена готова к первому ходу');
    }
    const searchThreads = event.target.closest('[data-search-threads]');
    if (searchThreads) {
      input.focus();
      showToast('Поиск сцен подключится к истории сессий');
    }
  });

  scrim.addEventListener('click', closeDrawers);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-modal]')) closeModal();
  });

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    submitTurn();
  });
  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submitTurn();
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input.focus();
    }
    if (event.key === 'Escape') closeDrawers();
  });

  const savedMode = (() => {
    try { return localStorage.getItem('fabula-interaction-mode'); } catch (_) { return null; }
  })();
  setMode(['action', 'speech', 'exploration'].includes(savedMode) ? savedMode : 'action');
  resizeInput();
  applyStory(storyId);
  window.__fabulaInteraction = { config, getStory: () => storyId, getMode: () => mode, openTool, buildTurnRequest: config.makeTurnRequest };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
