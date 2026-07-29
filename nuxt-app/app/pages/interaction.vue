<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const pageRoot = ref(null)
let dispose = () => {}

useSeoMeta({
  title: 'ФАБУЛА - сцена',
  description: 'Интерактивная сцена ФАБУЛЫ.',
})

onMounted(async () => {
  const { mountInteractionRuntime } = await import('~/legacy/interaction-runtime.client')
  dispose = mountInteractionRuntime(pageRoot.value) || dispose
})

onBeforeUnmount(() => dispose())
</script>

<template>
  <div ref="pageRoot" class="interaction-page">
<div class="interaction-app" id="interactionApp" data-story="fant" data-theme="fantasy">
    <header class="topbar">
      <a class="brand" href="/app" aria-label="Вернуться в ФАБУЛУ">ФАБУЛА</a>
      <div class="topbar-context">
        <span class="topbar-kicker" id="storyEyebrow">ТЕМНОЕ ФЭНТЕЗИ</span>
        <strong id="storyTitle">Пепельные земли</strong>
      </div>
      <div class="topbar-actions">
        <span class="connection-state"><i></i> Сессия сохранена</span>
        <button class="topbar-button mobile-only" type="button" data-drawer="threads" aria-label="Открыть чаты">☰</button>
        <button class="topbar-button" type="button" data-tool="models" aria-label="Открыть контур моделей">⌘</button>
        <button class="topbar-button mobile-only" type="button" data-drawer="details" aria-label="Открыть состояние мира">◈</button>
      </div>
    </header>

    <div class="workspace" id="workspace">
      <aside class="thread-rail" id="threadRail" aria-label="Истории и чаты">
        <div class="mobile-drawer-head">
          <span>Твои истории</span>
          <button class="icon-button" type="button" data-close-drawer="threads" aria-label="Закрыть список чатов">×</button>
        </div>
        <div class="thread-rail-head">
          <div>
            <span class="eyebrow">ЛИЧНЫЙ АРХИВ</span>
            <h1>Твои истории</h1>
          </div>
          <button class="new-thread" type="button" data-new-thread aria-label="Начать новую сцену">+</button>
        </div>
        <button class="search-threads" type="button" data-search-threads>
          <span>⌕</span><span>Найти сцену</span><kbd>⌘ K</kbd>
        </button>
        <div class="thread-group">
          <div class="group-label"><span>ОСНОВНЫЕ ПАКИ</span><span>4</span></div>
          <button class="thread-item is-active" type="button" data-story="fant">
            <span class="thread-cover thread-cover-fant"></span>
            <span class="thread-copy"><strong>Пепельные земли</strong><small>Клинок выбирает наследника</small></span>
            <span class="thread-meta"><b>2</b><small>сейчас</small></span>
          </button>
          <button class="thread-item" type="button" data-story="scifi">
            <span class="thread-cover thread-cover-scifi"></span>
            <span class="thread-copy"><strong>Станция "Кассандра"</strong><small>Твое имя исчезло из журнала</small></span>
            <span class="thread-meta"><small>вчера</small></span>
          </button>
          <button class="thread-item" type="button" data-story="hist">
            <span class="thread-cover thread-cover-hist"></span>
            <span class="thread-copy"><strong>Восстание Спартака</strong><small>До восстания - одна ночь</small></span>
            <span class="thread-meta"><small>22 июл</small></span>
          </button>
        </div>
        <div class="thread-group thread-group-muted">
          <button class="thread-item" type="button" data-story="post">
            <span class="thread-cover thread-cover-modern"></span>
            <span class="thread-copy"><strong>Линия разрыва</strong><small>Эфир уже записан из будущего</small></span>
            <span class="thread-meta"><small>новое</small></span>
          </button>
        </div>
        <div class="thread-rail-foot">
          <button class="account-chip" type="button" data-tool="character">
            <span class="account-avatar"><img src="/assets/avatar.jpg" alt=""></span>
            <span><strong>Безымянный</strong><small>Бард · уровень 7</small></span>
            <span class="account-more">•••</span>
          </button>
        </div>
      </aside>

      <main class="dialogue-column" aria-label="Диалог с персонажем">
        <header class="dialogue-head">
          <div class="dialogue-character">
            <span class="character-avatar"><img src="/assets/avatar.jpg" alt="Портрет персонажа"></span>
            <span><strong id="characterName">Старик-хранитель</strong><small><i></i> В сцене · <span id="storyLocation">Руины Эхокарты</span></small></span>
          </div>
          <div class="dialogue-head-actions">
            <span class="turn-badge"><i></i> Твой ход</span>
            <button class="icon-button" type="button" data-tool="settings" aria-label="Открыть настройки сцены">⚙</button>
          </div>
        </header>

        <div class="scene-context" role="status">
          <span class="scene-context-icon">✦</span>
          <span><strong>Сцена 02 · preview</strong><small>Ходы живут только в памяти процесса и не записываются в production-канон</small></span>
          <button class="context-link" type="button" data-tool="models">Контур хода <b>›</b></button>
        </div>

        <section class="story-pulse" aria-live="polite" aria-label="Сюжетный контекст">
          <span class="story-pulse-mark" id="storyThemeIcon">✦</span>
          <div class="story-pulse-copy"><span class="eyebrow" id="storyThemeLabel">ФЭНТЕЗИ</span><strong id="storyPremiseTitle">Пепельные земли</strong><p id="storyPremise">Клинок Тихого Пепла откликается на твое имя, которого ты не помнишь.</p></div>
          <div class="story-pulse-stake"><span>СТАВКА</span><strong id="storyStake">До темного пламени - один переход</strong></div>
        </section>

        <div class="chat-scroll" id="chatScroll" aria-live="polite">
          <div class="day-divider"><span>СЕГОДНЯ · 21:14</span></div>

          <article class="message message-narrator" data-message-id="scene-intro">
            <div class="message-head"><span class="message-avatar avatar-narrator">✦</span><span><strong>Рассказчик</strong><small>Локальный пример исхода · сцена 02</small></span></div>
            <div class="message-copy"><p>Пепел идет с востока, хотя ветра там нет. За спиной старика осыпается каменная арка, и на миг в проломе видно темное пламя Цитадели. Он ждет, не отводя взгляда от клинка в твоей руке.</p></div>
            <div class="message-foot"><span>Руины Эхокарты</span><span class="message-actions"><button class="message-action-button" type="button" data-message-action="copy" aria-label="Скопировать сообщение">⧉<small>Копировать</small></button><button class="message-action-button" type="button" data-message-action="rephrase" aria-label="Показать локальный вариант сообщения">≋<small>Локальный вариант</small></button><button class="message-action-button" type="button" data-message-action="regenerate" aria-label="Показать еще один локальный вариант сообщения">↻<small>Еще вариант</small></button></span></div>
          </article>

          <article class="message message-character" data-message-id="keeper-question">
            <div class="message-head"><span class="message-avatar avatar-character"><img src="/assets/avatar.jpg" alt=""></span><span><strong>Старик-хранитель</strong><small>Персонаж · отношение: насторожен</small></span></div>
            <div class="message-copy"><p>"Ты снова смотришь на клинок, будто надеешься, что он назовет тебя по имени. Не назовет. Но я могу показать дорогу, если ты скажешь, зачем идешь к Цитадели."</p></div>
            <div class="character-mood"><span class="mood-dot"></span> Он ждет честного ответа</div>
            <div class="message-foot"><span>Реплика персонажа</span><span class="message-actions"><button class="message-action-button" type="button" data-message-action="copy" aria-label="Скопировать сообщение">⧉<small>Копировать</small></button><button class="message-action-button" type="button" data-message-action="rephrase" aria-label="Показать локальный вариант реплики">≋<small>Локальный вариант</small></button><button class="message-action-button" type="button" data-message-action="regenerate" aria-label="Показать еще один локальный вариант реплики">↻<small>Еще вариант</small></button></span></div>
          </article>

          <article class="message message-player" data-message-id="player-reply">
            <div class="message-head"><span class="message-avatar avatar-player">Б</span><span><strong>Ты</strong><small>Речь · локальный пример</small></span></div>
            <div class="message-copy"><p>Я поднимаю клинок так, чтобы старик увидел три звезды, и спрашиваю, кто оставил его среди руин.</p></div>
            <div class="message-foot"><span>Локальный пример · в журнал не записан</span><span class="message-actions"><button class="message-action-button" type="button" data-message-action="edit" aria-label="Изменить действие">✎<small>Изменить</small></button></span></div>
          </article>

          <article class="message message-narrator message-pending" data-message-id="pending-turn">
            <div class="message-head"><span class="message-avatar avatar-narrator">✦</span><span><strong>Рассказчик</strong><small>Локальный preview-фрагмент</small></span></div>
            <div class="message-copy"><p>Старик медленно протягивает руку к рукояти, но не касается ее. В его лице впервые появляется не страх, а узнавание.</p></div>
            <div class="message-media-hint"><span>◌</span><span>Кадр сцены может быть предложен после подтверждения события</span></div>
            <div class="message-foot"><span>Последствие еще не подтверждено</span><span class="message-actions"><button class="message-action-button" type="button" data-message-action="rephrase" aria-label="Показать локальный вариант ответа">≋<small>Локальный вариант</small></button><button class="message-action-button" type="button" data-message-action="regenerate" aria-label="Показать еще один локальный вариант ответа">↻<small>Еще вариант</small></button></span></div>
          </article>
        </div>

        <section class="composer-shell" aria-label="Ввод действия игрока">
          <div class="composer-topline"><span class="composer-label">ТВОЙ ХОД</span><span class="composer-hint" id="composerHint">Опиши действие, речь или исследование</span><button class="auto-toggle" type="button" data-auto-toggle disabled title="Preview: функция не подключена"><i></i> Автопродолжение · preview</button></div>
          <div class="mode-switch" role="tablist" aria-label="Режим действия">
            <button class="mode-button is-active" type="button" role="tab" aria-selected="true" data-mode="action"><span>↗</span> Действие</button>
            <button class="mode-button" type="button" role="tab" aria-selected="false" data-mode="speech"><span>❝</span> Речь</button>
            <button class="mode-button" type="button" role="tab" aria-selected="false" data-mode="exploration"><span>⌕</span> Исследование</button>
          </div>
          <form class="composer" id="composer">
            <label class="sr-only" for="playerInput">Опиши свое действие</label>
            <textarea id="playerInput" rows="1" maxlength="1200" placeholder="Что ты делаешь?"></textarea>
            <div class="composer-bottom">
              <div class="composer-tools">
                <button class="composer-tool" type="button" data-tool="inventory" aria-label="Добавить предмет из инвентаря">☙</button>
                <button class="composer-tool" type="button" data-tool="journal" aria-label="Добавить запись из журнала">✒</button>
                <button class="composer-tool" type="button" data-tool="check" aria-label="Открыть проверку навыка">⚄</button>
                <button class="composer-tool composer-tool-rewrite" type="button" data-rewrite-composer aria-label="Показать локальный вариант текста" title="Локальный вариант без вызова модели">✧</button>
                <span class="composer-divider"></span>
                <button class="composer-tool" type="button" data-compose="Я осматриваю ближайшие следы и ищу безопасный путь." aria-label="Подставить пример исследования">⌁</button>
              </div>
              <div class="composer-submit"><span class="composer-count" id="composerCount">0 / 1200</span><button class="send-button" type="submit" aria-label="Отправить ход">↑</button></div>
            </div>
          </form>
          <div class="composer-footer"><span>Enter - отправить</span><span>Shift + Enter - новая строка</span><span class="privacy-note">Ключи OpenRouter не хранятся в браузере</span></div>
        </section>
      </main>

      <aside class="detail-rail" id="detailRail" aria-label="Состояние сцены и инструменты">
        <div class="mobile-drawer-head">
          <span>Состояние сцены</span>
          <button class="icon-button" type="button" data-close-drawer="details" aria-label="Закрыть состояние сцены">×</button>
        </div>
        <div class="detail-head"><span><span class="eyebrow">ПАНЕЛЬ СЦЕНЫ</span><strong>Состояние мира</strong></span><button class="icon-button" type="button" data-tool="settings" aria-label="Настроить панель">⚙</button></div>
        <div class="detail-actions" role="toolbar" aria-label="Инструменты сцены">
          <button type="button" data-tool="character"><span>♞</span><small>Персонаж</small></button>
          <button type="button" data-tool="inventory"><span>☙</span><small>Инвентарь</small></button>
          <button type="button" data-tool="journal"><span>✒</span><small>Журнал</small></button>
          <button type="button" data-tool="models"><span>⌘</span><small>Модели</small></button>
        </div>

        <section class="theme-card" aria-label="Выбор темы истории">
          <div class="card-heading"><span>АРХИЖАНР</span><span class="theme-active" id="themeActiveLabel">Фэнтези</span></div>
          <div class="theme-grid" role="tablist" aria-label="Темы оформления">
            <button type="button" class="theme-choice is-active" role="tab" aria-selected="true" data-story-select="fant"><span>✦</span><small>Фэнтези</small></button>
            <button type="button" class="theme-choice" role="tab" aria-selected="false" data-story-select="scifi"><span>⌁</span><small>Научная фантастика</small></button>
            <button type="button" class="theme-choice" role="tab" aria-selected="false" data-story-select="hist"><span>⚜</span><small>История</small></button>
            <button type="button" class="theme-choice" role="tab" aria-selected="false" data-story-select="post"><span>◒</span><small>Современность</small></button>
          </div>
        </section>

        <section class="story-arc-card" aria-live="polite">
          <div class="card-heading"><span>ЯДРО ПАКА</span><span class="arc-status">В СЦЕНЕ</span></div>
          <p id="storyArcPremise">Клинок Тихого Пепла откликается на твое имя, которого ты не помнишь.</p>
          <div class="arc-objective"><span>Твоя цель</span><strong id="storyObjective">Решить, кому достанется право разбудить Цитадель</strong></div>
        </section>

        <section class="presence-card">
          <div class="presence-top"><span class="presence-avatar"><img src="/assets/avatar.jpg" alt=""></span><span><strong id="railCharacterName">Старик-хранитель</strong><small id="presenceRole">NPC · рядом</small></span><span class="presence-status">в сцене</span></div>
          <div class="presence-relation"><span><small>Отношение</small><b id="presenceRelation">Насторожен</b></span><span><small>Знает</small><b id="presenceKnowledge">Три звезды</b></span></div>
          <div class="relation-meter"><i></i></div>
          <p id="presenceSummary">Хранитель видел прежнего носителя клинка и скрывает последнюю клятву.</p>
        </section>

        <section class="state-card">
          <div class="card-heading"><span>СЕЙЧАС В МИРЕ</span><button type="button" data-tool="journal" aria-label="Открыть журнал">→</button></div>
          <div class="state-row"><span class="state-icon">◷</span><span><strong id="storyStateOne">Сумерки</strong><small>Сцена развивается в реальном времени</small></span></div>
          <div class="state-row"><span class="state-icon">⌁</span><span><strong id="storyStateTwo">Пепельный ветер</strong><small>Условия меняют возможные действия</small></span></div>
          <div class="state-row"><span class="state-icon">!</span><span><strong id="storyStateThree">Клятва не названа</strong><small>Открытое последствие</small></span></div>
        </section>

        <section class="runtime-card">
          <div class="card-heading"><span>КОНТУР ИИ</span><span class="runtime-lock">SERVER</span></div>
          <div class="runtime-stage is-live"><i></i><span><strong>Авторитетный ход</strong><small>DeepSeek · ожидает действие</small></span><b>01</b></div>
          <div class="runtime-stage"><i></i><span><strong>План сцены</strong><small>Nemotron · advisory</small></span><b>02</b></div>
          <div class="runtime-stage"><i></i><span><strong>Рассказчик</strong><small>Aion · блокировка ZDR</small></span><b>03</b></div>
          <div class="runtime-stage"><i></i><span><strong>Fallback</strong><small>Mistral · armed</small></span><b>04</b></div>
          <button class="runtime-more" type="button" data-tool="models">Показать все 15 промтов <b>→</b></button>
        </section>
        <div class="detail-foot"><span class="secure-dot"></span><span>Состояние принадлежит сессии</span></div>
      </aside>
    </div>
    <div class="selection-toolbar" id="selectionToolbar" role="toolbar" aria-label="Действия с выделенным текстом" hidden>
      <span class="selection-toolbar-text" id="selectionToolbarText">Выделено</span>
      <button type="button" data-selection-action="rephrase" aria-label="Показать локальный вариант выделенного текста"><span>≋</span><small>Локальный вариант</small></button>
      <button type="button" data-selection-action="regenerate" aria-label="Показать еще один локальный вариант выделенного текста"><span>↻</span><small>Еще вариант</small></button>
      <button type="button" data-selection-action="copy" aria-label="Скопировать выделенный текст"><span>⧉</span><small>Копировать</small></button>
    </div>
  </div>

  <div class="app-scrim" id="appScrim" hidden></div>
  <dialog class="tool-modal" id="toolModal" aria-labelledby="toolModalTitle">
    <div class="modal-head"><div><span class="eyebrow" id="toolModalKicker">ИНСТРУМЕНТ СЦЕНЫ</span><h2 id="toolModalTitle">Инструмент</h2></div><button class="icon-button modal-close" type="button" data-close-modal aria-label="Закрыть">×</button></div>
    <div class="modal-body" id="toolModalBody"></div>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  </div>
