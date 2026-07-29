<template>
<div class="fabula-landing">
<div class="progress" id="prog"></div>
<svg class="grain" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"></feTurbulence></filter><rect width="100%" height="100%" filter="url(#n)"></rect></svg>

<header class="nav" id="nav">
  <div class="nav-in">
    <a href="#top" class="brand">ФАБУЛА</a>
    <nav class="nav-links">
      <a href="#packs">Миры</a>
      <a href="#feats">Возможности</a>
      <a href="#price">Тарифы</a>
      <a href="#" class="auth-open" data-auth="login">Войти</a>
      <a href="/app" class="btn btn-solid">Начать</a>
    </nav>
  </div>
</header>

<section class="hero" id="top">
  <div class="hero-bg" id="heroBg">
    <div class="hero-fallback"></div>
    <video class="hero-video" id="heroVideo" poster="/assets/hero_landing.jpg?v6" muted="" loop="" playsinline="" preload="none"></video>
  </div>
  <div class="hero-vig"></div>
  <div class="dust" id="dust"></div>
  <div class="hero-in">
    <span class="eyebrow">Текстовые приключения с ИИ</span>
    <h1><span class="l"><span>Создай</span></span><span class="l"><span>свою историю</span></span></h1>
    <p class="lede">Создай свой уникальный и неповторимый мир с собственной историей или путешествуй
      по чужим мирам, а наш ИИ поможет в этом приключении. Тебя ждет интересная история и неожиданные
      сюжетные повороты в сопровождении ярких иллюстраций. Будущее твоего мира зависит только от тебя</p>
    <div class="hero-cta">
      <a href="/app" class="btn btn-solid" style="padding:18px 36px;font-size:14px">Начать историю</a>
      <a href="#packs" class="btn btn-ghost" style="padding:18px 32px;font-size:14px">Смотреть миры</a>
    </div>
  </div>
</section>

<section class="sec" id="how">
  <div class="wrap">
    <div class="sec-head rv" style="transition-delay: 0ms;">
      <div class="sec-kicker"><br></div>
      <h2>Начни свое приключение</h2>
      <p class="sec-sub">Откройте для себя формат интерактивных историй, где правила и окружение подстраиваются под вас.</p>
    </div>
    <div class="steps">
      <div class="step rv" style="transition-delay: 80ms;"><div class="step-n"><br></div><h3>Выбери мир</h3>
        <p>Выберите желаемый сеттинг — от классического фэнтези до исследования космоса. Вы можете довериться предустановленным параметрам или настроить тон и сложность повествования под себя.</p></div>
      <div class="step rv" style="transition-delay: 160ms;"><div class="step-n"><br></div><h3>Играй</h3>
        <p>Следите за развитием событий и делайте выбор. Вы можете следовать предлагаемым сценариям или импровизировать, описывая любые действия текстом.</p></div>
      <div class="step rv" style="transition-delay: 240ms;"><div class="step-n"><br></div><h3>Мир запомнит<br></h3>
        <p>Предметы, персонажи и ключевые решения запоминаются. Мир сохраняет логику ваших поступков и отзывается на них даже спустя десятки глав.</p></div>
    </div>
  </div>
</section>

<section class="sec" id="packs">
  <div class="aura" style="width:820px;height:520px;left:-12%;top:4%"></div>
  <div class="wrap">
    <div class="sec-head rv" style="transition-delay: 0ms;">
      <div class="sec-kicker"><br></div>
      <h2>Выберите вселенную</h2>
      <p class="sec-sub">Каждая история предлагает уникальное визуальное оформление, динамическую сложность и свой характер повествования.</p>
    </div>
    <div class="packs">
      <a class="pack rv" href="/app" style="--g: var(--fant); transition-delay: 80ms;">
        <div class="cv"><img src="/assets/cover_fantasy.jpg" alt=""><video class="cv-vid" data-src="/assets/cover_fantasy.mp4?v4" muted loop playsinline preload="none"></video></div>
        <span class="tag">Фэнтези</span>
        <div class="pack-body">
          <h3>Пепельные земли</h3>
          <div class="pack-reveal">
          <p class="pack-desc">Ты очнулся в выгоревших руинах без имени и с чужим мечом в руке. Что здесь случилось двадцать лет назад, толком не помнит уже никто.</p>
          <div class="pack-stats"><span>12 историй</span><span>Тяжёлая</span><span>Мрачный</span></div>
          <div class="pack-foot"><span class="rating">★ 4.8</span><span class="go">Открыть →</span></div></div>
        </div></a>
      <a class="pack rv" href="/app" style="--g: var(--scifi); transition-delay: 160ms;">
        <div class="cv"><img src="/assets/cover_scifi.jpg" alt=""><video class="cv-vid" data-src="/assets/cover_scifi.mp4?v4" muted loop playsinline preload="none"></video></div>
        <span class="tag">Sci-Fi</span>
        <div class="pack-body">
          <h3>Станция «Кассандра»</h3>
          <div class="pack-reveal">
          <p class="pack-desc">Тебя разбудили на 214 лет позже срока. Экипажа нет, а бортовой ИИ сомневается, что ты это ты.</p>
          <div class="pack-stats"><span>9 историй</span><span>Обычная</span><span>Напряжённый</span></div>
          <div class="pack-foot"><span class="rating">★ 4.6</span><span class="go">Открыть →</span></div></div>
        </div></a>
      <a class="pack rv" href="/app" style="--g: var(--hist); transition-delay: 240ms;">
        <div class="cv"><img src="/assets/cover_history.jpg" alt=""><video class="cv-vid" data-src="/assets/cover_history.mp4?v4" muted loop playsinline preload="none"></video></div>
        <span class="tag">История</span>
        <div class="pack-body">
          <h3>Восстание Спартака</h3>
          <div class="pack-reveal">
          <p class="pack-desc">Школа гладиаторов Батиата, 73 год до нашей эры. Ночью в казарме шепчутся о побеге, и завтра тебе решать, с кем ты.</p>
          <div class="pack-stats"><span>7 историй</span><span>Тяжёлая</span><span>Драматичный</span></div>
          <div class="pack-foot"><span class="rating">★ 4.7</span><span class="go">Открыть →</span></div></div>
        </div></a>
      <a class="pack rv" href="/app" style="--g: var(--post); transition-delay: 0ms;">
        <div class="cv"><img src="/assets/cover_postapoc.jpg" alt=""><video class="cv-vid" data-src="/assets/cover_postapoc.mp4?v4" muted loop playsinline preload="none"></video></div>
        <span class="tag">Пост-апокалипсис</span>
        <div class="pack-body">
          <h3>После тишины</h3>
          <div class="pack-reveal">
          <p class="pack-desc">Город зарос за двадцать лет, и сегодня ты впервые за долгое время услышал чужой голос.</p>
          <div class="pack-stats"><span>6 историй</span><span>Обычная</span><span>Тревожный</span></div>
          <div class="pack-foot"><span class="rating">★ 4.5</span><span class="go">Открыть →</span></div></div>
        </div></a>
    </div>
  </div>
</section>

<div class="dock" id="dock"><i>Первые главы бесплатно</i>
  <a href="/app" class="btn btn-solid" style="padding:13px 26px;font-size:12px">Начать</a></div>

<section class="sec" id="feats">
  <div class="wrap">
    <div class="sec-head rv" style="transition-delay: 80ms;">
      <div class="sec-kicker"><br></div>
      <h2>Больше, чем просто диалог</h2>
      <p class="sec-sub">ФАБУЛА объединяет гибкость генеративного ИИ с четкими правилами классических настольных ролевых игр.</p>
    </div>
    <div class="feats">
      <div class="feat rv" style="transition-delay: 160ms;"><span class="ic" style="--m:url(assets/icons/feat/inv.png?v2)"></span><h3>Система инвентаря</h3>
        <p>Вся экипировка и ресурсы интегрированы в логику мира. Достаточно использовать предмет в диалоге или действии, чтобы кардинально изменить ход текущей сцены.</p>
        <div class="demo demo-inv" aria-hidden="true">
          <div class="d-grid"><i class="sel"><img src="/assets/items/sword.png" alt="Клинок Тихого Пепла" loading="lazy"></i><i class=""><img src="/assets/items/striker.png" alt="Огниво странника" loading="lazy"></i><i class=""><img src="/assets/items/flask.png" alt="Фляга с талой водой" loading="lazy"></i><i class=""><img src="/assets/items/map.png" alt="Обугленная карта" loading="lazy"></i><i class=""><img src="/assets/items/amulet.png" alt="Амулет хранителя" loading="lazy"></i><i class=""><img src="/assets/items/key.png" alt="Ключ от Цитадели" loading="lazy"></i><i class=""><img src="/assets/items/ash.png" alt="Горсть пепла" loading="lazy"></i><i class=""><img src="/assets/items/knife.png" alt="Кремневый нож" loading="lazy"></i></div>
          <div class="d-card"><b class="d-name" style="opacity: 0;">Клинок Тихого Пепла</b><span class="d-go">В диалог →</span></div>
        </div></div>
      <div class="feat rv" style="transition-delay: 240ms;"><span class="ic" style="--m:url(assets/icons/feat/journal.png?v2)"></span><h3>Системный журнал</h3>
        <p>События, локации и персонажи структурируются и фиксируются в реальном времени. Вам не нужно вести заметки — система сама упорядочивает контекст и ключевые факты вашей истории.</p>
        <div class="demo demo-jrn" aria-hidden="true">
          <div class="d-rows">
            <div class="d-row"><span class="dot" style="--d:var(--scifi)"></span>Персонажи<b>2</b></div>
            <div class="d-row"><span class="dot" style="--d:var(--fant)"></span>События<b>3</b></div>
            <div class="d-row"><span class="dot" style="--d:var(--post)"></span>Места<b>1</b></div>
          </div>
          <div class="d-entry" style="opacity: 0;">Старик-хранитель ждал того, кто поднимет меч</div>
        </div></div>
      <div class="feat rv" style="transition-delay: 0ms;"><span class="ic" style="--m:url(assets/icons/feat/scene.png?v2)"></span><h3>Сюжетная визуализация</h3>
        <p>Текстовое повествование дополняется графическими иллюстрациями. Визуальный ряд фиксирует сцены, локации и окружение, усиливая эстетику и атмосферу происходящего.</p>
        <div class="demo demo-scene" aria-hidden="true">
          <div class="d-txt">Ветер несёт пепел. Рука натыкается на сталь…</div>
          <div class="d-shot"><img src="/assets/keyframe_01.jpg" alt="" loading="lazy"></div>
        </div></div>
      <div class="feat rv" style="transition-delay: 80ms;"><span class="ic" style="--m:url(assets/icons/feat/memory.png?v2)"></span><h3>Долгосрочные последствия</h3>
        <p>Персонажи удерживают историю прошлых взаимодействий, обещаний и конфликтов. Окружение реагирует на Вашего героя на основе его реальной репутации и прошлых действий.</p></div>
      <div class="feat rv" style="transition-delay: 160ms;"><span class="ic" style="--m:url(assets/icons/feat/tone.png?v2)"></span><h3>Атмосферная адаптация</h3>
        <p>Возможность точно задавать характер и настроение истории — от жесткого реализма до камерной драмы — без нарушения общей логики мира.</p></div>
      <div class="feat rv" style="transition-delay: 240ms;"><span class="ic" style="--m:url(assets/icons/feat/access.png?v2)"></span><h3>Доступ без ограничений</h3>
        <p>Работает напрямую в браузере на любом устройстве без необходимости скачивания из магазинов приложений. Мгновенный старт сессии с сохранением полного функционала на смартфонах, планшетах и ПК.</p></div>
    </div>
  </div>
</section>

<section class="sec" id="fork">
  <div class="aura" style="width:700px;height:440px;left:-12%;top:14%;animation-delay:-4s"></div>
  <div class="wrap">
    <div class="sec-head rv" style="transition-delay: 0ms;">
      <div class="sec-kicker"><br></div>
      <h2>Отсюда история идёт по-разному</h2>
      <p class="sec-sub">Это не две заранее написанные ветки. Модель разворачивает сцену от того,
        что уже лежит у тебя в инвентаре и в журнале.</p>
    </div>
    <div class="gp-wrap rv"><div class="gp" id="gp">
      <div class="gp-chat" id="gpChat"></div>
      <div class="gp-foot" id="gpFoot"></div>
      <div class="gp-bar"><span class="gp-send" id="gpSend">Дальше ➤</span></div>
    </div></div>

    <div class="sec-head rv" style="margin-top: 74px; transition-delay: 160ms;">
      <br>      <h2>Что мир записал за тобой</h2>
      <p class="sec-sub">Так выглядят настоящие записи после первой главы. Каждую можно открыть
        и переписать — дальше модель будет исходить из твоей версии.</p>
    </div>
    <div class="lore rv" style="transition-delay: 240ms;">
      <div class="lore-c"><h4>Старик у переправы</h4>
        <p>Седой, хромает на левую ногу. Знает, чьё клеймо на клинке, но говорить отказался.
          Просил меч не забирать.</p>
        <div class="lore-t"><span>персонаж</span><span>переправа</span><span>не доверяет</span></div></div>
      <div class="lore-c"><h4>Клинок Тихого Пепла</h4>
        <p>Чужое клеймо у гарды, рукоять холодная на ощупь. Вытащен из золы в первой главе.
          Старик узнал его с одного взгляда.</p>
        <div class="lore-t"><span>предмет</span><span>оружие</span><span>клеймо</span></div></div>
      <div class="lore-c"><h4>Восточная переправа</h4>
        <p>Мост сгорел, брод по пояс. С востока постоянно тянет пеплом. На той стороне видны
          столбы дыма — кто-то жжёт костры.</p>
        <div class="lore-t"><span>место</span><span>дым на востоке</span></div></div>
    </div>
  </div>
</section>

<section class="sec" id="price">
  <div class="aura" style="width:760px;height:480px;right:-14%;top:10%;animation-delay:-9s"></div>
  <div class="wrap">
    <div class="sec-head rv" style="transition-delay: 0ms;">
      <div class="sec-kicker"><br></div>
      <h2>Ваша история не должна останавливаться</h2>
      <p class="sec-sub">Подключите подходящий тариф для исследования глубоких миров без сюжетных ограничений.</p>
    </div>

    <div class="pay-sw rv" id="paySw" style="transition-delay: 80ms;">
      <button type="button" data-p="m" aria-pressed="true">Ежемесячно</button>
      <button type="button" data-p="y" aria-pressed="false">На год <span class="save">−20%</span></button>
    </div>

    <div class="tiers">
      <div class="tier rv" style="--t: var(--ink-mute); transition-delay: 160ms;">
        <div class="tier-top"><h3>Странник</h3><span class="tier-role">знакомство</span></div>
        <div class="price" data-m="0" data-y="0">0 <small>₽</small></div>
        <div class="tier-lim"><b>3 главы в сутки.</b> Память ~16 000 символов</div>
        <ul>
          <li>Все четыре мира открыты</li>
          <li>Базовая модель повествования</li>
          <li>Инвентарь и журнал целиком</li>
          <li>Один кадр на главу</li>
          <li class="off">Память дальше 16 000 символов</li>
          <li class="off">Свои сценарии</li>
        </ul>
        <a href="/app" class="btn btn-ghost">Играть бесплатно</a></div>

      <div class="tier best rv" style="--t: var(--fant); transition-delay: 240ms;">
        <span class="badge">Выбирают чаще всего</span>
        <div class="tier-top"><h3>Бард</h3><span class="tier-role">основной</span></div>
        <div class="price" data-m="490" data-y="390">490 <small>₽ / мес</small></div>
        <div class="tier-lim"><b>Без счётчика глав.</b> Память ~64 000 символов</div>
        <ul>
          <li>Умная модель: живые диалоги и характеры</li>
          <li>Помнит ~64 000 символов, это весь пак</li>
          <li>До пяти кадров на главу</li>
          <li>Тон и сложность под себя</li>
          <li>Редактирование журнала</li>
          <li class="off">Приоритет в очереди</li>
        </ul>
        <a href="/app" class="btn btn-solid">Выбрать «Барда»</a></div>

      <div class="tier top rv" style="--t: var(--epic); transition-delay: 0ms;">
        <span class="badge">Максимум</span>
        <div class="tier-top"><h3>Архимаг</h3><span class="tier-role">для длинных кампаний</span></div>
        <div class="price" data-m="990" data-y="790">990 <small>₽ / мес</small></div>
        <div class="tier-lim"><b>Всё из «Барда».</b> Память ~200 000 символов</div>
        <ul>
          <li>Топовые модели, самый связный текст</li>
          <li>Помнит ~200 000 символов, это все паки</li>
          <li>Кадры без ограничений</li>
          <li>Приоритет в очереди генерации</li>
          <li>Новые миры за неделю до остальных</li>
          <li>Свои паки и сценарии</li>
        </ul>
        <a href="/app" class="btn btn-ghost">Выбрать «Архимага»</a></div>
    </div>

    <div class="once rv" style="transition-delay: 80ms;">
      <div>
        <h4>Не готов подписываться?</h4>
        <p>Тогда возьми один мир навсегда: все главы пака, умная модель и память внутри него, разово и без ежемесячных списаний.</p>
      </div>
      <div class="amt">от 349 <small>₽ за мир</small></div>
      <a href="/app" class="btn btn-ghost">Выбрать мир</a>
    </div>

    <p class="price-note rv" style="transition-delay: 160ms;">Отменить можно в любой момент, доступ доживёт до конца оплаченного срока. Карты РФ и зарубежные, СБП.</p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="final rv" id="final" style="transition-delay: 240ms;">
      <video class="cta-video" id="ctaVideo" muted="" loop="" playsinline="" preload="none"></video>
      <div class="sec-kicker"><br></div>
      <h2 style="margin-bottom:16px">Ваша история начинается здесь<br></h2>
      <p class="sec-sub" style="margin-bottom:30px"><br></p>
      <a href="/app" class="btn btn-solid" style="padding:18px 42px;font-size:14px">Начать историю</a>
    </div>
  </div>
</section>

<footer>
  <div class="foot-in">
    <div>© 2026 ФАБУЛА · интерактивные истории с ИИ</div>
    <div><a href="#packs">Миры</a><a href="#price">Тарифы</a><a href="/app">Начать</a></div>
  </div>
</footer>



<!-- ===== модалка входа/регистрации ===== -->
<div class="auth-scrim" id="authScrim" aria-hidden="true">
  <div class="auth" id="authBox" role="dialog" aria-modal="true" aria-label="Вход">
    <button class="auth-x" id="authClose" aria-label="Закрыть">✕</button>
    <div class="auth-brand">ФАБУЛА</div>
    <div class="auth-sub" id="authSub">С возвращением, странник</div>
    <div class="auth-tabs">
      <button data-tab="login" class="on">Вход</button>
      <button data-tab="reg">Регистрация</button>
    </div>
    <form id="authForm" novalidate>
      <div class="auth-field auth-reg">
        <label>Как тебя звать</label>
        <input type="text" id="afName" autocomplete="nickname" placeholder="Ник: латиница, цифры, _">
      </div>
      <div class="auth-field">
        <label>Почта</label>
        <input type="email" id="afEmail" autocomplete="email" placeholder="you@example.com">
      </div>
      <div class="auth-field">
        <label>Пароль</label>
        <input type="password" id="afPass" autocomplete="current-password" placeholder="••••••••">
      </div>
      <div class="auth-field auth-reg">
        <label>Повтори пароль</label>
        <input type="password" id="afPass2" autocomplete="new-password" placeholder="••••••••">
      </div>
      <div class="auth-msg" id="authMsg"></div>
      <button type="submit" class="btn btn-solid auth-submit" id="authSubmit">Войти</button>
    </form>
    <div class="auth-or">или</div>
    <div class="auth-soc">
      <div id="googleBtnHolder" style="display:flex;justify-content:center;overflow:hidden"></div>
      <button data-soc="tg"><svg class="ic" viewBox="0 0 24 24" fill="#2AABEE"><path d="M21.9 4.3l-3.3 15.6c-.25 1.1-.9 1.37-1.83.85l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1 .5l.36-5.13L18 6.36c.4-.36-.09-.56-.62-.2L6.98 13.02l-4.7-1.47c-1.02-.32-1.04-1.02.22-1.5l18.36-7.08c.85-.31 1.6.2 1.32 1.33z"/></svg>Продолжить с Telegram</button>
    </div>
    <div id="nickStep" style="display:none;margin-top:14px">
      <div class="auth-field"><label>Придумай ник</label>
        <input type="text" id="gNick" autocomplete="off" placeholder="Ник: латиница, цифры, _"></div>
      <div class="auth-msg" id="gNickMsg"></div>
      <button type="button" class="btn btn-solid auth-submit" id="gNickSubmit">Продолжить</button>
    </div>
  </div>
</div>
</div>
</template>

<script setup>
import { onMounted } from 'vue'
import '~/assets/css/main.css'
const googleClientId = useRuntimeConfig().public.googleClientId || ''
onMounted(() => {
  document.querySelectorAll('.fabula-landing img').forEach(img => {
    img.addEventListener('error', () => { img.style.display = 'none' }, { once: true })
  })

  // если уже есть сессия — «Войти» становится «Профиль», добавляем «Миры», «Начать» → «Продолжить»
  function markLoggedInNav(){
    const loginLink = document.querySelector('.nav-links a[data-auth="login"]')
    if (loginLink) {
      loginLink.textContent = 'Профиль'; loginLink.setAttribute('href', '/app?scr=profile'); loginLink.removeAttribute('data-auth')
      if (!document.querySelector('.nav-links a[data-worlds]')) {
        const worlds = document.createElement('a'); worlds.textContent = 'Миры'; worlds.href = '/app?scr=packs'; worlds.setAttribute('data-worlds','1')
        loginLink.parentNode.insertBefore(worlds, loginLink)
      }
    }
    const startBtn = document.querySelector('.nav-links a.btn-solid')
    if (startBtn) { startBtn.textContent = 'Продолжить'; startBtn.setAttribute('href','/app') }
  }
  try { if (localStorage.getItem('fabula-token')) markLoggedInNav() } catch (e) {}


document.documentElement.classList.add('js');

/* scroll reveal + safety net (never leave content invisible) */
const rvAll=document.querySelectorAll('.rv');
const revealAll=()=>rvAll.forEach(el=>el.classList.add('in'));
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.12});
  rvAll.forEach((el,i)=>{ el.style.transitionDelay=(i%4*80)+'ms'; io.observe(el); });
  setTimeout(revealAll,2500);
} else revealAll();

