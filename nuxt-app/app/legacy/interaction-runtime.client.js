import { installInteractionConfig } from './interaction-config.client'

export function mountInteractionRuntime(root) {
  installInteractionConfig();
  
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
  const selectionToolbar = document.getElementById('selectionToolbar');
  const selectionToolbarText = document.getElementById('selectionToolbarText');

  let storyId = new URLSearchParams(location.search).get('story') || 'fant';
  let mode = 'action';
  let fontScale = 'large';
  let sessionVersion = 2;
  let toastTimer = null;
  let selectionState = null;
  const inventoryState = { query: '', filter: 'all', selectedId: 'ash-blade' };

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
    { id: 'ash-blade', icon: '⚔', name: 'Клинок Тихого Пепла', category: 'weapon', categoryLabel: 'Оружие', rarity: 'legendary', rarityLabel: 'Легендарный', quantity: 1, condition: 'Цел', weight: '2.4 кг', description: 'Выкован из остывшего сердца павшей звезды. На лезвии три звезды над разбитой короной.', inspect: 'Клинок теплый, хотя вокруг стынет пепел. Он отзывается на прикосновение короткой дрожью.', text: 'Я показываю Клинок Тихого Пепла.' },
    { id: 'wanderer-cloak', icon: '☙', name: 'Плащ Скитальца', category: 'armor', categoryLabel: 'Броня', rarity: 'epic', rarityLabel: 'Эпический', quantity: 1, condition: 'Потерт', weight: '1.1 кг', description: 'Хранит тепло костров всех дорог, которые ты прошел. Подкладка скрывает несколько потайных швов.', inspect: 'На внутренней стороне вышиты названия мест, которых нет ни на одной карте.', text: 'Я расправляю Плащ Скитальца и проверяю потайные швы.' },
    { id: 'star-amulet', icon: '✦', name: 'Амулет Трех Звезд', category: 'artifact', categoryLabel: 'Артефакт', rarity: 'epic', rarityLabel: 'Эпический', quantity: 1, condition: 'Настроен', weight: '0.2 кг', description: 'Тот же герб, что и на клинке. Камень внутри амулета темнеет рядом с руинами.', inspect: 'Тепло амулета усиливается, когда ты смотришь на темное пламя Цитадели.', text: 'Я показываю Амулет Трех Звезд и жду реакции хранителя.' },
    { id: 'burnt-map', icon: '❦', name: 'Обрывок карты', category: 'key', categoryLabel: 'Ключ', rarity: 'common', rarityLabel: 'Обычный', quantity: 1, condition: 'Хрупкий', weight: '0.1 кг', description: 'Полусгоревший лист. Сквозь копоть виден только путь к каменному мосту.', inspect: 'Если поднести карту к пеплу, на полях проступает вторая линия.', text: 'Я разворачиваю Обрывок карты и сверяю его с дорогой.' },
    { id: 'healing-moss', icon: '✚', name: 'Целебный мох', category: 'consumable', categoryLabel: 'Расходник', rarity: 'rare', rarityLabel: 'Редкий', quantity: 2, condition: 'Свежий', weight: '0.3 кг', description: 'Растет только на пепле. Затягивает неглубокие раны и оставляет на коже холодный след.', inspect: 'Внутри мха мерцают крошечные серебряные точки - он еще сохраняет силу.', text: 'Я достаю Целебный мох и осматриваю его.' },
    { id: 'ash-salt', icon: '†', name: 'Пепельная соль', category: 'consumable', categoryLabel: 'Расходник', rarity: 'common', rarityLabel: 'Обычный', quantity: 5, condition: 'Сухая', weight: '0.6 кг', description: 'Отгоняет то, что бродит в ночи. Осталось пять щепоток.', inspect: 'Соль скрипит на ладони и темнеет возле следов, которых ты еще не видишь.', text: 'Я рассыпаю щепотку Пепельной соли у входа в руины.' },
    { id: 'house-seal', icon: '☖', name: 'Печать Дома', category: 'key', categoryLabel: 'Ключ', rarity: 'rare', rarityLabel: 'Редкий', quantity: 1, condition: 'Скрыта', weight: '0.2 кг', description: 'Открывает двери, о которых ты еще не знаешь. На обороте выбито имя, стертое наполовину.', inspect: 'Металл не остывает и едва заметно тянется к старой арке.', text: 'Я достаю Печать Дома и ищу на арке подходящий знак.' },
    { id: 'rust-compass', icon: '♆', name: 'Ржавый компас', category: 'artifact', categoryLabel: 'Артефакт', rarity: 'common', rarityLabel: 'Обычный', quantity: 1, condition: 'Сбоит', weight: '0.4 кг', description: 'Стрелка давно смотрит только на Цитадель, даже когда ты меняешь направление.', inspect: 'Компас на миг отклоняется от Цитадели и указывает на следы за твоей спиной.', text: 'Я открываю Ржавый компас и сравниваю его стрелку с дорогой.' }
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

  function messageText(article) {
    const copy = article && article.querySelector('.message-copy');
    return copy ? copy.textContent.trim() : article && article.querySelector('p') ? article.querySelector('p').textContent.trim() : '';
  }

  function makeTextVariant(text, kind) {
    const replacements = kind === 'regenerate'
      ? [
        [/Пепел идет/g, 'С востока тянется пепел'],
        [/Старик медленно/g, 'Хранитель осторожно'],
        [/Ты снова/g, 'Ты опять'],
        [/Ты замечаешь/g, 'Тебе открываются'],
        [/Марк смотрит/g, 'Марк задерживает взгляд'],
        [/впервые появляется/g, 'впервые проступает']
      ]
      : [
        [/Я поднимаю/g, 'Я медленно поднимаю'],
        [/Я показываю/g, 'Я раскрываю ладонь и показываю'],
        [/Я осматриваю/g, 'Я внимательно изучаю'],
        [/спрашиваю/g, 'пытаюсь выяснить'],
        [/идет/g, 'тянется'],
        [/смотрит/g, 'задерживает взгляд']
      ];
    let result = String(text || '').trim();
    replacements.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
    if (result === String(text || '').trim()) {
      const lower = result.charAt(0).toLowerCase() + result.slice(1);
      result = kind === 'regenerate'
        ? 'Сцена разворачивается иначе: ' + lower
        : 'Иначе это звучит так: ' + lower;
    }
    return result;
  }

  function generatedMessageActions() {
    return '<span class="message-actions"><button class="message-action-button" type="button" data-message-action="copy" aria-label="Скопировать сообщение" title="Скопировать">⧉<small>Копировать</small></button><button class="message-action-button" type="button" data-message-action="rephrase" aria-label="Переформулировать сообщение" title="Переформулировать">≋<small>Переформулировать</small></button><button class="message-action-button" type="button" data-message-action="regenerate" aria-label="Перегенерировать сообщение" title="Перегенерировать">↻<small>Перегенерировать</small></button></span>';
  }

  function playerMessageActions() {
    return '<span class="message-actions"><button class="message-action-button" type="button" data-message-action="edit" aria-label="Изменить действие" title="Изменить действие">✎<small>Изменить</small></button></span>';
  }

  function messageMarkup(message) {
    const safeText = escapeHTML(message.text).replace(/\n/g, '<br>');
    const avatar = message.type === 'character'
      ? '<span class="message-avatar avatar-character"><img src="/assets/avatar.jpg" alt=""></span>'
      : message.type === 'player'
        ? '<span class="message-avatar avatar-player">Б</span>'
        : '<span class="message-avatar avatar-narrator">✦</span>';
    const actions = message.type === 'player' ? playerMessageActions() : generatedMessageActions();
    const messageId = message.id ? ' data-message-id="' + escapeHTML(message.id) + '"' : '';
    const foot = '<div class="message-foot"><span>' + escapeHTML(message.foot) + '</span>' + actions + '</div>';
    const extra = message.type === 'character'
      ? '<div class="character-mood"><span class="mood-dot"></span>' + escapeHTML(message.foot) + '</div>' + foot
      : message.pending
        ? '<div class="message-media-hint"><span>◌</span><span>' + escapeHTML(message.foot) + '</span></div>' + foot
        : foot;
    return '<article class="message message-' + message.type + (message.pending ? ' message-pending' : '') + '"' + messageId + '>' +
      '<div class="message-head">' + avatar + '<span><strong>' + escapeHTML(message.name) + '</strong><small>' + escapeHTML(message.meta) + '</small></span></div>' +
      '<div class="message-copy"><p>' + safeText + '</p></div>' + extra + '</article>';
  }

  function renderConversation() {
    const fixture = storyFixtures[storyId] || storyFixtures.fant;
    chatScroll.innerHTML = '<div class="day-divider"><span>СЕГОДНЯ · 21:14</span></div>' + fixture.messages.map(messageMarkup).join('');
    requestAnimationFrame(() => { chatScroll.scrollTop = chatScroll.scrollHeight; });
  }

  function copyText(text, successMessage) {
    const value = String(text || '').trim();
    if (!value) return;
    const fallback = () => {
      const helper = document.createElement('textarea');
      helper.value = value;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      try { document.execCommand('copy'); } catch (_) {}
      helper.remove();
      showToast(successMessage || 'Текст скопирован');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(() => showToast(successMessage || 'Текст скопирован')).catch(fallback);
      return;
    }
    fallback();
  }

  function renderVariantCard(article, variant) {
    if (!article) return;
    const previous = article.querySelector('.message-variant');
    if (previous) previous.remove();
    const card = document.createElement('div');
    card.className = 'message-variant';
    card.dataset.variantCard = 'true';
    card.innerHTML = '<div class="variant-head"><span><i>✧</i>' + escapeHTML(variant.label) + '</span><button type="button" data-variant-action="dismiss" aria-label="Скрыть вариант">×</button></div>' +
      (variant.selectionText ? '<blockquote>"' + escapeHTML(variant.selectionText) + '"</blockquote>' : '') +
      '<p>' + escapeHTML(variant.text) + '</p>' +
      '<div class="variant-foot"><span>Локальный вариант · канон не изменен</span><span class="variant-actions"><button class="variant-button primary" type="button" data-variant-action="apply">Применить</button><button class="variant-button" type="button" data-variant-action="dismiss">Скрыть</button></span></div>';
    card.__fabulaVariant = variant;
    article.appendChild(card);
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function applyVariantCard(card) {
    const article = card && card.closest('.message');
    const copy = article && article.querySelector('.message-copy p');
    const variant = card && card.__fabulaVariant;
    if (!article || !copy || !variant) return;
    const original = article.dataset.originalText || variant.originalText || copy.textContent;
    if (!article.dataset.originalText) article.dataset.originalText = original;
    let nextText = variant.text;
    if (variant.selectionText) {
      const start = original.indexOf(variant.selectionText);
      nextText = start === -1 ? original : original.slice(0, start) + variant.text + original.slice(start + variant.selectionText.length);
    }
    copy.textContent = nextText;
    article.classList.add('is-rewritten');
    card.innerHTML = '<div class="variant-applied"><span><i>✓</i> Вариант отображается локально</span><button type="button" data-variant-action="restore">Вернуть оригинал</button></div>';
    card.__fabulaOriginalText = original;
    showToast('Вариант применен только в отображении');
  }

  function restoreVariantCard(card) {
    const article = card && card.closest('.message');
    const copy = article && article.querySelector('.message-copy p');
    if (!article || !copy) return;
    copy.textContent = article.dataset.originalText || card.__fabulaOriginalText || copy.textContent;
    delete article.dataset.originalText;
    article.classList.remove('is-rewritten');
    card.remove();
    showToast('Оригинальная формулировка восстановлена');
  }

  function regenerateMessage(article, kind) {
    const original = article && (article.dataset.originalText || messageText(article));
    if (!original) return;
    renderVariantCard(article, {
      kind,
      label: kind === 'rephrase' ? 'Переформулировка' : 'Новый вариант ответа',
      text: makeTextVariant(original, kind),
      originalText: original
    });
    showToast(kind === 'rephrase' ? 'Готова другая формулировка' : 'Готов новый вариант сцены');
  }

  function hideSelectionToolbar() {
    selectionState = null;
    if (!selectionToolbar) return;
    selectionToolbar.hidden = true;
    selectionToolbar.classList.remove('is-below');
  }

  function elementFromNode(node) {
    return node && node.nodeType === Node.ELEMENT_NODE ? node : node && node.parentElement;
  }

  function positionSelectionToolbar(rect) {
    if (!selectionToolbar || selectionToolbar.hidden) return;
    const toolbarRect = selectionToolbar.getBoundingClientRect();
    const margin = 10;
    const halfWidth = toolbarRect.width / 2;
    const left = Math.max(margin + halfWidth, Math.min(window.innerWidth - margin - halfWidth, rect.left + rect.width / 2));
    const above = rect.top > toolbarRect.height + 22;
    selectionToolbar.classList.toggle('is-below', !above);
    selectionToolbar.style.left = left + 'px';
    selectionToolbar.style.top = (above ? rect.top - 10 : rect.bottom + 10) + 'px';
  }

  function showSelectionToolbar(nextState) {
    if (!selectionToolbar || !selectionToolbarText) return;
    selectionState = nextState;
    const excerpt = nextState.text.length > 52 ? nextState.text.slice(0, 52) + '…' : nextState.text;
    selectionToolbarText.textContent = 'Выделено: ' + excerpt;
    selectionToolbar.hidden = false;
    requestAnimationFrame(() => positionSelectionToolbar(nextState.rect));
  }

  function updateSelectionToolbar() {
    if (!selectionToolbar) return;
    if (document.activeElement === input && input.selectionStart !== input.selectionEnd) {
      showSelectionToolbar({
        kind: 'input',
        text: input.value.slice(input.selectionStart, input.selectionEnd),
        start: input.selectionStart,
        end: input.selectionEnd,
        rect: input.getBoundingClientRect()
      });
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      hideSelectionToolbar();
      return;
    }
    const anchorInside = chatScroll.contains(selection.anchorNode);
    const focusInside = chatScroll.contains(selection.focusNode);
    if (!anchorInside || !focusInside) {
      hideSelectionToolbar();
      return;
    }
    const article = elementFromNode(selection.anchorNode)?.closest('.message');
    const range = selection.rangeCount ? selection.getRangeAt(0) : null;
    if (!article || !range) {
      hideSelectionToolbar();
      return;
    }
    showSelectionToolbar({ kind: 'message', text: selection.toString().trim(), article, rect: range.getBoundingClientRect() });
  }

  function applyComposerSelection(kind, state) {
    const text = state.text;
    const variantText = makeTextVariant(text, kind);
    input.value = input.value.slice(0, state.start) + variantText + input.value.slice(state.end);
    resizeInput();
    input.focus();
    input.setSelectionRange(state.start, state.start + variantText.length);
    hideSelectionToolbar();
    showToast(kind === 'rephrase' ? 'Выделенный текст переформулирован локально' : 'Выделенный текст перегенерирован локально');
  }

  function handleSelectionAction(action) {
    if (!selectionState) return;
    const state = selectionState;
    if (action === 'copy') {
      copyText(state.text, 'Выделенный фрагмент скопирован');
      hideSelectionToolbar();
      return;
    }
    if (state.kind === 'input') {
      applyComposerSelection(action, state);
      return;
    }
    renderVariantCard(state.article, {
      kind: action,
      label: action === 'rephrase' ? 'Переформулировка фрагмента' : 'Новый вариант фрагмента',
      text: makeTextVariant(state.text, action),
      selectionText: state.text,
      originalText: messageText(state.article)
    });
    hideSelectionToolbar();
    showToast(action === 'rephrase' ? 'Готов вариант выделенного фрагмента' : 'Готов новый вариант фрагмента');
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

  function setFontScale(nextScale, notify) {
    const allowed = ['normal', 'large', 'xlarge'];
    fontScale = allowed.includes(nextScale) ? nextScale : 'large';
    app.dataset.fontSize = fontScale;
    document.querySelectorAll('[data-font-size-option]').forEach((button) => {
      const active = button.dataset.fontSizeOption === fontScale;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('fabula-font-scale', fontScale); } catch (_) {}
    if (notify) showToast(fontScale === 'normal' ? 'Обычный размер текста' : fontScale === 'xlarge' ? 'Очень крупный размер текста' : 'Крупный размер текста');
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
    hideSelectionToolbar();
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

  function filteredInventory() {
    const query = inventoryState.query.trim().toLowerCase();
    return inventory.filter((item) => {
      const matchesFilter = inventoryState.filter === 'all' || item.category === inventoryState.filter;
      const matchesQuery = !query || [item.name, item.categoryLabel, item.rarityLabel, item.description].join(' ').toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }

  function renderInventoryInspector(item) {
    if (!item) return '<div class="inventory-empty"><span>⌕</span><strong>Ничего не найдено</strong><small>Попробуй другой запрос или сбрось фильтр.</small></div>';
    return '<section class="inventory-inspector" aria-label="Выбранный предмет"><div class="inventory-detail-head"><span class="inventory-detail-symbol inventory-symbol-' + escapeHTML(item.rarity) + '">' + item.icon + '</span><span><span class="eyebrow">' + escapeHTML(item.categoryLabel) + '</span><h3>' + escapeHTML(item.name) + '</h3><b class="inventory-rarity inventory-rarity-' + escapeHTML(item.rarity) + '">' + escapeHTML(item.rarityLabel) + '</b></span></div><p class="inventory-description">' + escapeHTML(item.description) + '</p><div class="inventory-detail-stats"><span><small>Количество</small><strong>×' + item.quantity + '</strong></span><span><small>Состояние</small><strong>' + escapeHTML(item.condition) + '</strong></span><span><small>Вес</small><strong>' + escapeHTML(item.weight) + '</strong></span></div><div class="inventory-detail-actions"><button class="modal-button primary" type="button" data-inventory-insert="' + escapeHTML(item.id) + '">Добавить в ход</button><button class="modal-button" type="button" data-inventory-look="' + escapeHTML(item.id) + '">Осмотреть</button></div><div class="inventory-canon-note"><span>◇</span><span>Действие попадет в composer как намерение. Предмет изменит мир только после подтвержденного хода.</span></div></section>';
  }

  function renderInventory() {
    const visible = filteredInventory();
    const selected = visible.find((item) => item.id === inventoryState.selectedId) || visible[0] || null;
    if (selected) inventoryState.selectedId = selected.id;
    const categories = [['all', 'Все'], ['weapon', 'Оружие'], ['armor', 'Броня'], ['artifact', 'Артефакты'], ['key', 'Ключи'], ['consumable', 'Расходники']];
    const filters = categories.map(([key, label]) => '<button class="inventory-filter' + (inventoryState.filter === key ? ' is-active' : '') + '" type="button" data-inventory-filter="' + key + '" aria-pressed="' + (inventoryState.filter === key) + '">' + label + '</button>').join('');
    const cards = visible.map((item) => '<button class="inventory-card' + (item.id === inventoryState.selectedId ? ' is-selected' : '') + '" type="button" data-inventory-select="' + escapeHTML(item.id) + '" aria-pressed="' + (item.id === inventoryState.selectedId) + '"><span class="inventory-symbol inventory-symbol-' + escapeHTML(item.rarity) + '">' + item.icon + '</span><span class="inventory-card-copy"><strong>' + escapeHTML(item.name) + '</strong><small>' + escapeHTML(item.rarityLabel) + ' · ' + escapeHTML(item.categoryLabel) + '</small></span><b class="inventory-quantity">×' + item.quantity + '</b></button>').join('');
    return '<div class="inventory-summary"><div><span class="eyebrow">РЮКЗАК · ЛОКАЛЬНАЯ ДЕМО-СЕССИЯ</span><strong><b>' + inventory.length + '</b> / 24 слота</strong></div><span class="inventory-load">' + inventory.reduce((total, item) => total + item.quantity, 0) + ' предметов · 248 золота</span></div><p class="modal-note">Выбери предмет, чтобы увидеть состояние, описание и безопасное действие для текущего хода.</p><div class="inventory-toolbar"><label class="inventory-search"><span>⌕</span><span class="sr-only">Поиск по инвентарю</span><input type="search" data-inventory-search value="' + escapeHTML(inventoryState.query) + '" placeholder="Найти предмет" autocomplete="off"></label><span class="inventory-result-count">' + visible.length + ' из ' + inventory.length + '</span></div><div class="inventory-filters" role="toolbar" aria-label="Фильтр инвентаря">' + filters + '</div><div class="inventory-layout"><div class="inventory-grid" role="list" aria-label="Предметы">' + (cards || '<div class="inventory-empty inventory-empty-grid"><span>⌕</span><strong>Предметы не найдены</strong><small>Измени запрос или фильтр.</small></div>') + '</div>' + renderInventoryInspector(selected) + '</div>';
  }

  function rerenderInventory(restoreSearchFocus) {
    modalBody.innerHTML = renderInventory();
    if (!restoreSearchFocus) return;
    const search = modalBody.querySelector('[data-inventory-search]');
    if (!search) return;
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }

  function renderJournal() {
    return '<p class="modal-note">Журнал - проекция подтвержденных событий. Его записи не создают параллельный канон.</p><div class="journal-list">' + journal.map((item) => '<div class="journal-item"><span>✒</span><span><strong>' + escapeHTML(item.title) + '</strong><small>' + escapeHTML(item.meta) + ' · ' + escapeHTML(item.text) + '</small></span><button class="insert-button" type="button" data-insert="' + escapeHTML(item.text) + '">В ход</button></div>').join('') + '</div>';
  }

  function renderCharacter() {
    return '<div class="character-sheet"><div class="sheet-portrait"><img src="/assets/avatar.jpg" alt="Портрет Безымянного"></div><div class="sheet-copy"><h3>Безымянный</h3><p>' + escapeHTML(currentStory().role) + ' · уровень 7</p><div class="sheet-stats"><div class="sheet-stat"><b>31</b><small>здоровье</small></div><div class="sheet-stat"><b>14</b><small>защита</small></div><div class="sheet-stat"><b>248</b><small>золото</small></div></div><div class="meter"><i></i></div></div></div><div class="modal-actions"><button class="modal-button primary" type="button" data-tool="inventory">Открыть инвентарь</button></div>';
  }

  function renderCheck() {
    return '<p class="modal-note">Проверка остается инструментом игрока. В runtime итоговый порог и typed operations решает сервер.</p><div class="modal-grid"><div class="modal-card"><h3>Ловкость</h3><p>Тихо обойти разрушенную арку</p><div class="modal-meta"><b>+3</b> · пример · DC 13</div></div><div class="modal-card"><h3>Харизма</h3><p>Убедить старика говорить прямо</p><div class="modal-meta"><b>+4</b> · пример · DC 12</div></div><div class="modal-card"><h3>Разум</h3><p>Сопоставить герб и старые записи</p><div class="modal-meta"><b>+1</b> · пример · DC 14</div></div><div class="modal-card"><h3>Мудрость</h3><p>Замечать следы до того, как станет поздно</p><div class="modal-meta"><b>+1</b> · пример · DC 13</div></div></div>';
  }

  function renderSettings() {
    const fontOptions = [['normal', 'Обычный'], ['large', 'Крупный'], ['xlarge', 'Очень крупный']].map(([value, label]) => '<button type="button" data-font-size-option="' + value + '" class="' + (fontScale === value ? 'is-active' : '') + '" aria-pressed="' + (fontScale === value) + '">' + label + '</button>').join('');
    return '<div class="settings-group"><label>Размер текста</label><div class="settings-segment settings-font-segment">' + fontOptions + '</div><small class="settings-help">Масштаб сохраняется для этой страницы и не меняет канон.</small></div><div class="settings-group"><label>Тон сцены</label><div class="settings-segment"><button type="button" class="is-active">Мрачный</button><button type="button">Героический</button><button type="button">Ироничный</button></div></div><div class="settings-group"><label>Темп</label><div class="settings-segment"><button type="button" class="is-active">Спокойно</button><button type="button">Быстро</button></div></div><label class="settings-check"><input type="checkbox" checked> Показывать подсказки действий</label><div class="modal-actions"><button class="modal-button primary" type="button" data-close-modal>Сохранить для сессии</button></div>';
  }

  function openTool(tool) {
    const views = {
      models: ['КОНТУР OPENROUTER', 'Модели и промты', renderModels],
      inventory: ['СОСТОЯНИЕ СЕССИИ', 'Рюкзак и предметы', renderInventory],
      journal: ['ЖУРНАЛ ПАМЯТИ', 'Подтвержденные события', renderJournal],
      character: ['ЛИСТ ПЕРСОНАЖА', 'Безымянный', renderCharacter],
      check: ['ПРОВЕРКА', 'Инструмент действия', renderCheck],
      settings: ['НАСТРОЙКИ СЦЕНЫ', 'Опыт взаимодействия', renderSettings]
    };
    const view = views[tool];
    if (!view) return;
    hideSelectionToolbar();
    closeDrawers();
    modalKicker.textContent = view[0];
    modalTitle.textContent = view[1];
    modalBody.innerHTML = view[2]();
    if (!modal.open) modal.showModal();
  }

  function compose(text) {
    hideSelectionToolbar();
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
    const selectionButton = event.target.closest('[data-selection-action]');
    if (selectionButton) {
      event.preventDefault();
      handleSelectionAction(selectionButton.dataset.selectionAction);
      return;
    }
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
    const inventoryFilter = event.target.closest('[data-inventory-filter]');
    if (inventoryFilter) {
      inventoryState.filter = inventoryFilter.dataset.inventoryFilter;
      rerenderInventory(false);
      return;
    }
    const inventorySelect = event.target.closest('[data-inventory-select]');
    if (inventorySelect) {
      inventoryState.selectedId = inventorySelect.dataset.inventorySelect;
      rerenderInventory(false);
      return;
    }
    const inventoryInsert = event.target.closest('[data-inventory-insert]');
    if (inventoryInsert) {
      const item = inventory.find((entry) => entry.id === inventoryInsert.dataset.inventoryInsert);
      if (item) compose(item.text);
      return;
    }
    const inventoryLook = event.target.closest('[data-inventory-look]');
    if (inventoryLook) {
      const item = inventory.find((entry) => entry.id === inventoryLook.dataset.inventoryLook);
      if (item) showToast(item.inspect);
      return;
    }
    const fontSizeButton = event.target.closest('[data-font-size-option]');
    if (fontSizeButton) {
      setFontScale(fontSizeButton.dataset.fontSizeOption, true);
      return;
    }
    const composeButton = event.target.closest('[data-compose]');
    if (composeButton) {
      compose(composeButton.dataset.compose);
      return;
    }
    const rewriteComposerButton = event.target.closest('[data-rewrite-composer]');
    if (rewriteComposerButton) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (start !== end) {
        applyComposerSelection('rephrase', { text: input.value.slice(start, end), start, end });
      } else if (input.value.trim()) {
        const rewritten = makeTextVariant(input.value, 'rephrase');
        input.value = rewritten;
        resizeInput();
        input.focus();
        input.setSelectionRange(0, input.value.length);
        showToast('Весь текст переформулирован локально');
      } else {
        input.focus();
        showToast('Сначала напиши или выдели текст для переформулирования');
      }
      return;
    }
    const insertButton = event.target.closest('[data-insert]');
    if (insertButton) {
      compose(insertButton.dataset.insert);
      return;
    }
    const variantAction = event.target.closest('[data-variant-action]');
    if (variantAction) {
      const card = variantAction.closest('[data-variant-card]');
      const action = variantAction.dataset.variantAction;
      if (action === 'apply') applyVariantCard(card);
      if (action === 'restore') restoreVariantCard(card);
      if (action === 'dismiss') {
        card?.remove();
        showToast('Вариант скрыт');
      }
      return;
    }
    const messageAction = event.target.closest('[data-message-action]');
    if (messageAction) {
      const action = messageAction.dataset.messageAction;
      const article = messageAction.closest('.message');
      if (action === 'copy') copyText(messageText(article), 'Текст сообщения скопирован');
      if (action === 'retry' || action === 'rephrase' || action === 'regenerate') regenerateMessage(article, action === 'rephrase' ? 'rephrase' : 'regenerate');
      if (action === 'edit') {
        input.value = messageText(article);
        resizeInput();
        input.setSelectionRange(input.value.length, input.value.length);
        input.focus();
        showToast('Ход загружен в поле ввода');
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
  document.addEventListener('input', (event) => {
    const search = event.target.closest('[data-inventory-search]');
    if (!search) return;
    inventoryState.query = search.value;
    rerenderInventory(true);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submitTurn();
    }
  });

  if (selectionToolbar) selectionToolbar.addEventListener('mousedown', (event) => event.preventDefault());
  document.addEventListener('selectionchange', updateSelectionToolbar);
  window.addEventListener('resize', hideSelectionToolbar);

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input.focus();
    }
    if (event.key === 'Escape') {
      closeDrawers();
      hideSelectionToolbar();
    }
  });

  const savedMode = (() => {
    try { return localStorage.getItem('fabula-interaction-mode'); } catch (_) { return null; }
  })();
  const savedFontScale = (() => {
    try { return localStorage.getItem('fabula-font-scale'); } catch (_) { return null; }
  })();
  setMode(['action', 'speech', 'exploration'].includes(savedMode) ? savedMode : 'action');
  setFontScale(['normal', 'large', 'xlarge'].includes(savedFontScale) ? savedFontScale : 'large', false);
  resizeInput();
  applyStory(storyId);
  window.__fabulaInteraction = { config, getStory: () => storyId, getMode: () => mode, getFontScale: () => fontScale, openTool, buildTurnRequest: config.makeTurnRequest };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();

  return () => {}
}