</template>

<style>
.interaction-page {
  --bg: #0a0a0d;
  --panel: #101014;
  --panel-raised: #15151b;
  --panel-soft: #1b1b22;
  --line: rgba(255, 255, 255, .1);
  --line-strong: rgba(255, 255, 255, .17);
  --ink: #eeeaf0;
  --muted: #a6a2ad;
  --faint: #686671;
  --gold: #d9a94a;
  --gold-light: #f2cd7c;
  --gold-deep: #8a6122;
  --green: #8fcd78;
  --blue: #7aa7db;
  --danger: #d07468;
  --accent: #d9a94a;
  --display: 'Forum', Georgia, serif;
  --body: 'Cormorant Garamond', Georgia, serif;
  --mono: 'Tektur', ui-monospace, monospace;
}

.interaction-page, .interaction-page * { box-sizing: border-box; }
.interaction-page, .interaction-page { min-height: 100%; }
.interaction-page .sr-only { width: 1px; height: 1px; position: absolute; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.interaction-page {
  margin: 0;
  min-width: 320px;
  overflow: hidden;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--body);
}
.interaction-page button, .interaction-page textarea { font: inherit; }
.interaction-page button { color: inherit; }
.interaction-page button:focus-visible, .interaction-page textarea:focus-visible, .interaction-page a:focus-visible {
  outline: 2px solid var(--gold-light);
  outline-offset: 3px;
}
.interaction-page a { color: inherit; }