/* floating dust over the hero */
const dust=document.getElementById('dust');
if(dust) for(let i=0;i<14;i++){
  const s=document.createElement('i');
  s.style.left=(Math.random()*100)+'%';
  s.style.bottom=(-10-Math.random()*30)+'px';
  s.style.animationDuration=(11+Math.random()*16)+'s';
  s.style.animationDelay=(-Math.random()*20)+'s';
  const sz=1+Math.random()*2.2; s.style.width=s.style.height=sz+'px';
  dust.appendChild(s);
}

/* ===== effect layer ===== */
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* product window: tilt flattens as the block travels up the viewport */
const stageEl = document.getElementById('stage');
function tiltStage(){
  if (!stageEl) return;
  const r = stageEl.getBoundingClientRect();
  // 0 when the top edge is still a screen away, 1 once it reaches a third up
  const p = Math.min(1, Math.max(0, 1 - (r.top - innerHeight * .32) / (innerHeight * .68)));
  stageEl.style.setProperty('--tilt', (22 * (1 - p)).toFixed(2) + 'deg');
  stageEl.style.setProperty('--sc', (.93 + .07 * p).toFixed(3));
}
if (stageEl && calm) { stageEl.style.setProperty('--tilt','0deg'); stageEl.style.setProperty('--sc','1'); }

/* sticky CTA: appears past the hero, retreats once the closing block is on screen */
const dock = document.getElementById('dock');
function syncDock(){
  if (!dock) return;
  const closing = document.getElementById('final');
  const past = scrollY > innerHeight * .85;
  const atEnd = closing && closing.getBoundingClientRect().top < innerHeight * .9;
  dock.classList.toggle('on', past && !atEnd);
}

/* тарифы: пункты проявляются лесенкой, когда карточка доезжает до экрана */
(() => {
  const tiers = document.querySelectorAll('.tier');
  if (!tiers.length || !('IntersectionObserver' in window)) return;
  tiers.forEach(t => {
    t.classList.add('anim');
    t.querySelectorAll('li').forEach((li, i) => { li.style.transitionDelay = (110 + i * 70) + 'ms'; });
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('lit'); io.unobserve(e.target); }
  }), { threshold: .08 });
  tiers.forEach(t => io.observe(t));
  setTimeout(() => tiers.forEach(t => t.classList.add('lit')), 2500);   // страховка
})();

/* split section headings into words wrapped in a clipping mask */
if (!calm) {
  document.querySelectorAll('.sec-head h2').forEach(h => {
    h.innerHTML = h.textContent.trim().split(/\s+/)
      .map(w => `<span class="wsp"><i>${w}</i></span>`).join(' ');
    // stagger runs off the word index, so longer headings stay in step
    h.querySelectorAll('.wsp>i').forEach((el, i) => el.style.transitionDelay = (i * 55) + 'ms');
  });
}