.interaction-page .interaction-app {
  --font-scale: 1.1;
  --accent-light: #f2cd7c;
  --accent-deep: #8a6122;
  --accent-soft: rgba(217, 169, 74, .14);
  --theme-glow: rgba(110, 68, 163, .26);
  --player-surface: rgba(89, 54, 20, .58);
  --gold: var(--accent);
  --gold-light: var(--accent-light);
  --gold-deep: var(--accent-deep);
  height: 100dvh;
  min-height: 560px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(70% 90% at 66% 0%, var(--theme-glow), transparent 58%),
    linear-gradient(135deg, #0c0c10, #09090c 64%, #11100d);
}
.interaction-page .interaction-app[data-font-size="normal"] { --font-scale: 1; }
.interaction-page .interaction-app[data-font-size="large"] { --font-scale: 1.1; }
.interaction-page .interaction-app[data-font-size="xlarge"] { --font-scale: 1.22; }
.interaction-page .interaction-app[data-theme="fantasy"] { --accent: #d9a94a; --accent-light: #f2cd7c; --accent-deep: #8a6122; --accent-soft: rgba(217, 169, 74, .14); --theme-glow: rgba(110, 68, 163, .26); --player-surface: rgba(89, 54, 20, .58); }
.interaction-page .interaction-app[data-theme="scifi"] { --accent: #57e6d0; --accent-light: #b7fff2; --accent-deep: #197e83; --accent-soft: rgba(87, 230, 208, .14); --theme-glow: rgba(50, 114, 185, .32); --player-surface: rgba(20, 86, 99, .58); background: radial-gradient(75% 80% at 70% 0%, rgba(43, 153, 181, .28), transparent 58%), radial-gradient(45% 60% at 0% 100%, rgba(97, 63, 169, .18), transparent 64%), linear-gradient(135deg, #071018, #080d16 64%, #0b1620); }
.interaction-page .interaction-app[data-theme="history"] { --accent: #d78c54; --accent-light: #f3ca96; --accent-deep: #7f4228; --accent-soft: rgba(215, 140, 84, .14); --theme-glow: rgba(143, 73, 37, .28); --player-surface: rgba(96, 46, 28, .58); background: radial-gradient(75% 85% at 65% 0%, rgba(143, 73, 37, .26), transparent 60%), linear-gradient(135deg, #17100c, #100d0b 64%, #1b110d); }
.interaction-page .interaction-app[data-theme="modern"] { --accent: #ff7d6b; --accent-light: #ffc0b5; --accent-deep: #9c3d45; --accent-soft: rgba(255, 125, 107, .14); --theme-glow: rgba(38, 167, 159, .26); --player-surface: rgba(110, 45, 50, .58); background: radial-gradient(70% 80% at 70% 0%, rgba(37, 168, 159, .25), transparent 58%), radial-gradient(44% 52% at 15% 100%, rgba(233, 74, 83, .18), transparent 68%), linear-gradient(135deg, #0d1116, #0d0f12 64%, #15100f); }

.interaction-page .topbar {
  height: 72px;
  flex: none;
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr) auto;
  align-items: center;
  gap: 22px;
  padding: 0 24px;
  border-bottom: 1px solid var(--line);
  background: rgba(11, 11, 14, .88);
  backdrop-filter: blur(18px);
  z-index: 30;
}
.interaction-page .brand {
  width: max-content;
  color: var(--gold-light);
  font-family: var(--display);
  font-size: 23px;
  letter-spacing: .15em;
  text-decoration: none;
  text-shadow: 0 0 22px rgba(217, 169, 74, .26);
}
.interaction-page .topbar-context { min-width: 0; display: flex; align-items: baseline; gap: 13px; }
.interaction-page .topbar-context strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--display); font-size: 19px; font-weight: 400; }
.interaction-page .topbar-kicker, .interaction-page .eyebrow, .interaction-page .composer-label, .interaction-page .card-heading > span:first-child {
  color: var(--faint);
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.interaction-page .topbar-actions { display: flex; align-items: center; gap: 13px; }
.interaction-page .connection-state { display: inline-flex; align-items: center; gap: 7px; color: var(--muted); font-family: var(--mono); font-size: 10px; white-space: nowrap; }
.interaction-page .connection-state i, .interaction-page .dialogue-character small i, .interaction-page .turn-badge i, .interaction-page .secure-dot {
  width: 7px;
  height: 7px;
  display: inline-block;
  flex: none;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 10px rgba(143, 205, 120, .7);
}
.interaction-page .topbar-button, .interaction-page .icon-button {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 255, 255, .035);
  color: var(--muted);
  cursor: pointer;
  transition: .18s ease;
}
.interaction-page .topbar-button:hover, .interaction-page .icon-button:hover { border-color: var(--gold); color: var(--gold-light); background: rgba(217, 169, 74, .1); }
.interaction-page .mobile-only { display: none; }

.interaction-page .workspace { min-height: 0; flex: 1; display: grid; grid-template-columns: 270px minmax(420px, 1fr) 318px; }
.interaction-page .thread-rail, .interaction-page .detail-rail { min-width: 0; background: rgba(15, 15, 19, .82); }
.interaction-page .thread-rail { display: flex; flex-direction: column; border-right: 1px solid var(--line); }
.interaction-page .detail-rail { padding: 22px 18px 16px; overflow-y: auto; border-left: 1px solid var(--line); scrollbar-width: thin; scrollbar-color: #ffffff22 transparent; }
.interaction-page .thread-rail-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 25px 18px 17px; }
.interaction-page .thread-rail-head h1 { margin: 5px 0 0; font-family: var(--display); font-size: 22px; font-weight: 400; }
.interaction-page .new-thread { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid rgba(217, 169, 74, .5); border-radius: 10px; background: rgba(217, 169, 74, .1); color: var(--gold-light); font-size: 22px; line-height: 1; cursor: pointer; }
.interaction-page .new-thread:hover { background: rgba(217, 169, 74, .2); }
.interaction-page .search-threads { margin: 0 14px 18px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, .035); color: var(--muted); text-align: left; cursor: pointer; }
.interaction-page .search-threads span:first-child { color: var(--gold); font-size: 18px; line-height: 12px; }
.interaction-page .search-threads span:nth-child(2) { flex: 1; font-family: var(--mono); font-size: 10px; }
.interaction-page .search-threads kbd { padding: 2px 5px; border: 1px solid var(--line); border-radius: 4px; color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .thread-group { padding: 0 10px; }
.interaction-page .thread-group-muted { margin-top: 21px; }
.interaction-page .group-label { padding: 0 8px 7px; display: flex; justify-content: space-between; color: var(--faint); font-family: var(--mono); font-size: 9px; letter-spacing: .13em; }
.interaction-page .thread-item { width: 100%; min-width: 0; padding: 10px 8px; display: flex; align-items: center; gap: 9px; border: 1px solid transparent; border-radius: 11px; background: transparent; text-align: left; cursor: pointer; transition: .18s ease; }
.interaction-page .thread-item:hover { background: rgba(255, 255, 255, .045); }
.interaction-page .thread-item.is-active { border-color: rgba(217, 169, 74, .32); background: linear-gradient(90deg, rgba(217, 169, 74, .16), rgba(217, 169, 74, .04)); }
.interaction-page .thread-cover { width: 32px; height: 38px; flex: none; border-radius: 7px; border: 1px solid rgba(255, 255, 255, .1); background-position: center; background-size: cover; }
.interaction-page .thread-cover-fant { background-image: linear-gradient(135deg, #251b0e88, #0f0904aa), url('/assets/cover_fantasy.jpg'); }
.interaction-page .thread-cover-scifi { background-image: linear-gradient(135deg, #0d354588, #061012aa), url('/assets/cover_scifi.jpg'); }
.interaction-page .thread-cover-hist { background-image: linear-gradient(135deg, #6b4d2788, #201208aa), url('/assets/cover_history.jpg'); }
.interaction-page .thread-cover-modern { background-image: linear-gradient(135deg, #244f5888, #201015aa), url('/assets/cover_modern.png'); }
.interaction-page .thread-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }
.interaction-page .thread-copy strong { overflow: hidden; color: var(--ink); font-family: var(--display); font-size: 15px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .thread-copy small, .interaction-page .thread-meta small { overflow: hidden; color: var(--faint); font-family: var(--mono); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .thread-meta { min-width: 28px; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.interaction-page .thread-meta b { min-width: 18px; padding: 2px 5px; border-radius: 50px; background: var(--gold); color: #1a1206; font-family: var(--mono); font-size: 8px; text-align: center; }
.interaction-page .thread-rail-foot { margin-top: auto; padding: 14px 12px; border-top: 1px solid var(--line); }
.interaction-page .account-chip { width: 100%; padding: 7px 6px; display: flex; align-items: center; gap: 9px; border: 1px solid transparent; border-radius: 10px; background: transparent; text-align: left; cursor: pointer; }
.interaction-page .account-chip:hover { border-color: var(--line); background: rgba(255, 255, 255, .04); }
.interaction-page .account-avatar { width: 30px; height: 30px; overflow: hidden; flex: none; border: 1px solid var(--gold); border-radius: 50%; }
.interaction-page .account-avatar img, .interaction-page .character-avatar img, .interaction-page .presence-avatar img { width: 100%; height: 100%; object-fit: cover; }
.interaction-page .account-chip > span:nth-child(2) { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 2px; }
.interaction-page .account-chip strong { color: var(--ink); font-family: var(--display); font-size: 14px; font-weight: 400; }
.interaction-page .account-chip small { color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .account-more { color: var(--faint); font-size: 11px; letter-spacing: 2px; }

.interaction-page .dialogue-column { min-width: 0; min-height: 0; display: flex; flex-direction: column; background: radial-gradient(80% 60% at 50% 0%, rgba(54, 39, 18, .2), transparent 70%); }
.interaction-page .dialogue-head { height: 70px; flex: none; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--line); background: rgba(12, 12, 15, .64); }
.interaction-page .dialogue-character { display: flex; align-items: center; gap: 11px; min-width: 0; }
.interaction-page .character-avatar { width: 38px; height: 38px; overflow: hidden; flex: none; border: 1px solid var(--accent); border-radius: 12px; box-shadow: 0 0 18px -7px var(--accent); background: #241b0d; }
.interaction-page .dialogue-character > span:last-child { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.interaction-page .dialogue-character strong { overflow: hidden; font-family: var(--display); font-size: 18px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .dialogue-character small { overflow: hidden; display: flex; align-items: center; gap: 6px; color: var(--faint); font-family: var(--mono); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .dialogue-head-actions { display: flex; align-items: center; gap: 12px; }
.interaction-page .turn-badge { display: inline-flex; align-items: center; gap: 7px; padding: 7px 10px; border: 1px solid rgba(143, 205, 120, .22); border-radius: 50px; background: rgba(143, 205, 120, .07); color: var(--green); font-family: var(--mono); font-size: 9px; white-space: nowrap; }

.interaction-page .scene-context { min-height: 53px; padding: 10px 24px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--line); background: rgba(217, 169, 74, .035); }
.interaction-page .scene-context-icon { width: 27px; height: 27px; display: grid; place-items: center; border: 1px solid rgba(217, 169, 74, .45); border-radius: 8px; color: var(--gold-light); font-size: 13px; }
.interaction-page .scene-context > span:nth-child(2) { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 2px; }
.interaction-page .scene-context strong { font-family: var(--display); font-size: 14px; font-weight: 400; }
.interaction-page .scene-context small { color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .context-link { display: flex; align-items: center; gap: 7px; border: 0; background: transparent; color: var(--gold-light); font-family: var(--mono); font-size: 9px; cursor: pointer; white-space: nowrap; }
.interaction-page .context-link b { font-size: 15px; font-weight: 400; }

.interaction-page .story-pulse { min-height: 82px; padding: 13px 24px; display: grid; grid-template-columns: 34px minmax(0, 1fr) minmax(130px, .42fr); align-items: center; gap: 12px; border-bottom: 1px solid var(--line); background: linear-gradient(90deg, var(--accent-soft), transparent 68%); }
.interaction-page .story-pulse-mark { width: 31px; height: 31px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--gold) 55%, transparent); border-radius: 10px; background: var(--accent-soft); color: var(--gold-light); box-shadow: 0 0 26px -13px var(--gold); }
.interaction-page .story-pulse-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.interaction-page .story-pulse-copy .eyebrow { color: var(--gold); }
.interaction-page .story-pulse-copy strong { color: var(--ink); font-family: var(--display); font-size: 16px; font-weight: 400; }
.interaction-page .story-pulse-copy p { max-width: 670px; margin: 0; overflow: hidden; color: var(--muted); font-size: 14px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .story-pulse-stake { min-width: 0; padding-left: 13px; display: flex; flex-direction: column; gap: 4px; border-left: 1px solid var(--line); }
.interaction-page .story-pulse-stake span { color: var(--faint); font-family: var(--mono); font-size: 8px; letter-spacing: .12em; }
.interaction-page .story-pulse-stake strong { color: var(--gold-light); font-family: var(--display); font-size: 14px; font-weight: 400; line-height: 1.1; }

.interaction-page .chat-scroll { min-height: 0; flex: 1; overflow-y: auto; padding: 22px clamp(18px, 4vw, 76px) 18px; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, .13) transparent; }
.interaction-page .chat-scroll::-webkit-scrollbar, .interaction-page .detail-rail::-webkit-scrollbar { width: 5px; }
.interaction-page .chat-scroll::-webkit-scrollbar-thumb, .interaction-page .detail-rail::-webkit-scrollbar-thumb { border-radius: 5px; background: rgba(255, 255, 255, .13); }
.interaction-page .day-divider { margin: 0 0 20px; display: flex; align-items: center; gap: 11px; color: var(--faint); font-family: var(--mono); font-size: 8px; letter-spacing: .12em; }
.interaction-page .day-divider::before, .interaction-page .day-divider::after { content: ''; height: 1px; flex: 1; background: var(--line); }
.interaction-page .message { max-width: 720px; margin: 0 auto 18px; padding: 16px 18px; border: 1px solid var(--line); border-radius: 7px 17px 17px 17px; background: linear-gradient(145deg, rgba(25, 23, 20, .96), rgba(17, 16, 17, .98)); box-shadow: 0 14px 32px -25px #000; animation: message-in .35s ease both; }
@keyframes message-in { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
.interaction-page .message-character { border-color: color-mix(in srgb, var(--gold) 31%, transparent); background: linear-gradient(145deg, var(--accent-soft), rgba(18, 15, 12, .98)); }
.interaction-page .message-player { margin-left: auto; border-color: color-mix(in srgb, var(--gold) 66%, transparent); border-radius: 17px 7px 17px 17px; background: linear-gradient(145deg, var(--gold-light), var(--gold)); color: #1d1508; }
.interaction-page .message-pending { border-style: dashed; opacity: .9; }
.interaction-page .message-head { display: flex; align-items: center; gap: 9px; margin-bottom: 11px; }
.interaction-page .message-head > span:last-child { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.interaction-page .message-head strong { font-family: var(--display); font-size: 16px; font-weight: 400; }
.interaction-page .message-head small { color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .message-player .message-head small, .interaction-page .message-player .message-foot { color: rgba(29, 21, 8, .65); }
.interaction-page .message-avatar { width: 27px; height: 27px; display: grid; place-items: center; overflow: hidden; flex: none; border-radius: 9px; font-family: var(--display); font-size: 14px; }
.interaction-page .avatar-narrator { border: 1px solid var(--gold); background: rgba(217, 169, 74, .13); color: var(--gold-light); }
.interaction-page .avatar-character { border: 1px solid var(--accent); background: #251a0b; }
.interaction-page .avatar-player { border: 1px solid rgba(29, 21, 8, .3); background: rgba(255, 255, 255, .24); color: #1d1508; }
.interaction-page .message p { margin: 0; color: var(--ink); font-size: 18px; line-height: 1.48; }
.interaction-page .message-player p { color: #211708; }
.interaction-page .message-foot { margin-top: 13px; display: flex; align-items: center; gap: 8px; color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .message-copy { user-select: text; }
.interaction-page .message-foot > span:first-child { min-width: 0; overflow: hidden; flex: 1; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .message-actions { min-width: 0; display: flex; flex: none !important; align-items: center; gap: 4px; }
.interaction-page .message-action-button { width: auto !important; min-width: 27px; height: 25px; padding: 0 6px; display: inline-flex !important; align-items: center; justify-content: center; gap: 4px; border: 1px solid var(--line); border-radius: 7px; background: rgba(255, 255, 255, .025); color: inherit; cursor: pointer; }
.interaction-page .message-action-button small { flex: none !important; color: inherit; font-family: var(--mono); font-size: 7px; white-space: nowrap; }
.interaction-page .message-foot button:hover { border-color: var(--gold); color: var(--gold-light); }
.interaction-page .character-mood { margin-top: 14px; padding-top: 10px; display: flex; align-items: center; gap: 7px; border-top: 1px solid rgba(255, 255, 255, .08); color: var(--gold); font-family: var(--mono); font-size: 8px; }
.interaction-page .mood-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 8px var(--gold); }
.interaction-page .message-media-hint { margin-top: 14px; padding: 9px 10px; display: flex; align-items: center; gap: 7px; border: 1px solid rgba(122, 167, 219, .2); border-radius: 9px; background: rgba(122, 167, 219, .06); color: #9bb4d2; font-family: var(--mono); font-size: 8px; }
.interaction-page .message-media-hint span:first-child { font-size: 16px; }
.interaction-page .message-variant { margin-top: 14px; padding: 12px; border: 1px solid rgba(122, 167, 219, .34); border-radius: 10px; background: linear-gradient(145deg, rgba(122, 167, 219, .1), rgba(255, 255, 255, .025)); }
.interaction-page .variant-head, .interaction-page .variant-foot, .interaction-page .variant-applied { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.interaction-page .variant-head { color: #b5c8e1; font-family: var(--mono); font-size: 8px; text-transform: uppercase; letter-spacing: .08em; }
.interaction-page .variant-head > span { display: inline-flex; align-items: center; gap: 5px; }
.interaction-page .variant-head i, .interaction-page .variant-applied i { color: var(--green); font-style: normal; }
.interaction-page .variant-head button { width: 22px; height: 22px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--muted); cursor: pointer; }
.interaction-page .variant-head button:hover { border-color: var(--line); color: var(--ink); }
.interaction-page .message-variant blockquote { margin: 10px 0 8px; padding-left: 9px; border-left: 2px solid rgba(122, 167, 219, .48); color: var(--faint); font-size: 14px; line-height: 1.35; }
.interaction-page .message-variant > p { margin: 8px 0 12px; color: #d8e4f2; font-size: 16px; line-height: 1.4; }
.interaction-page .variant-foot { align-items: flex-end; color: var(--faint); font-family: var(--mono); font-size: 7px; }
.interaction-page .variant-actions { display: flex; flex: none; gap: 5px; }
.interaction-page .variant-button { padding: 6px 8px; border: 1px solid rgba(122, 167, 219, .3); border-radius: 6px; background: rgba(255, 255, 255, .035); color: #b5c8e1; font-family: var(--mono); font-size: 8px; cursor: pointer; }
.interaction-page .variant-button.primary { border-color: rgba(143, 205, 120, .45); background: rgba(143, 205, 120, .08); color: var(--green); }
.interaction-page .variant-button:hover { border-color: var(--gold); color: var(--gold-light); }
.interaction-page .variant-applied { color: var(--green); font-family: var(--mono); font-size: 8px; }
.interaction-page .variant-applied button { padding: 5px 7px; border: 1px solid rgba(143, 205, 120, .32); border-radius: 6px; background: transparent; color: var(--green); font-family: var(--mono); font-size: 8px; cursor: pointer; }
.interaction-page .variant-applied button:hover { background: rgba(143, 205, 120, .1); }

.interaction-page .composer-shell { flex: none; padding: 13px clamp(18px, 4vw, 76px) 13px; border-top: 1px solid var(--line); background: linear-gradient(180deg, rgba(12, 12, 15, .7), rgba(12, 12, 15, .98) 25%); }
.interaction-page .composer-topline { max-width: 720px; margin: 0 auto 9px; display: flex; align-items: center; gap: 10px; }
.interaction-page .composer-label { color: var(--gold); }
.interaction-page .composer-hint { flex: 1; color: var(--faint); font-family: var(--mono); font-size: 9px; }
.interaction-page .auto-toggle { padding: 4px 0; display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; color: var(--faint); font-family: var(--mono); font-size: 8px; cursor: pointer; white-space: nowrap; }
.interaction-page .auto-toggle i { width: 21px; height: 12px; position: relative; display: inline-block; border-radius: 50px; background: var(--faint); }
.interaction-page .auto-toggle i::after { content: ''; width: 8px; height: 8px; position: absolute; top: 2px; left: 2px; border-radius: 50%; background: #111; transition: .18s ease; }
.interaction-page .auto-toggle.is-on { color: var(--green); }
.interaction-page .auto-toggle.is-on i { background: var(--green); }
.interaction-page .auto-toggle.is-on i::after { left: 11px; }
.interaction-page .mode-switch { max-width: 720px; margin: 0 auto -1px; padding-left: 3px; display: flex; gap: 3px; }
.interaction-page .mode-button { padding: 7px 11px; display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 8px 8px 0 0; background: transparent; color: var(--faint); font-family: var(--mono); font-size: 9px; cursor: pointer; }
.interaction-page .mode-button span { font-size: 13px; }
.interaction-page .mode-button:hover { color: var(--muted); }
.interaction-page .mode-button.is-active { background: var(--panel-raised); color: var(--gold-light); }
.interaction-page .composer { max-width: 720px; margin: 0 auto; padding: 10px 11px 8px; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--panel-raised); box-shadow: 0 12px 30px -22px #000; }
.interaction-page .composer:focus-within { border-color: rgba(217, 169, 74, .58); box-shadow: 0 0 0 3px rgba(217, 169, 74, .08); }
.interaction-page .composer textarea { width: 100%; min-height: 34px; max-height: 150px; padding: 2px 3px 7px; display: block; resize: none; overflow-y: auto; border: 0; outline: 0; background: transparent; color: var(--ink); font-size: 18px; line-height: 1.35; }
.interaction-page .composer textarea::placeholder { color: #77727c; }
.interaction-page .composer-bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.interaction-page .composer-tools, .interaction-page .composer-submit { display: flex; align-items: center; gap: 5px; }
.interaction-page .composer-tool { width: 29px; height: 29px; display: grid; place-items: center; border: 0; border-radius: 8px; background: transparent; color: var(--muted); font-size: 16px; cursor: pointer; }
.interaction-page .composer-tool:hover { background: rgba(217, 169, 74, .11); color: var(--gold-light); }
.interaction-page .composer-tool-rewrite { color: var(--gold); }
.interaction-page .composer-divider { width: 1px; height: 19px; margin: 0 3px; background: var(--line); }
.interaction-page .composer-count { color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .send-button { width: 31px; height: 31px; display: grid; place-items: center; border: 0; border-radius: 9px; background: linear-gradient(145deg, var(--gold-light), var(--gold-deep)); color: #1e1608; font-family: var(--mono); font-size: 20px; line-height: 1; cursor: pointer; box-shadow: 0 5px 14px -7px var(--gold); }
.interaction-page .send-button:hover { filter: brightness(1.1); transform: translateY(-1px); }
.interaction-page .composer-footer { max-width: 720px; margin: 7px auto 0; display: flex; align-items: center; gap: 12px; color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .composer-footer .privacy-note { margin-left: auto; color: #777d79; }

.interaction-page .detail-head { padding: 3px 1px 18px; display: flex; align-items: flex-start; justify-content: space-between; }
.interaction-page .detail-head > span { display: flex; flex-direction: column; gap: 5px; }
.interaction-page .detail-head strong { font-family: var(--display); font-size: 22px; font-weight: 400; }
.interaction-page .detail-actions { padding: 0 0 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; border-bottom: 1px solid var(--line); }
.interaction-page .detail-actions button { min-width: 0; padding: 10px 3px 7px; display: flex; flex-direction: column; align-items: center; gap: 5px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--muted); cursor: pointer; }
.interaction-page .detail-actions button:hover { border-color: rgba(217, 169, 74, .28); background: rgba(217, 169, 74, .08); color: var(--gold-light); }
.interaction-page .detail-actions span { font-size: 19px; line-height: 1; }
.interaction-page .detail-actions small { font-family: var(--mono); font-size: 8px; white-space: nowrap; }
.interaction-page .theme-card, .interaction-page .story-arc-card { margin-top: 17px; padding: 14px; border: 1px solid var(--line); border-radius: 13px; background: rgba(255, 255, 255, .025); }
.interaction-page .theme-card { border-color: color-mix(in srgb, var(--gold) 31%, transparent); background: linear-gradient(145deg, var(--accent-soft), rgba(255, 255, 255, .02)); }
.interaction-page .theme-active, .interaction-page .arc-status { color: var(--gold-light); font-family: var(--mono); font-size: 8px; letter-spacing: .05em; text-align: right; }
.interaction-page .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.interaction-page .theme-choice { min-height: 54px; padding: 8px 7px; display: flex; align-items: center; gap: 7px; border: 1px solid var(--line); border-radius: 10px; background: rgba(7, 8, 11, .22); color: var(--muted); text-align: left; cursor: pointer; transition: border-color .18s ease, background .18s ease, color .18s ease, transform .18s ease; }
.interaction-page .theme-choice span { width: 22px; height: 22px; display: grid; place-items: center; flex: none; border-radius: 7px; background: rgba(255, 255, 255, .05); color: var(--gold); font-size: 13px; }
.interaction-page .theme-choice small { font-family: var(--mono); font-size: 8px; line-height: 1.25; }
.interaction-page .theme-choice:hover { border-color: color-mix(in srgb, var(--gold) 50%, transparent); color: var(--ink); transform: translateY(-1px); }
.interaction-page .theme-choice.is-active { border-color: var(--gold); background: var(--accent-soft); color: var(--gold-light); box-shadow: 0 10px 22px -20px var(--gold); }
.interaction-page .theme-choice.is-active span { background: var(--gold); color: var(--panel); }
.interaction-page .story-arc-card { background: linear-gradient(145deg, rgba(255, 255, 255, .035), rgba(255, 255, 255, .012)); }
.interaction-page .story-arc-card > p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.33; }
.interaction-page .arc-objective { margin-top: 13px; padding-top: 11px; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--line); }
.interaction-page .arc-objective span { color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .arc-objective strong { color: var(--gold-light); font-family: var(--display); font-size: 15px; font-weight: 400; line-height: 1.2; }
.interaction-page .presence-card, .interaction-page .state-card, .interaction-page .runtime-card { margin-top: 17px; padding: 14px; border: 1px solid var(--line); border-radius: 13px; background: rgba(255, 255, 255, .025); }
.interaction-page .presence-card { border-color: rgba(217, 169, 74, .24); background: linear-gradient(145deg, rgba(217, 169, 74, .1), rgba(255, 255, 255, .02)); }
.interaction-page .presence-top { display: flex; align-items: center; gap: 9px; }
.interaction-page .presence-avatar { width: 36px; height: 36px; overflow: hidden; flex: none; border: 1px solid var(--gold); border-radius: 11px; background: #2a1b0b; }
.interaction-page .presence-top > span:nth-child(2) { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 3px; }
.interaction-page .presence-top strong { overflow: hidden; font-family: var(--display); font-size: 16px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .presence-top small, .interaction-page .presence-relation small, .interaction-page .state-row small, .interaction-page .runtime-stage small { color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .presence-status { padding: 3px 6px; border: 1px solid rgba(143, 205, 120, .25); border-radius: 50px; color: var(--green); font-family: var(--mono); font-size: 8px; }
.interaction-page .presence-relation { margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.interaction-page .presence-relation span { display: flex; flex-direction: column; gap: 4px; }
.interaction-page .presence-relation b { color: var(--gold-light); font-family: var(--display); font-size: 14px; font-weight: 400; }
.interaction-page .relation-meter { height: 4px; margin: 12px 0 10px; overflow: hidden; border-radius: 50px; background: rgba(255, 255, 255, .09); }
.interaction-page .relation-meter i { width: 42%; height: 100%; display: block; border-radius: inherit; background: linear-gradient(90deg, var(--gold-deep), var(--gold-light)); }
.interaction-page .presence-card p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.35; }
.interaction-page .card-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.interaction-page .card-heading button { border: 0; background: transparent; color: var(--gold); cursor: pointer; }
.interaction-page .state-row { padding: 9px 0; display: flex; align-items: center; gap: 9px; border-top: 1px solid rgba(255, 255, 255, .07); }
.interaction-page .state-row:first-of-type { border-top: 0; }
.interaction-page .state-icon { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 7px; background: rgba(217, 169, 74, .1); color: var(--gold); font-size: 13px; }
.interaction-page .state-row > span:last-child { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.interaction-page .state-row strong { font-family: var(--display); font-size: 14px; font-weight: 400; }
.interaction-page .runtime-card { border-color: rgba(122, 167, 219, .2); background: linear-gradient(145deg, rgba(122, 167, 219, .07), rgba(255, 255, 255, .018)); }
.interaction-page .runtime-lock { padding: 3px 5px; border: 1px solid rgba(122, 167, 219, .3); border-radius: 4px; color: #9bb4d2; font-family: var(--mono); font-size: 7px; }
.interaction-page .runtime-stage { padding: 9px 0; display: flex; align-items: center; gap: 8px; border-top: 1px solid rgba(255, 255, 255, .07); }
.interaction-page .runtime-stage:first-of-type { border-top: 0; }
.interaction-page .runtime-stage > i { width: 7px; height: 7px; flex: none; border-radius: 50%; background: var(--faint); }
.interaction-page .runtime-stage.is-live > i { background: var(--green); box-shadow: 0 0 8px rgba(143, 205, 120, .7); }
.interaction-page .runtime-stage > span { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 3px; }
.interaction-page .runtime-stage strong { font-family: var(--display); font-size: 14px; font-weight: 400; }
.interaction-page .runtime-stage b { color: var(--faint); font-family: var(--mono); font-size: 8px; font-weight: 400; }
.interaction-page .runtime-more { width: 100%; margin-top: 6px; padding: 10px 0 0; display: flex; align-items: center; justify-content: space-between; border: 0; border-top: 1px solid rgba(255, 255, 255, .08); background: transparent; color: #9bb4d2; font-family: var(--mono); font-size: 8px; text-align: left; cursor: pointer; }
.interaction-page .runtime-more b { font-size: 14px; font-weight: 400; }
.interaction-page .detail-foot { padding: 17px 4px 0; display: flex; align-items: center; gap: 7px; color: var(--faint); font-family: var(--mono); font-size: 8px; }

.interaction-page .mobile-drawer-head { display: none; }
.interaction-page .app-scrim { position: fixed; inset: 0; z-index: 38; background: rgba(0, 0, 0, .66); backdrop-filter: blur(2px); }
.interaction-page .app-scrim[hidden] { display: none; }

.interaction-page .selection-toolbar { position: fixed; z-index: 90; max-width: min(560px, calc(100vw - 20px)); padding: 6px; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(217, 169, 74, .55); border-radius: 11px; background: rgba(20, 18, 23, .97); box-shadow: 0 18px 48px -18px #000; transform: translate(-50%, -100%); }
.interaction-page .selection-toolbar[hidden] { display: none; }
.interaction-page .selection-toolbar.is-below { transform: translate(-50%, 0); }
.interaction-page .selection-toolbar-text { max-width: 180px; overflow: hidden; padding: 0 6px; color: var(--muted); font-family: var(--mono); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .selection-toolbar button { padding: 7px 8px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid transparent; border-radius: 7px; background: rgba(255, 255, 255, .04); color: var(--muted); font-family: var(--mono); font-size: 8px; cursor: pointer; white-space: nowrap; }
.interaction-page .selection-toolbar button:hover { border-color: rgba(217, 169, 74, .42); background: rgba(217, 169, 74, .12); color: var(--gold-light); }
.interaction-page .selection-toolbar button span { color: var(--gold); font-size: 14px; line-height: 1; }
.interaction-page .selection-toolbar button small { font-size: 8px; }

.interaction-page .tool-modal { width: min(720px, calc(100vw - 36px)); max-height: min(760px, calc(100dvh - 48px)); padding: 0; overflow: hidden; border: 1px solid rgba(217, 169, 74, .42); border-radius: 18px; background: #141217; color: var(--ink); box-shadow: 0 35px 100px -30px #000; }
.interaction-page .tool-modal::backdrop { background: rgba(0, 0, 0, .72); backdrop-filter: blur(4px); }
.interaction-page .tool-modal[open] { animation: modal-in .22s ease both; }
@keyframes modal-in { from { opacity: 0; transform: translateY(10px) scale(.985); } to { opacity: 1; transform: none; } }
.interaction-page .modal-head { padding: 20px 22px 15px; display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; border-bottom: 1px solid var(--line); background: linear-gradient(145deg, rgba(217, 169, 74, .12), rgba(255, 255, 255, .015)); }
.interaction-page .modal-head h2 { margin: 5px 0 0; font-family: var(--display); font-size: 27px; font-weight: 400; }
.interaction-page .modal-body { max-height: calc(100dvh - 150px); overflow-y: auto; padding: 18px 22px 24px; scrollbar-width: thin; scrollbar-color: #ffffff22 transparent; }
.interaction-page .modal-close { flex: none; }
.interaction-page .modal-note { margin: 0 0 16px; color: var(--muted); font-size: 16px; line-height: 1.35; }
.interaction-page .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.interaction-page .modal-card { padding: 13px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .035); }
.interaction-page .modal-card h3 { margin: 0 0 5px; font-family: var(--display); font-size: 17px; font-weight: 400; }
.interaction-page .modal-card p { margin: 0; color: var(--muted); font-size: 15px; line-height: 1.35; }
.interaction-page .modal-card .modal-meta { margin-top: 10px; color: var(--faint); font-family: var(--mono); font-size: 8px; line-height: 1.5; }
.interaction-page .modal-card .modal-meta b { color: var(--gold); font-weight: 400; }
.interaction-page .modal-actions { margin-top: 15px; display: flex; justify-content: flex-end; gap: 8px; }
.interaction-page .modal-button { padding: 9px 14px; border: 1px solid var(--line); border-radius: 9px; background: rgba(255, 255, 255, .04); color: var(--muted); font-family: var(--mono); font-size: 9px; cursor: pointer; }
.interaction-page .modal-button.primary { border-color: var(--gold); background: rgba(217, 169, 74, .15); color: var(--gold-light); }
.interaction-page .modal-button:hover { border-color: var(--gold); color: var(--gold-light); }
.interaction-page .prompt-list { display: flex; flex-direction: column; gap: 7px; }
.interaction-page .prompt-row { padding: 11px 12px; display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 9px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, .025); }
.interaction-page .prompt-row:hover { border-color: rgba(217, 169, 74, .35); background: rgba(217, 169, 74, .06); }
.interaction-page .prompt-number { color: var(--gold); font-family: var(--mono); font-size: 9px; }
.interaction-page .prompt-row strong { display: block; font-family: var(--display); font-size: 16px; font-weight: 400; }
.interaction-page .prompt-row small { display: block; margin-top: 2px; color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .prompt-status { padding: 4px 6px; border: 1px solid var(--line); border-radius: 5px; color: var(--muted); font-family: var(--mono); font-size: 7px; text-transform: uppercase; white-space: nowrap; }
.interaction-page .prompt-status.primary { border-color: rgba(143, 205, 120, .3); color: var(--green); }
.interaction-page .prompt-status.advisory { border-color: rgba(122, 167, 219, .3); color: #9bb4d2; }
.interaction-page .prompt-status.async { border-color: rgba(217, 169, 74, .3); color: var(--gold); }
.interaction-page .model-summary { padding: 12px 13px; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(122, 167, 219, .25); border-radius: 11px; background: rgba(122, 167, 219, .07); }
.interaction-page .model-summary > span:first-child { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px; background: rgba(122, 167, 219, .12); color: #9bb4d2; }
.interaction-page .model-summary > span:last-child { display: flex; flex-direction: column; gap: 3px; }
.interaction-page .model-summary strong { font-family: var(--display); font-size: 16px; font-weight: 400; }
.interaction-page .model-summary small { color: #9bb4d2; font-family: var(--mono); font-size: 8px; }
.interaction-page .model-catalog-grid { margin-bottom: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.interaction-page .model-catalog-card { min-width: 0; padding: 9px; border: 1px solid var(--line); border-radius: 9px; background: rgba(255, 255, 255, .025); }
.interaction-page .model-catalog-card strong { display: block; overflow: hidden; font-family: var(--display); font-size: 13px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .model-catalog-card small { display: block; overflow: hidden; margin-top: 3px; color: var(--faint); font-family: var(--mono); font-size: 7px; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .model-catalog-card b { display: block; margin-top: 6px; color: var(--gold); font-family: var(--mono); font-size: 7px; font-weight: 400; text-transform: uppercase; }
.interaction-page .prompt-list-heading { margin: 0 0 8px; color: var(--faint); font-family: var(--mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; }
.interaction-page .inventory-list, .interaction-page .journal-list { display: flex; flex-direction: column; gap: 8px; }
.interaction-page .inventory-item, .interaction-page .journal-item { padding: 12px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--line); border-radius: 11px; background: rgba(255, 255, 255, .03); }
.interaction-page .inventory-symbol { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid var(--gold); border-radius: 9px; background: rgba(217, 169, 74, .1); color: var(--gold-light); font-size: 19px; }
.interaction-page .inventory-item > span:nth-child(2), .interaction-page .journal-item > span:nth-child(2) { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 3px; }
.interaction-page .inventory-item strong, .interaction-page .journal-item strong { font-family: var(--display); font-size: 16px; font-weight: 400; }
.interaction-page .inventory-item small, .interaction-page .journal-item small { color: var(--faint); font-family: var(--mono); font-size: 8px; }
.interaction-page .insert-button { padding: 7px 9px; border: 1px solid rgba(217, 169, 74, .4); border-radius: 7px; background: rgba(217, 169, 74, .08); color: var(--gold-light); font-family: var(--mono); font-size: 8px; cursor: pointer; }
.interaction-page .insert-button:hover { background: rgba(217, 169, 74, .18); }
.interaction-page .inventory-summary { padding: 12px 13px; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; border: 1px solid rgba(217, 169, 74, .25); border-radius: 11px; background: linear-gradient(135deg, rgba(217, 169, 74, .12), rgba(255, 255, 255, .025)); }
.interaction-page .inventory-summary > div { display: flex; flex-direction: column; gap: 5px; }
.interaction-page .inventory-summary strong { font-family: var(--display); font-size: 23px; font-weight: 400; }
.interaction-page .inventory-summary strong b { color: var(--gold-light); font-weight: 400; }
.interaction-page .inventory-load { color: var(--faint); font-family: var(--mono); font-size: 8px; text-align: right; }
.interaction-page .inventory-toolbar { margin-top: 13px; display: flex; align-items: center; gap: 8px; }
.interaction-page .inventory-search { min-width: 0; flex: 1; padding: 8px 10px; display: flex; align-items: center; gap: 7px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255, 255, 255, .035); color: var(--gold); }
.interaction-page .inventory-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ink); font-family: var(--mono); font-size: 10px; }
.interaction-page .inventory-search input::placeholder { color: var(--faint); }
.interaction-page .inventory-result-count { color: var(--faint); font-family: var(--mono); font-size: 8px; white-space: nowrap; }
.interaction-page .inventory-filters { margin: 9px 0 13px; display: flex; gap: 5px; overflow-x: auto; scrollbar-width: none; }
.interaction-page .inventory-filters::-webkit-scrollbar { display: none; }
.interaction-page .inventory-filter { padding: 6px 8px; border: 1px solid var(--line); border-radius: 50px; background: transparent; color: var(--faint); font-family: var(--mono); font-size: 8px; cursor: pointer; white-space: nowrap; }
.interaction-page .inventory-filter:hover, .interaction-page .inventory-filter.is-active { border-color: rgba(217, 169, 74, .45); background: rgba(217, 169, 74, .12); color: var(--gold-light); }
.interaction-page .inventory-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, .84fr); align-items: start; gap: 12px; }
.interaction-page .inventory-grid { min-width: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.interaction-page .inventory-card { min-width: 0; padding: 10px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, .03); color: inherit; text-align: left; cursor: pointer; }
.interaction-page .inventory-card:hover, .interaction-page .inventory-card.is-selected { border-color: rgba(217, 169, 74, .5); background: rgba(217, 169, 74, .1); }
.interaction-page .inventory-card .inventory-symbol { width: 34px; height: 34px; flex: none; }
.interaction-page .inventory-card-copy { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 3px; }
.interaction-page .inventory-card-copy strong { overflow: hidden; font-family: var(--display); font-size: 14px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .inventory-card-copy small { overflow: hidden; color: var(--faint); font-family: var(--mono); font-size: 7px; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .inventory-quantity { color: var(--gold); font-family: var(--mono); font-size: 8px; font-weight: 400; }
.interaction-page .inventory-symbol-legendary { border-color: #dfad51 !important; background: rgba(217, 169, 74, .15) !important; color: #f2cd7c !important; }
.interaction-page .inventory-symbol-epic { border-color: #b88bdf !important; background: rgba(184, 139, 223, .12) !important; color: #d4b7ed !important; }
.interaction-page .inventory-symbol-rare { border-color: #79a7d8 !important; background: rgba(121, 167, 216, .12) !important; color: #a7c9ed !important; }
.interaction-page .inventory-symbol-common { border-color: rgba(255, 255, 255, .2) !important; background: rgba(255, 255, 255, .06) !important; color: var(--muted) !important; }
.interaction-page .inventory-inspector { min-width: 0; padding: 14px; border: 1px solid rgba(217, 169, 74, .28); border-radius: 12px; background: linear-gradient(145deg, rgba(217, 169, 74, .09), rgba(255, 255, 255, .025)); }
.interaction-page .inventory-detail-head { display: flex; align-items: flex-start; gap: 10px; }
.interaction-page .inventory-detail-symbol { width: 48px; height: 48px; display: grid; place-items: center; flex: none; border: 1px solid var(--gold); border-radius: 13px; font-size: 25px; }
.interaction-page .inventory-detail-head > span:last-child { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.interaction-page .inventory-detail-head h3 { margin: 2px 0 0; font-family: var(--display); font-size: 21px; font-weight: 400; line-height: 1.05; }
.interaction-page .inventory-rarity { font-family: var(--mono); font-size: 8px; font-weight: 400; }
.interaction-page .inventory-rarity-legendary { color: var(--gold-light); }
.interaction-page .inventory-rarity-epic { color: #d4b7ed; }
.interaction-page .inventory-rarity-rare { color: #a7c9ed; }
.interaction-page .inventory-rarity-common { color: var(--muted); }
.interaction-page .inventory-description { margin: 14px 0; color: var(--muted); font-size: 15px; line-height: 1.35; }
.interaction-page .inventory-detail-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.interaction-page .inventory-detail-stats span { min-width: 0; padding: 7px 5px; display: flex; flex-direction: column; gap: 3px; border: 1px solid var(--line); border-radius: 7px; }
.interaction-page .inventory-detail-stats small { color: var(--faint); font-family: var(--mono); font-size: 7px; }
.interaction-page .inventory-detail-stats strong { overflow: hidden; color: var(--gold-light); font-family: var(--display); font-size: 14px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.interaction-page .inventory-detail-actions { margin-top: 13px; display: flex; flex-wrap: wrap; gap: 6px; }
.interaction-page .inventory-detail-actions .modal-button { flex: 1; padding-left: 8px; padding-right: 8px; }
.interaction-page .inventory-canon-note { margin-top: 13px; padding-top: 10px; display: flex; gap: 6px; border-top: 1px solid var(--line); color: var(--faint); font-family: var(--mono); font-size: 7px; line-height: 1.4; }
.interaction-page .inventory-canon-note > span:first-child { color: var(--gold); font-size: 13px; line-height: 1; }
.interaction-page .inventory-empty { min-height: 150px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; border: 1px dashed var(--line); border-radius: 10px; color: var(--faint); text-align: center; }
.interaction-page .inventory-empty > span { color: var(--gold); font-size: 23px; }
.interaction-page .inventory-empty strong { color: var(--muted); font-family: var(--display); font-size: 17px; font-weight: 400; }
.interaction-page .inventory-empty small { font-family: var(--mono); font-size: 8px; }
.interaction-page .inventory-empty-grid { grid-column: 1 / -1; }
.interaction-page .character-sheet { display: grid; grid-template-columns: 110px 1fr; gap: 18px; align-items: start; }
.interaction-page .sheet-portrait { width: 110px; height: 135px; overflow: hidden; border: 1px solid var(--gold); border-radius: 15px; background: #2a1b0b; }
.interaction-page .sheet-portrait img { width: 100%; height: 100%; object-fit: cover; }
.interaction-page .sheet-copy h3 { margin: 0; font-family: var(--display); font-size: 25px; font-weight: 400; }
.interaction-page .sheet-copy > p { margin: 4px 0 14px; color: var(--faint); font-family: var(--mono); font-size: 9px; }
.interaction-page .sheet-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.interaction-page .sheet-stat { padding: 9px 5px; border: 1px solid var(--line); border-radius: 9px; text-align: center; }
.interaction-page .sheet-stat b { display: block; color: var(--gold-light); font-family: var(--display); font-size: 20px; font-weight: 400; }
.interaction-page .sheet-stat small { color: var(--faint); font-family: var(--mono); font-size: 7px; text-transform: uppercase; }
.interaction-page .meter { height: 7px; margin-top: 15px; overflow: hidden; border-radius: 50px; background: rgba(255, 255, 255, .08); }
.interaction-page .meter i { width: 82%; height: 100%; display: block; background: linear-gradient(90deg, #bb453a, #e08053); }
.interaction-page .settings-group { margin-bottom: 17px; }
.interaction-page .settings-group > label { display: block; margin-bottom: 7px; color: var(--faint); font-family: var(--mono); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
.interaction-page .settings-help { display: block; margin-top: 7px; color: var(--faint); font-family: var(--mono); font-size: 8px; line-height: 1.4; }
.interaction-page .settings-segment { display: flex; border: 1px solid var(--line); border-radius: 9px; overflow: hidden; }
.interaction-page .settings-segment button { flex: 1; padding: 10px 5px; border: 0; border-right: 1px solid var(--line); background: transparent; color: var(--muted); font-family: var(--mono); font-size: 9px; cursor: pointer; }
.interaction-page .settings-segment button:last-child { border-right: 0; }
.interaction-page .settings-segment button.is-active { background: rgba(217, 169, 74, .16); color: var(--gold-light); }
.interaction-page .settings-check { display: flex; align-items: center; gap: 9px; color: var(--muted); font-size: 16px; }
.interaction-page .settings-check input { accent-color: var(--gold); }
.interaction-page .toast { position: fixed; left: 50%; bottom: 24px; z-index: 100; padding: 10px 15px; border: 1px solid var(--gold); border-radius: 50px; background: rgba(27, 18, 7, .95); color: var(--gold-light); font-family: var(--mono); font-size: 9px; opacity: 0; pointer-events: none; transform: translate(-50%, 10px); transition: .22s ease; }
.interaction-page .toast.is-visible { opacity: 1; transform: translate(-50%, 0); }

@media (max-width: 1160px) {
  .interaction-page .workspace { grid-template-columns: 240px minmax(390px, 1fr) 286px; }
  .interaction-page .topbar { grid-template-columns: 240px minmax(0, 1fr) auto; }
  .interaction-page .detail-rail { padding-left: 14px; padding-right: 14px; }
  .interaction-page .connection-state { display: none; }
}

@media (max-width: 900px) {
  .interaction-page .interaction-app { min-height: 0; }
  .interaction-page .topbar { height: 64px; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; padding: 0 14px; }
  .interaction-page .brand { font-size: 18px; }
  .interaction-page .topbar-context { justify-content: center; gap: 5px; flex-direction: column; align-items: center; }
  .interaction-page .topbar-context strong { max-width: 180px; font-size: 16px; }
  .interaction-page .topbar-kicker { font-size: 7px; }
  .interaction-page .mobile-only { display: inline-grid; }
  .interaction-page .workspace { display: block; position: relative; }
  .interaction-page .dialogue-column { width: 100%; height: calc(100dvh - 64px); }
  .interaction-page .thread-rail, .interaction-page .detail-rail { position: fixed; top: 0; bottom: 0; z-index: 40; width: min(310px, 88vw); box-shadow: 18px 0 50px -25px #000; transition: transform .25s ease; }
  .interaction-page .thread-rail { left: 0; transform: translateX(-102%); }
  .interaction-page .detail-rail { right: 0; transform: translateX(102%); }
  .interaction-page .thread-rail.is-open, .interaction-page .detail-rail.is-open { transform: translateX(0); }
  .interaction-page .mobile-drawer-head { min-height: 64px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); color: var(--gold-light); font-family: var(--display); font-size: 19px; }
  .interaction-page .thread-rail-head { padding-top: 20px; }
  .interaction-page .detail-rail { padding: 0 16px 18px; }
  .interaction-page .detail-rail .mobile-drawer-head { margin: 0 -16px 18px; padding: 0 16px; }
  .interaction-page .dialogue-head { height: 64px; padding: 0 14px; }
  .interaction-page .dialogue-character strong { font-size: 16px; }
  .interaction-page .dialogue-head-actions { gap: 7px; }
  .interaction-page .turn-badge { padding: 6px 7px; font-size: 8px; }
  .interaction-page .scene-context { padding: 9px 14px; }
  .interaction-page .context-link { font-size: 8px; }
  .interaction-page .story-pulse { min-height: 0; padding: 10px 14px; grid-template-columns: 30px minmax(0, 1fr); gap: 9px; }
  .interaction-page .story-pulse-stake { display: none; }
  .interaction-page .story-pulse-copy p { font-size: 13px; }
  .interaction-page .chat-scroll { padding: 18px 14px 12px; }
  .interaction-page .message { padding: 14px; }
  .interaction-page .composer-shell { padding: 10px 12px 10px; }
  .interaction-page .composer-footer { gap: 8px; }
  .interaction-page .composer-footer .privacy-note { display: none; }
}

@media (max-width: 520px) {
  .interaction-page .topbar-button { width: 31px; height: 31px; }
  .interaction-page .topbar-context strong { max-width: 145px; font-size: 15px; }
  .interaction-page .topbar-kicker { display: none; }
  .interaction-page .dialogue-head-actions .icon-button { display: none; }
  .interaction-page .turn-badge { font-size: 7px; }
  .interaction-page .scene-context { min-height: 49px; }
  .interaction-page .scene-context small { overflow: hidden; max-width: 185px; text-overflow: ellipsis; white-space: nowrap; }
  .interaction-page .context-link { padding: 0; }
  .interaction-page .story-pulse { padding-top: 9px; padding-bottom: 9px; }
  .interaction-page .story-pulse-copy strong { font-size: 15px; }
  .interaction-page .story-pulse-copy p { display: none; }
  .interaction-page .story-pulse-mark { width: 28px; height: 28px; }
  .interaction-page .message { margin-bottom: 13px; padding: 12px; }
  .interaction-page .message p { font-size: 17px; }
  .interaction-page .message-head strong { font-size: 15px; }
  .interaction-page .mode-switch { overflow-x: auto; scrollbar-width: none; }
  .interaction-page .mode-switch::-webkit-scrollbar { display: none; }
  .interaction-page .mode-button { padding: 7px 8px; font-size: 8px; white-space: nowrap; }
  .interaction-page .composer-topline { gap: 6px; }
  .interaction-page .composer-hint { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .interaction-page .auto-toggle { font-size: 0; }
  .interaction-page .composer textarea { font-size: 17px; }
  .interaction-page .composer-footer { justify-content: space-between; font-size: 7px; }
  .interaction-page .message-foot { gap: 5px; }
  .interaction-page .message-actions { gap: 3px; }
  .interaction-page .message-action-button { width: 27px !important; padding: 0 !important; }
  .interaction-page .message-action-button small { display: none; }
  .interaction-page .selection-toolbar { left: 10px !important; right: 10px; max-width: none; flex-wrap: wrap; transform: translate(0, -100%); }
  .interaction-page .selection-toolbar.is-below { transform: translate(0, 0); }
  .interaction-page .selection-toolbar-text { width: 100%; max-width: none; padding: 2px 5px 5px; }
  .interaction-page .selection-toolbar button { flex: 1; justify-content: center; }
  .interaction-page .modal-grid { grid-template-columns: 1fr; }
  .interaction-page .model-catalog-grid { grid-template-columns: 1fr 1fr; }
  .interaction-page .inventory-summary { align-items: flex-start; flex-direction: column; }
  .interaction-page .inventory-load { text-align: left; }
  .interaction-page .inventory-layout { grid-template-columns: 1fr; }
  .interaction-page .inventory-grid { grid-template-columns: 1fr 1fr; }
  .interaction-page .inventory-card { padding: 8px; }
  .interaction-page .inventory-card-copy strong { font-size: 13px; }
  .interaction-page .inventory-inspector { order: -1; }
  .interaction-page .character-sheet { grid-template-columns: 86px 1fr; gap: 12px; }
  .interaction-page .sheet-portrait { width: 86px; height: 111px; }
  .interaction-page .sheet-copy h3 { font-size: 22px; }
}

.interaction-page /* Readability scale: the primary dialogue keeps its compact shell, .interaction-page while prose and
   supporting labels grow together so the setting remains useful at every viewport. */
.interaction-app .thread-copy strong { font-size: calc(15px * var(--font-scale)); }
.interaction-page .interaction-app .thread-copy small, .interaction-page .interaction-app .thread-meta small { font-size: calc(8px * var(--font-scale)); }
.interaction-page .interaction-app .group-label, .interaction-page .interaction-app .search-threads span:nth-child(2) { font-size: calc(9px * var(--font-scale)); }
.interaction-page .interaction-app .message p { font-size: calc(18px * var(--font-scale)); }
.interaction-page .interaction-app .message-head strong { font-size: calc(16px * var(--font-scale)); }
.interaction-page .interaction-app .message-head small, .interaction-page .interaction-app .message-foot, .interaction-page .interaction-app .character-mood, .interaction-page .interaction-app .message-media-hint { font-size: calc(8px * var(--font-scale)); }
.interaction-page .interaction-app .message-action-button small { font-size: calc(7px * var(--font-scale)); }
.interaction-page .interaction-app .message-variant blockquote { font-size: calc(14px * var(--font-scale)); }
.interaction-page .interaction-app .message-variant > p { font-size: calc(16px * var(--font-scale)); }
.interaction-page .interaction-app .composer-hint, .interaction-page .interaction-app .context-link { font-size: calc(9px * var(--font-scale)); }
.interaction-page .interaction-app .auto-toggle, .interaction-page .interaction-app .composer-footer { font-size: calc(8px * var(--font-scale)); }
.interaction-page .interaction-app .mode-button { font-size: calc(9px * var(--font-scale)); }
.interaction-page .interaction-app .composer textarea { font-size: calc(18px * var(--font-scale)); }
.interaction-page .interaction-app .scene-context strong, .interaction-page .interaction-app .presence-relation b, .interaction-page .interaction-app .state-row strong, .interaction-page .interaction-app .runtime-stage strong { font-size: calc(14px * var(--font-scale)); }
.interaction-page .interaction-app .scene-context small, .interaction-page .interaction-app .presence-top small, .interaction-page .interaction-app .presence-relation small, .interaction-page .interaction-app .state-row small, .interaction-page .interaction-app .runtime-stage small, .interaction-page .interaction-app .detail-foot { font-size: calc(8px * var(--font-scale)); }
.interaction-page .interaction-app .modal-note { font-size: calc(16px * var(--font-scale)); }
.interaction-page .interaction-app .modal-card p, .interaction-page .interaction-app .inventory-description { font-size: calc(15px * var(--font-scale)); }
.interaction-page .interaction-app .modal-button, .interaction-page .interaction-app .settings-segment button { font-size: calc(9px * var(--font-scale)); }
.interaction-page .interaction-app .prompt-row strong, .interaction-page .interaction-app .inventory-item strong, .interaction-page .interaction-app .journal-item strong { font-size: calc(16px * var(--font-scale)); }
.interaction-page .interaction-app .prompt-row small, .interaction-page .interaction-app .inventory-item small, .interaction-page .interaction-app .journal-item small, .interaction-page .interaction-app .inventory-card-copy small { font-size: calc(8px * var(--font-scale)); }
.interaction-page .interaction-app .inventory-card-copy strong { font-size: calc(14px * var(--font-scale)); }
.interaction-page .interaction-app .inventory-canon-note, .interaction-page .interaction-app .inventory-detail-stats small, .interaction-page .interaction-app .inventory-empty small, .interaction-page .interaction-app .settings-help { font-size: calc(7px * var(--font-scale)); }

@media (prefers-reduced-motion: reduce) {
  .interaction-page, .interaction-page *, .interaction-page::before, .interaction-page *::before, .interaction-page::after, .interaction-page *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; }
}

</style>