/* cursor spotlight on every card, plus tilt on the world covers */
document.querySelectorAll('.pack,.feat,.tier,.once').forEach(el => el.classList.add('spot'));
if (!calm && matchMedia('(hover:hover)').matches) {
  document.querySelectorAll('.spot').forEach(el => {
    const tilt = el.classList.contains('pack');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (x * 100) + '%');
      el.style.setProperty('--my', (y * 100) + '%');
      if (tilt) {
        el.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
      }
    });
    if (tilt) el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ===== живой геймплей: та же сцена и те же реплики, что в app.html ===== */
(() => {
  const chat = document.getElementById('gpChat'), foot = document.getElementById('gpFoot'),
        host = document.getElementById('gp');
  if (!host) return;

  const CH = [
    { t:'nar', h:'Королевство Пепельных земель', drop:'Д',
      p:'ревние хроники лгали — мир не погиб в одночасье. Он умирал медленно, век за веком, пока от цветущих долин Эхокарта не остался лишь серый пепел.' },
    { t:'nar', kf:'/assets/keyframe_01.jpg',
      p:'Среди обломков рука натыкается на сталь — тёплый клинок, будто им только что рубили. На лезвии герб, которого ты не узнаёшь: три звезды над разбитой короной.' },
    { t:'ctx', p:'<span class="k">Найден предмет</span><b>Клинок Тихого Пепла</b>'+
        '<i>чужое клеймо у гарды, рукоять холодная на ощупь</i>', inv:1 },
    { t:'nar', kf:'/assets/keyframe_02.jpg',
      p:'«Значит, ты всё-таки проснулся», — раздаётся хриплый голос за спиной. Старик смотрит не на тебя — только на клинок в твоей руке.' },
    { t:'ctx', cls:'ctx note', p:'<span class="k">Запись в журнале</span><b>Старик-хранитель</b>'+
        '<i>двадцать лет ждал того, кто поднимет меч</i>' },
    { t:'ask', q:['Пойти к деревне — там могут быть выжившие.',
                  'Ступить на мост навстречу незнакомцу.',
                  'Расспросить старика, кто ты такой.'], pick:1 },
    { t:'me',  p:'Ступить на мост навстречу незнакомцу.' },
    { t:'sys', p:'ИИ дописывает следующую главу по твоему выбору…' }
  ];

  /* наклон распрямляется по мере подъёма окна */
  function tilt(){
    const r = host.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, 1 - (r.top - innerHeight*.3)/(innerHeight*.7)));
    host.style.setProperty('--tilt', (11*(1-k)).toFixed(2)+'deg');
    host.style.setProperty('--sc', (.95+.05*k).toFixed(3));
  }
  addEventListener('scroll', () => requestAnimationFrame(tilt), {passive:true});
  tilt();

  /* Автопрокрутка отключается, как только посетитель сам отмотал вверх — иначе
     перечитать предыдущую сцену невозможно, ленту будет всё время утягивать вниз. */
  let hold = false;
  chat.addEventListener('scroll', () => {
    hold = chat.scrollHeight - chat.scrollTop - chat.clientHeight > 70;
  }, { passive: true });
  const stick = () => { if (!hold) chat.scrollTop = chat.scrollHeight; };
  let skip = null;                       // прерывает текущую паузу по клику
  const cont = () => { foot.innerHTML = ''; };
  const send = document.getElementById('gpSend');
  if (send) send.onclick = () => { if (skip) skip(); };
  /* Пауза между сценами: кнопка подсвечивается и ждёт живого нажатия.
     Никто не нажал — идём дальше сами, чтобы демо не замирало. */
  const beat = async (ms) => {
    if (send) send.classList.add('hot');
    await wait(ms);
    if (send) send.classList.remove('hot');
  };
  const add = (cls, html) => {
    const d = document.createElement('div');
    d.className = 'gp-m ' + cls; d.innerHTML = html;
    chat.appendChild(d);
    // раньше здесь вырезались предыдущие реплики, и после большого кадра
    // в окне оставалась одна плашка посреди пустоты
    stick(); setTimeout(stick, 80); setTimeout(stick, 400);   // картинка меняет высоту уже после вставки
    return d;
  };

  /* Поколение нужно, чтобы остановка реально прерывала цикл: снять таймер мало —
     ожидающий промис тогда не разрешится и цикл повиснет навсегда. */
  let timers = [], gen = 0, picked = null;
  const wait = (ms) => new Promise(r => {
    const t = setTimeout(r, ms); timers.push([t, r]);
    skip = () => { clearTimeout(t); r(); };
  });
  const stop = () => { gen++; timers.forEach(([t,r]) => { clearTimeout(t); r(); }); timers = []; };
  const type = (el, text, ms) => new Promise(done => {
    let i = 0, over = false;
    // клик по «Дальше» во время набора дописывает абзац целиком, а не ждёт конца
    const finish = () => { if (over) return; over = true; el.textContent = text; stick(); done(); };
    skip = finish;
    const step = () => {
      if (over) return;
      if (i >= text.length) return finish();
      i = Math.min(text.length, i + 2);
      el.textContent = text.slice(0, i);
      stick();                            // текст растёт по ходу набора — доматываем вслед
      timers.push([setTimeout(step, ms), finish]);
    };
    step();
  });

  async function play(){
    const my = ++gen;
    for (; my === gen;) {
      chat.innerHTML = ''; cont(); hold = false;
      // затравка: заглавие и первый абзац уже на месте, чтобы не смотреть в пустоту
      add('nar', '<p>' + CH[0].drop + CH[0].p + '</p>');
      await wait(1200);
      for (const s of CH.slice(1)) {
        if (my !== gen) return;
        if (s.t === 'nar') {
          const node = add('nar',
            (s.kf ? '<div class="kf"><img src="'+s.kf+'" alt="" loading="lazy"></div>' : '') +
            '<p><span class="tw"></span></p>');
          await wait(s.kf ? 700 : 500);
          await type(node.querySelector('.tw'), s.p, 42);
          await beat(6500);
        } else if (s.t === 'ctx') {
          add(s.cls || 'ctx', s.p);
          await beat(4200);
        } else if (s.t === 'ask') {
          foot.innerHTML = '<div class="gp-q">Что ты сделаешь?</div>' +
            s.q.map((c,i) => '<div class="gp-c" data-i="'+i+'"><span class="n">'+(i+1)+'</span>'+c+'</div>').join('');
          /* Никакого таймера: демо стоит, пока человек сам не выберет.
             Раньше тут срабатывал автоответ — со стороны это читалось так,
             будто выбор ненастоящий. Разорвать ожидание может только уход
             блока с экрана (stop() дёргает сохранённый резолвер). */
          if (send) send.classList.remove('hot');
          skip = null;                                  // «Дальше» не отвечает за игрока
          picked = await new Promise(res => {
            foot.addEventListener('click', e => {
              const b = e.target.closest('.gp-c');
              if (b) res(+b.dataset.i);
            });
            timers.push([0, () => res(null)]);
          });
          if (my !== gen || picked == null) return;
          const btns = foot.querySelectorAll('.gp-c');
          if (btns[picked]) btns[picked].classList.add('pick');
          await wait(1800);
          cont();
        } else if (s.t === 'me') {
          add('me', CH[5].q[picked == null ? 1 : picked]); await beat(3400);
        } else {
          add('sys', s.p); await beat(6000);
        }
      }
      await wait(3600);
    }
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    host.style.setProperty('--tilt','0deg'); host.style.setProperty('--sc','1');
    add('nar', '<p>'+CH[0].drop+CH[0].p+'</p>');
    add('nar', '<div class="kf"><img src="/assets/keyframe_01.jpg" alt=""></div><p>'+CH[1].p+'</p>');
    add('ctx', CH[2].p);
    foot.innerHTML = '<div class="gp-q">Что ты сделаешь?</div>' +
      CH[5].q.map((c,i)=>'<div class="gp-c"><span class="n">'+(i+1)+'</span>'+c+'</div>').join('');
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { es[0].isIntersecting ? play() : stop(); }, {threshold:.2}).observe(host);
  } else play();
})();

/* billing switch — prices live in data-m / data-y so the markup stays the source of truth */
const paySw=document.getElementById('paySw');
if(paySw){
  paySw.addEventListener('click',(e)=>{
    const b=e.target.closest('button[data-p]'); if(!b) return;
    const per=b.dataset.p;
    paySw.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    const nf = n => n.toLocaleString('ru-RU');
    document.querySelectorAll('.tier .price').forEach(p=>{
      const m=+p.dataset.m, v=+p.dataset[per];
      if(!m){ p.innerHTML='0 <small>₽</small>'; return; }
      if(per==='y'){
        // data-y хранит цену за месяц при годовой оплате — показываем сумму за год,
        // иначе переключатель «На год» выводил месячный платёж и это путало
        p.innerHTML='<span class="old">'+nf(m*12)+'</span>'+nf(v*12)+
          ' <small>₽ / год</small><em class="permo">'+nf(v)+' ₽ в месяц</em>';
      } else {
        p.innerHTML=nf(m)+' <small>₽ / мес</small>';
      }
    });
  });
}


/* обложки миров: играют ВСЕГДА, когда карточка в поле зрения.
   Десктоп — настоящее видео (≤4 декодера разом, никогда 5).
   Мобилка (≤640px) — анимированный WebP вместо видео: он идёт по картиночному
   конвейеру и НЕ считается видео-декодером, поэтому лимит телефонов не бьётся. */
(() => {
  const calmMo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (calmMo || saveData) return;                 // reduce-motion / экономия — статичные постеры
  const packs = [...document.querySelectorAll('.pack')];

  // --- мобилка: подменяем видео на анимированный WebP ---
  if (matchMedia('(max-width:640px)').matches) {
    packs.forEach(pk => {
      const v = pk.querySelector('.cv-vid'), img = pk.querySelector('.cv img');
      if (v && img) {
        img.src = v.dataset.src.replace(/\.mp4(\?.*)?$/, '.webp');
        img.classList.add('cv-anim');
        v.remove();
      }
    });
    return;
  }

  // --- десктоп: видео играет, пока карточка видна ---
  const play = (v) => {
    if (!v.dataset.done) {
      v.dataset.done = '1';
      v.src = v.dataset.src;
      v.addEventListener('canplay', () => { v.classList.add('ready'); v.play().catch(()=>{}); }, { once:true });
      v.load();
    } else { v.classList.add('ready'); v.play().catch(()=>{}); }
  };
  const vids = packs.map(p => p.querySelector('.cv-vid')).filter(Boolean);
  if (!('IntersectionObserver' in window)) { vids.forEach(play); return; }
  const io = new IntersectionObserver((es) => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (!document.hidden) play(v); }
    else { v.pause(); v.classList.remove('ready'); }
  }), { threshold:.1 });
  vids.forEach(v => io.observe(v));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) vids.forEach(v => v.pause());
    else vids.forEach(v => { const r = v.getBoundingClientRect(); if (r.bottom>0 && r.top<innerHeight) play(v); });
  });
})();

/* nav state + scroll progress + hero parallax */
const nav=document.getElementById('nav'), prog=document.getElementById('prog'), heroBg=document.getElementById('heroBg');
const isTouch=matchMedia('(hover:none)').matches;
let ticking=false;
function onScroll(){
  const y=window.scrollY;
  nav.classList.toggle('scrolled', y>40);
  const max=document.body.scrollHeight-innerHeight;
  prog.style.width=(max>0?(y/max*100):0)+'%';
  /* параллакс фона убран — двигал задник на скролле и читался как «фон прокручивается» */
  if(!calm) tiltStage();
  syncDock();
  ticking=false;
}
// hero-видео на паузу, когда первый экран уходит из виду
(() => {
  const hv = document.getElementById('heroVideo'), hero = document.querySelector('.hero');
  if (hv && hero && 'IntersectionObserver' in window)
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (hv.src && !document.hidden) hv.play().catch(()=>{}); }
      else hv.pause();
    }), { threshold:.05 }).observe(hero);
})();
addEventListener('scroll',()=>{ if(!ticking){ requestAnimationFrame(onScroll); ticking=true; } },{passive:true});
onScroll();

/* looping video layers: fade in only if the file is actually there,
   otherwise the still art stays and nothing breaks */
function tryVideo(el, src, keepOnError){
  if(!el) return;
  el.addEventListener('canplay',()=>{ el.classList.add('on'); el.play().catch(()=>{}); },{once:true});
  /* the hero must survive a failed load — its poster is the fallback artwork */
  el.addEventListener('error',()=>{ if(!keepOnError) el.remove(); },{once:true});
  el.src=src; el.load();
}
/* honour "reduce motion": leave the poster still instead of autoplaying footage */
const calmMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!calmMotion) tryVideo(document.getElementById('heroVideo'),'/assets/hero_landing.mp4?v4', true);
/* the closing block sits at the bottom — don't spend bandwidth on it until it's near */
(function(){
  const cta=document.getElementById('ctaVideo'), host=document.getElementById('final');
  if(!cta||!host) return;
  if(calmMotion){ cta.remove(); return; }
  let done=false;
  const load=()=>{ if(done) return; done=true; tryVideo(cta,'/assets/cta_loop.mp4?v4'); };
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ load(); io.disconnect(); } },{rootMargin:'400px'});
    io.observe(host);
  } else load();
  /* second, independent trigger — the observer can stay silent in a throttled tab */
  const onScr=()=>{ if(host.getBoundingClientRect().top < innerHeight+400){ load(); removeEventListener('scroll',onScr); } };
  addEventListener('scroll',onScr,{passive:true});
})();

/* light follows the pointer across the closing block */
const finalEl=document.getElementById('final');
if(finalEl) finalEl.addEventListener('pointermove',e=>{
  const r=finalEl.getBoundingClientRect();
  finalEl.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
  finalEl.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
});

/* ===== live mini-demos in the features block =====
   Real markup driven by a single timer, so they can never drift out of sync
   with the product the way a recorded GIF would. Runs only while on screen. */
(function(){
  const inv=document.querySelector('.demo-inv'),
        jrn=document.querySelector('.demo-jrn'),
        scn=document.querySelector('.demo-scene'),
        host=document.getElementById('feats');
  if(!host||(!inv&&!jrn&&!scn)) return;

  // подпись берём из alt подсвеченной иконки, чтобы название всегда ей соответствовало
  const nameOf=(cell)=>{ const img=cell&&cell.querySelector('img'); return img?img.alt:''; };
  const entries=['Старик-хранитель ждал того, кто поднимет меч',
                 'Подобран Клинок Тихого Пепла',
                 'Тёмная Цитадель горит на горизонте'];
  const cells=inv?[...inv.querySelectorAll('.d-grid i')]:[];
  const nameEl=inv?inv.querySelector('.d-name'):null;
  const rows=jrn?[...jrn.querySelectorAll('.d-row')]:[];
  const entryEl=jrn?jrn.querySelector('.d-entry'):null;

  const still=()=>{ /* reduced motion: leave a readable static state */
    cells[0]&&cells[0].classList.add('sel'); rows[0]&&rows[0].classList.add('on');
    scn&&scn.classList.add('show');
  };
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ still(); return; }

  let step=0, timer=null;
  const swap=(el,text)=>{ if(!el) return; el.style.opacity=0;
    setTimeout(()=>{ el.textContent=text; el.style.opacity=1; },230); };

  function tick(){
    if(cells.length){ const i=step%cells.length;
      cells.forEach((c,n)=>c.classList.toggle('sel',n===i));
      swap(nameEl,nameOf(cells[i])); }
    if(rows.length){ const j=step%rows.length;
      rows.forEach((r,n)=>r.classList.toggle('on',n===j));
      swap(entryEl,entries[j]); }
    if(scn) scn.classList.toggle('show', step%2===0);
    step++;
  }
  tick();

  const start=()=>{ if(!timer) timer=setInterval(tick,2200); };
  const stop =()=>{ clearInterval(timer); timer=null; };
  if('IntersectionObserver' in window){
    new IntersectionObserver(es=>{ es[0].isIntersecting?start():stop(); },{threshold:.15}).observe(host);
  } else start();
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
})();

/* keep the app self-updating: when a new service worker takes over, reload once
   so nobody is stuck on a stale build (the guard avoids a reload loop, and the
   controller check skips the very first install) */
if('serviceWorker' in navigator){
  const hadController=!!navigator.serviceWorker.controller;
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController || reloading) return;
    reloading=true; location.reload();
  });
  addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      reg.update();
      setInterval(()=>reg.update(), 60*60*1000);   // pick up deploys during long sessions
    }).catch(()=>{});
  });
}



/* ===== авторизация (front-end мокап; реальный бэкенд подключим позже) ===== */
(() => {
  const scrim=document.getElementById('authScrim'), box=document.getElementById('authBox'),
        form=document.getElementById('authForm'), msg=document.getElementById('authMsg'),
        sub=document.getElementById('authSub'), submit=document.getElementById('authSubmit');
  if(!scrim) return;
  const $=id=>document.getElementById(id);

  function open(mode){
    setMode(mode||'login');
    scrim.classList.add('on'); scrim.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    // гасим тяжёлый фон, пока открыта модалка: видео на паузу, зерно стоп
    document.body.classList.add('modal-open');
    document.querySelectorAll('.fabula-landing video').forEach(v=>{ try{v.pause();}catch(_){} });
    setTimeout(()=>$('afEmail').focus(),120);
  }
  function close(){
    scrim.classList.remove('on'); scrim.setAttribute('aria-hidden','true');
    document.body.style.overflow=''; msg.textContent='';
    document.body.classList.remove('modal-open');
    // возобновляем видео, которые в поле зрения
    document.querySelectorAll('.fabula-landing video').forEach(v=>{
      const r=v.getBoundingClientRect();
      if(r.bottom>0 && r.top<innerHeight){ try{v.play().catch(()=>{});}catch(_){} }
    });
  }
  function setMode(mode){
    box.classList.toggle('mode-reg', mode==='reg');
    document.querySelectorAll('.auth-tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab===mode));
    sub.textContent = mode==='reg' ? 'Создай героя и сохраняй прогресс' : 'С возвращением, странник';
    submit.textContent = mode==='reg' ? 'Создать аккаунт' : 'Войти';
    msg.textContent='';
  }

  // открытие по «Войти»
  document.querySelectorAll('[data-auth]').forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); open(a.dataset.auth); }));
  $('authClose').addEventListener('click', close);
  scrim.addEventListener('click', e=>{ if(e.target===scrim) close(); });
  addEventListener('keydown', e=>{ if(e.key==='Escape' && scrim.classList.contains('on')) close(); });
  document.querySelectorAll('.auth-tabs button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.tab)));

  const emailOk = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  function fail(t){ msg.classList.remove('ok'); msg.textContent=t; }
  function ok(t){ msg.classList.add('ok'); msg.textContent=t; }

  // адрес бэкенда: локально — dev-сервер на :8000; в проде — облачный бэкенд на Saturn
  const AUTH_API = (location.hostname==='localhost' || location.hostname==='127.0.0.1')
    ? 'http://127.0.0.1:8000' : 'https://dungeon20-p5svbq.saturn.ac';

  function saveSession(data){
    try{
      localStorage.setItem('fabula-token', data.access_token);
      localStorage.setItem('fabula-user', JSON.stringify(data.user));
    }catch(_){}
  }
  function go(){ setTimeout(()=>location.href='/app', 650); }

  async function apiPost(path, body){
    const r = await fetch(AUTH_API+path, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
    });
    let data=null; try{ data=await r.json(); }catch(_){}
    return {r, data};
  }

  let busy=false;
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    if(busy) return;
    const reg=box.classList.contains('mode-reg');
    const email=$('afEmail').value.trim(), pass=$('afPass').value;
    if(!emailOk(email)) return fail('Проверь почту — что-то не так.');
    if(pass.length<6) return fail('Пароль от 6 символов.');
    let name=email.split('@')[0];
    if(reg){
      name=$('afName').value.trim();
      if(!name) return fail('Как тебя звать?');
      if(!/^[A-Za-z0-9_]{3,20}$/.test(name)) return fail('Ник: 3–20 символов, латиница, цифры, _');
      if(pass!==$('afPass2').value) return fail('Пароли не совпадают.');
    }
    busy=true; submit.disabled=true;
    const label=submit.textContent; submit.textContent='Секунду…';
    try{
      const {r, data} = await apiPost(reg ? '/auth/register' : '/auth/login',
        reg ? {username: name, email, password:pass} : {email, password:pass});
      if(r.ok){ saveSession(data); markLoggedInNav(); ok('Готово! Открой «Профиль» или «Миры».'); close(); return; }
      if(r.status===409)      fail('Эта почта уже зарегистрирована — попробуй войти.');
      else if(r.status===401) fail('Неверная почта или пароль.');
      else if(r.status===422) fail('Проверь поля — что-то заполнено не так.');
      else fail((data && data.detail) ? (''+data.detail) : 'Что-то пошло не так, попробуй ещё раз.');
    }catch(err){
      fail('Сервер недоступен. Запущен ли бэкенд?');
    }finally{
      busy=false; submit.disabled=false; submit.textContent=label;
    }
  });

  // соцвход — пока не подключён (Telegram появится на бэкенде)
  document.querySelectorAll('[data-soc]').forEach(b=>b.addEventListener('click',()=>{
    fail('Вход через '+(b.dataset.soc==='google'?'Google':'Telegram')+' скоро — подключаем на бэкенде.');
  }));

  // ===== вход через Google (GIS ID-token flow) =====
  const clientId = googleClientId;
  let pendingRegToken = '';

  function loadGis(){
    return new Promise((res)=>{
      if (window.google && window.google.accounts) return res();
      const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true; s.onload=()=>res(); document.head.appendChild(s);
    });
  }

  async function onGoogleCredential(resp){
    const { r, data } = await apiPost('/auth/google', { id_token: resp.credential });
    if (!r.ok){ fail('Не удалось войти через Google.'); return; }
    if (data.needs_username){ pendingRegToken = data.registration_token; showNickStep(); return; }
    saveSession(data); markLoggedInNav(); ok('Готово! Открой «Профиль» или «Миры».'); close();
  }

  async function initGoogle(){
    if(!clientId) return;  // нет client_id — Google-вход выключен, деградируем к текущему состоянию
    await loadGis();
    window.google.accounts.id.initialize({ client_id: clientId, callback: onGoogleCredential });
    const holder = document.getElementById('googleBtnHolder');
    if (holder){
      holder.innerHTML='';
      const w = Math.max(240, Math.min(400, Math.round(holder.getBoundingClientRect().width) || 358));
      window.google.accounts.id.renderButton(holder, { theme:'filled_black', size:'large', text:'continue_with', shape:'pill', logo_alignment:'center', width: w });
    }
  }
  initGoogle();

  function showNickStep(){ const n=document.getElementById('nickStep'); if(n) n.style.display='block'; const g=document.getElementById('gNick'); if(g) g.focus(); }
  const gSubmit=document.getElementById('gNickSubmit');
  if (gSubmit) gSubmit.addEventListener('click', async ()=>{
    const nick=(document.getElementById('gNick').value||'').trim();
    const m=document.getElementById('gNickMsg');
    if(!/^[A-Za-z0-9_]{3,20}$/.test(nick)){ if(m) m.textContent='Ник: 3–20 символов, латиница, цифры, _'; return; }
    const { r, data } = await apiPost('/auth/google/complete', { registration_token: pendingRegToken, username: nick });
    if (r.ok){ saveSession(data); markLoggedInNav(); ok('Готово! Открой «Профиль» или «Миры».'); close(); }
    else if (m) m.textContent = r.status===409 ? 'Ник занят' : 'Проверь ник';
  });
})();

})
</script>
