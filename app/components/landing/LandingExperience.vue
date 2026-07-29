<script setup lang="ts">
const pageRoot = ref<HTMLElement | null>(null)
const billing = ref<'monthly' | 'yearly'>('monthly')
const featureStep = ref(0)
let featureTimer: ReturnType<typeof setInterval> | null = null

const inventoryDemo = [
  ['/assets/items/sword.png', 'Клинок Тихого Пепла'],
  ['/assets/items/striker.png', 'Огниво странника'],
  ['/assets/items/flask.png', 'Фляга с талой водой'],
  ['/assets/items/map.png', 'Обугленная карта'],
  ['/assets/items/amulet.png', 'Амулет хранителя'],
  ['/assets/items/key.png', 'Ключ от Цитадели'],
  ['/assets/items/ash.png', 'Горсть пепла'],
  ['/assets/items/knife.png', 'Кремневый нож'],
] as const

const journalEntries = [
  'Старик-хранитель ждал того, кто поднимет меч',
  'Подобран Клинок Тихого Пепла',
  'Темная Цитадель горит на горизонте',
] as const

const formatPrice = (value: number) => value.toLocaleString('ru-RU')

useLandingMotion(pageRoot)

onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    featureTimer = setInterval(() => featureStep.value++, 2200)
})

onBeforeUnmount(() => {
  if (featureTimer)
    clearInterval(featureTimer)
})
</script>

<template>
  <div ref="pageRoot" class="landing-page min-h-screen overflow-x-hidden bg-fabula-950 text-fabula-100">
<div class="progress" id="prog"></div>
<svg class="grain" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"></feTurbulence></filter><rect width="100%" height="100%" filter="url(#n)"></rect></svg>

<header class="nav" id="nav">
  <div class="nav-in">
    <a href="#top" class="brand">ФАБУЛА</a>
    <nav class="nav-links">
      <a href="#packs">Миры</a>
      <a href="#feats">Возможности</a>
      <a href="#price">Тарифы</a>
      <NuxtLink to="/app" class="btn btn-solid">Начать</NuxtLink>
    </nav>
  </div>
</header>

<section class="hero" id="top">
  <div class="hero-bg" id="heroBg">
    <div class="hero-fallback"></div>
    <video class="hero-video" id="heroVideo" poster="/assets/hero_landing.jpg" data-src="/assets/hero_landing.mp4" :muted="true" :loop="true" :playsinline="true" preload="none"></video>
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
      <NuxtLink to="/app" class="btn btn-solid" style="padding:18px 36px;font-size:14px">Начать историю</NuxtLink>
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
      <NuxtLink class="pack rv" to="/app" style="--g: var(--fant); transition-delay: 80ms;">
        <div class="cv"><img src="/assets/cover_fantasy.jpg" alt=""><video class="cv-vid" data-src="/assets/cover_fantasy.mp4?v2" muted loop playsinline preload="none"></video></div>
        <span class="tag">Фэнтези</span>
        <div class="pack-body">
          <h3>Пепельные земли</h3>
          <div class="pack-reveal">
          <p class="pack-desc">Ты очнулся в выгоревших руинах без имени и с чужим мечом в руке. Что здесь случилось двадцать лет назад, толком не помнит уже никто.</p>
          <div class="pack-stats"><span>12 историй</span><span>Тяжёлая</span><span>Мрачный</span></div>
          <div class="pack-foot"><span class="rating">★ 4.8</span><span class="go">Открыть →</span></div></div>
        </div></NuxtLink>
      <NuxtLink class="pack rv" to="/app" style="--g: var(--scifi); transition-delay: 160ms;">
        <div class="cv"><img src="/assets/cover_scifi.jpg" alt=""><video class="cv-vid" data-src="/assets/cover_scifi.mp4?v2" muted loop playsinline preload="none"></video></div>
        <span class="tag">Sci-Fi</span>
        <div class="pack-body">
          <h3>Станция «Кассандра»</h3>
          <div class="pack-reveal">
          <p class="pack-desc">Тебя разбудили на 214 лет позже срока. Экипажа нет, а бортовой ИИ сомневается, что ты это ты.</p>
          <div class="pack-stats"><span>9 историй</span><span>Обычная</span><span>Напряжённый</span></div>
          <div class="pack-foot"><span class="rating">★ 4.6</span><span class="go">Открыть →</span></div></div>
        </div></NuxtLink>
      <NuxtLink class="pack rv" to="/app" style="--g: var(--hist); transition-delay: 240ms;">
        <div class="cv"><img src="/assets/cover_history.jpg" alt=""><video class="cv-vid" data-src="/assets/cover_history.mp4?v2" muted loop playsinline preload="none"></video></div>
        <span class="tag">История</span>
        <div class="pack-body">
          <h3>Восстание Спартака</h3>
          <div class="pack-reveal">
          <p class="pack-desc">Школа гладиаторов Батиата, 73 год до нашей эры. Ночью в казарме шепчутся о побеге, и завтра тебе решать, с кем ты.</p>
          <div class="pack-stats"><span>7 историй</span><span>Тяжёлая</span><span>Драматичный</span></div>
          <div class="pack-foot"><span class="rating">★ 4.7</span><span class="go">Открыть →</span></div></div>
        </div></NuxtLink>
      <NuxtLink class="pack rv" to="/app" style="--g: var(--post); transition-delay: 0ms;">
        <div class="cv"><img src="/assets/cover_postapoc.jpg" alt=""><video class="cv-vid" data-src="/assets/cover_postapoc.mp4?v2" muted loop playsinline preload="none"></video></div>
        <span class="tag">Пост-апокалипсис</span>
        <div class="pack-body">
          <h3>После тишины</h3>
          <div class="pack-reveal">
          <p class="pack-desc">Город зарос за двадцать лет, и сегодня ты впервые за долгое время услышал чужой голос.</p>
          <div class="pack-stats"><span>6 историй</span><span>Обычная</span><span>Тревожный</span></div>
          <div class="pack-foot"><span class="rating">★ 4.5</span><span class="go">Открыть →</span></div></div>
        </div></NuxtLink>
    </div>
  </div>
</section>

<div class="dock" id="dock"><i>Первые главы бесплатно</i>
  <NuxtLink to="/app" class="btn btn-solid" style="padding:13px 26px;font-size:12px">Начать</NuxtLink></div>

<section class="sec" id="feats">
  <div class="wrap">
    <div class="sec-head rv" style="transition-delay: 80ms;">
      <div class="sec-kicker"><br></div>
      <h2>Больше, чем просто диалог</h2>
      <p class="sec-sub">ФАБУЛА объединяет гибкость генеративного ИИ с четкими правилами классических настольных ролевых игр.</p>
    </div>
    <div class="feats">
      <div class="feat rv" style="transition-delay: 160ms;"><span class="ic" style="--m:url(/assets/icons/feat/inv.png?v2)"></span><h3>Система инвентаря</h3>
        <p>Вся экипировка и ресурсы интегрированы в логику мира. Достаточно использовать предмет в диалоге или действии, чтобы кардинально изменить ход текущей сцены.</p>
        <div class="demo demo-inv" aria-hidden="true">
          <div class="d-grid">
            <i
              v-for="([src, label], index) in inventoryDemo"
              :key="src"
              :class="{ sel: featureStep % inventoryDemo.length === index }"
            ><img :src="src" :alt="label" loading="lazy"></i>
          </div>
          <div class="d-card"><b class="d-name">{{ inventoryDemo[featureStep % inventoryDemo.length]?.[1] }}</b><span class="d-go">В диалог →</span></div>
        </div></div>
      <div class="feat rv" style="transition-delay: 240ms;"><span class="ic" style="--m:url(/assets/icons/feat/journal.png?v2)"></span><h3>Системный журнал</h3>
        <p>События, локации и персонажи структурируются и фиксируются в реальном времени. Вам не нужно вести заметки — система сама упорядочивает контекст и ключевые факты вашей истории.</p>
        <div class="demo demo-jrn" aria-hidden="true">
          <div class="d-rows">
            <div class="d-row" :class="{ on: featureStep % 3 === 0 }"><span class="dot" style="--d:var(--scifi)"></span>Персонажи<b>2</b></div>
            <div class="d-row" :class="{ on: featureStep % 3 === 1 }"><span class="dot" style="--d:var(--fant)"></span>События<b>3</b></div>
            <div class="d-row" :class="{ on: featureStep % 3 === 2 }"><span class="dot" style="--d:var(--post)"></span>Места<b>1</b></div>
          </div>
          <div class="d-entry">{{ journalEntries[featureStep % journalEntries.length] }}</div>
        </div></div>
      <div class="feat rv" style="transition-delay: 0ms;"><span class="ic" style="--m:url(/assets/icons/feat/scene.png?v2)"></span><h3>Сюжетная визуализация</h3>
        <p>Текстовое повествование дополняется графическими иллюстрациями. Визуальный ряд фиксирует сцены, локации и окружение, усиливая эстетику и атмосферу происходящего.</p>
        <div class="demo demo-scene" :class="{ show: featureStep % 2 === 0 }" aria-hidden="true">
          <div class="d-txt">Ветер несёт пепел. Рука натыкается на сталь…</div>
          <div class="d-shot"><img src="/assets/keyframe_01.jpg" alt="" loading="lazy"></div>
        </div></div>
      <div class="feat rv" style="transition-delay: 80ms;"><span class="ic" style="--m:url(/assets/icons/feat/memory.png?v2)"></span><h3>Долгосрочные последствия</h3>
        <p>Персонажи удерживают историю прошлых взаимодействий, обещаний и конфликтов. Окружение реагирует на Вашего героя на основе его реальной репутации и прошлых действий.</p></div>
      <div class="feat rv" style="transition-delay: 160ms;"><span class="ic" style="--m:url(/assets/icons/feat/tone.png?v2)"></span><h3>Атмосферная адаптация</h3>
        <p>Возможность точно задавать характер и настроение истории — от жесткого реализма до камерной драмы — без нарушения общей логики мира.</p></div>
      <div class="feat rv" style="transition-delay: 240ms;"><span class="ic" style="--m:url(/assets/icons/feat/access.png?v2)"></span><h3>Доступ без ограничений</h3>
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
    <LandingGameplayDemo />

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

    <div class="pay-sw rv" style="transition-delay: 80ms;">
      <button type="button" :aria-pressed="billing === 'monthly'" @click="billing = 'monthly'">Ежемесячно</button>
      <button type="button" :aria-pressed="billing === 'yearly'" @click="billing = 'yearly'">На год <span class="save">−20%</span></button>
    </div>

    <div class="tiers">
      <div class="tier rv" style="--t: var(--ink-mute); transition-delay: 160ms;">
        <div class="tier-top"><h3>Странник</h3><span class="tier-role">знакомство</span></div>
        <div class="price">0 <small>₽</small></div>
        <div class="tier-lim"><b>3 главы в сутки.</b> Память ~16 000 символов</div>
        <ul>
          <li>Все четыре мира открыты</li>
          <li>Базовая модель повествования</li>
          <li>Инвентарь и журнал целиком</li>
          <li>Один кадр на главу</li>
          <li class="off">Память дальше 16 000 символов</li>
          <li class="off">Свои сценарии</li>
        </ul>
        <NuxtLink to="/app" class="btn btn-ghost">Играть бесплатно</NuxtLink></div>

      <div class="tier best rv" style="--t: var(--fant); transition-delay: 240ms;">
        <span class="badge">Выбирают чаще всего</span>
        <div class="tier-top"><h3>Бард</h3><span class="tier-role">основной</span></div>
        <div class="price">
          <template v-if="billing === 'yearly'">
            <span class="old">{{ formatPrice(490 * 12) }}</span>{{ formatPrice(390 * 12) }}
            <small>₽ / год</small><em class="permo">{{ formatPrice(390) }} ₽ в месяц</em>
          </template>
          <template v-else>
            {{ formatPrice(490) }} <small>₽ / мес</small>
          </template>
        </div>
        <div class="tier-lim"><b>Без счётчика глав.</b> Память ~64 000 символов</div>
        <ul>
          <li>Умная модель: живые диалоги и характеры</li>
          <li>Помнит ~64 000 символов, это весь пак</li>
          <li>До пяти кадров на главу</li>
          <li>Тон и сложность под себя</li>
          <li>Редактирование журнала</li>
          <li class="off">Приоритет в очереди</li>
        </ul>
        <NuxtLink to="/app" class="btn btn-solid">Выбрать «Барда»</NuxtLink></div>

      <div class="tier top rv" style="--t: var(--epic); transition-delay: 0ms;">
        <span class="badge">Максимум</span>
        <div class="tier-top"><h3>Архимаг</h3><span class="tier-role">для длинных кампаний</span></div>
        <div class="price">
          <template v-if="billing === 'yearly'">
            <span class="old">{{ formatPrice(990 * 12) }}</span>{{ formatPrice(790 * 12) }}
            <small>₽ / год</small><em class="permo">{{ formatPrice(790) }} ₽ в месяц</em>
          </template>
          <template v-else>
            {{ formatPrice(990) }} <small>₽ / мес</small>
          </template>
        </div>
        <div class="tier-lim"><b>Всё из «Барда».</b> Память ~200 000 символов</div>
        <ul>
          <li>Топовые модели, самый связный текст</li>
          <li>Помнит ~200 000 символов, это все паки</li>
          <li>Кадры без ограничений</li>
          <li>Приоритет в очереди генерации</li>
          <li>Новые миры за неделю до остальных</li>
          <li>Свои паки и сценарии</li>
        </ul>
        <NuxtLink to="/app" class="btn btn-ghost">Выбрать «Архимага»</NuxtLink></div>
    </div>

    <div class="once rv" style="transition-delay: 80ms;">
      <div>
        <h4>Не готов подписываться?</h4>
        <p>Тогда возьми один мир навсегда: все главы пака, умная модель и память внутри него, разово и без ежемесячных списаний.</p>
      </div>
      <div class="amt">от 349 <small>₽ за мир</small></div>
      <NuxtLink to="/app" class="btn btn-ghost">Выбрать мир</NuxtLink>
    </div>

    <p class="price-note rv" style="transition-delay: 160ms;">Отменить можно в любой момент, доступ доживёт до конца оплаченного срока. Карты РФ и зарубежные, СБП.</p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="final rv" id="final" style="transition-delay: 240ms;">
      <video class="cta-video" id="ctaVideo" data-src="/assets/cta_loop.mp4" :muted="true" :loop="true" :playsinline="true" preload="none"></video>
      <div class="sec-kicker"><br></div>
      <h2 style="margin-bottom:16px">Ваша история начинается здесь<br></h2>
      <p class="sec-sub" style="margin-bottom:30px"><br></p>
      <NuxtLink to="/app" class="btn btn-solid" style="padding:18px 42px;font-size:14px">Начать историю</NuxtLink>
    </div>
  </div>
</section>

<footer>
  <div class="foot-in">
    <div>© 2026 ФАБУЛА · интерактивные истории с ИИ</div>
    <div><a href="#packs">Миры</a><a href="#price">Тарифы</a><NuxtLink to="/app">Начать</NuxtLink></div>
  </div>
</footer>


<!-- визуальный редактор: подключается только по ?edit, на боевом сайте не грузится -->
  </div>
</template>

<style>

  .landing-page{
    /* ===== NEUTRAL SHELL — colour belongs to the worlds, not the chrome ===== */
    --bg:#0a0a0c;
    --surface:#141416;
    --surface-2:#1a1a1e;
    --ink:#eaeaee;
    --ink-dim:#a2a2ab;
    --ink-mute:#6d6d78;
    --line:rgba(255,255,255,.12);
    --line-soft:rgba(255,255,255,.07);
    /* genre accents — used ONLY on world cards */
    --fant:#d9a94a; --scifi:#54e6d0; --hist:#c9a865; --post:#9bbf3a; --epic:#9a6fd0;
    --display:'Forum',serif;
    --max:1180px;
  }
  .landing-page, .landing-page *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  .landing-page /* кольцо оставляем только для клавиатурной навигации, .landing-page после тапа его быть не должно */
  a,.landing-page button{outline:none}
  .landing-page a:focus-visible,.landing-page button:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
  /* no overflow-x here: clip on <html> plus hidden on <body> kills scrolling outright */
  .landing-page{scroll-behavior:smooth}
  .landing-page{font-family:'Cormorant Garamond',serif;color:var(--ink);background:var(--bg);
    overflow-x:hidden;line-height:1.5}
  .landing-page img{max-width:100%;display:block}
  .landing-page .wrap{width:min(var(--max),92vw);margin:0 auto}
  .landing-page .grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.045;mix-blend-mode:overlay}

  .landing-page /* scroll progress */
  .progress{position:fixed;top:0;left:0;height:2px;width:0;z-index:60;
    background:linear-gradient(90deg,#7a7a85,#fff);box-shadow:0 0 12px #ffffff55;transition:width .1s linear}

  .landing-page /* ===== NAV ===== */
  header.nav{position:fixed;top:0;left:0;right:0;z-index:50;transition:.3s ease;
    background:linear-gradient(#0a0a0c00,#0a0a0c00);border-bottom:1px solid transparent}
  .landing-page header.nav.scrolled{background:#0a0a0ce8;backdrop-filter:blur(12px);border-bottom-color:var(--line-soft)}
  .landing-page .nav-in{display:flex;align-items:center;justify-content:space-between;padding:20px 0;
    width:min(var(--max),92vw);margin:0 auto;transition:padding .3s ease}
  .landing-page header.nav.scrolled .nav-in{padding:12px 0}
  .landing-page .brand{font-family:var(--display);font-size:21px;letter-spacing:.24em;color:var(--ink);text-decoration:none}
  .landing-page .nav-links{display:flex;gap:30px;align-items:center}
  .landing-page /* :not(.btn) — otherwise this beats .btn-solid's dark text and the button goes grey-on-white */
  .nav-links a:not(.btn){font-family:'Forum',serif;font-size:14px;letter-spacing:.06em;color:var(--ink-dim);
    text-decoration:none;position:relative;transition:color .2s}
  .landing-page .nav-links a:not(.btn)::after{content:'';position:absolute;left:0;right:0;bottom:-5px;height:1px;
    background:var(--ink);transform:scaleX(0);transform-origin:right;transition:transform .3s ease}
  .landing-page .nav-links a:not(.btn):hover{color:var(--ink)}
  .landing-page .nav-links a:not(.btn):hover::after{transform:scaleX(1);transform-origin:left}

  .landing-page .btn{font-family:'Forum',serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;
    border:none;text-decoration:none;display:inline-block;text-align:center;position:relative;overflow:hidden;
    transition:transform .2s ease,background .2s ease,color .2s ease}
  .landing-page /* bright, .landing-page dimensional white — flat #eaeaee read as dull grey on the dark shell */
  .btn-solid{color:#08080a;padding:15px 30px;border-radius:11px;font-size:13px;
    background:linear-gradient(180deg,#ffffff 0%,#f0f0f4 55%,#dcdce4 100%);
    text-shadow:0 1px 0 rgba(255,255,255,.7);
    box-shadow:0 1px 0 rgba(255,255,255,.95) inset, 0 -2px 7px rgba(0,0,0,.16) inset,
               0 6px 18px -8px rgba(0,0,0,.5)}
  .landing-page .btn-solid::after{content:'';position:absolute;top:0;left:-70%;width:45%;height:100%;
    background:linear-gradient(100deg,#0000,#ffffffcc,#0000);transform:skewX(-20deg);transition:left .6s ease}
  .landing-page .btn-solid:hover::after{left:130%}
  .landing-page .btn-solid:hover{transform:translateY(-2px);
    box-shadow:0 1px 0 rgba(255,255,255,1) inset, 0 -2px 7px rgba(0,0,0,.18) inset,
               0 12px 26px -10px rgba(0,0,0,.55)}
  .landing-page .btn-solid:active{transform:translateY(0)}
  .landing-page .btn-ghost{color:var(--ink);padding:14px 28px;border-radius:10px;font-size:13px;
    border:1px solid var(--line);background:#ffffff08}
  .landing-page .btn-ghost:hover{background:#ffffff14;transform:translateY(-2px)}

  .landing-page /* ===== HERO ===== */
  .hero{position:relative;min-height:100svh;display:flex;align-items:center;overflow:hidden}
  .landing-page .hero-bg{position:absolute;inset:-6% 0;z-index:0;will-change:transform}
  @keyframes kenburns{from{transform:scale(1)}to{transform:scale(1.09)}}
  .landing-page .hero-fallback{position:absolute;inset:0;background:radial-gradient(120% 90% at 60% 25%,#26262b,#121215 45%,#0a0a0c 78%)}
  .landing-page .hero-vig{position:absolute;inset:0;z-index:2;
    background:linear-gradient(90deg,#0a0a0cf5,#0a0a0cad 46%,#0a0a0c40);
    box-shadow:inset 0 -140px 130px -70px #0a0a0c, inset 0 100px 90px -70px #0a0a0c}
  .landing-page .dust{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
  .landing-page .dust i{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;opacity:0;
    animation:drift linear infinite}
  @keyframes drift{0%{transform:translateY(20px) scale(.6);opacity:0}
    12%{opacity:.5}88%{opacity:.35}100%{transform:translateY(-70vh) scale(1);opacity:0}}
  .landing-page .hero-in{position:relative;z-index:5;width:min(var(--max),92vw);margin:0 auto;padding:120px 0 80px}
  .landing-page .eyebrow{display:inline-flex;align-items:center;gap:9px;font-family:'Forum',serif;font-size:11px;
    letter-spacing:.3em;text-transform:uppercase;color:var(--ink-dim);padding:7px 15px;
    border:1px solid var(--line);border-radius:100px;background:#ffffff08;margin-bottom:24px}
  .landing-page .eyebrow::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--ink);
    animation:pulse 2.6s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
  .landing-page h1{font-family:var(--display);font-size:clamp(40px,7vw,80px);line-height:1.0;max-width:14ch;
    margin-bottom:22px;color:var(--ink)}
  .landing-page h1 .l{display:block;overflow:hidden}
  .landing-page h1 .l span{display:block;transform:translateY(105%);animation:riseIn .95s cubic-bezier(.22,.61,.36,1) forwards}
  .landing-page h1 .l:nth-child(2) span{animation-delay:.13s}
  @keyframes riseIn{to{transform:translateY(0)}}
  .landing-page .lede{font-size:clamp(17px,2vw,21px);line-height:1.5;color:var(--ink-dim);max-width:46ch;margin-bottom:32px;
    opacity:0;animation:fadeUp .9s .4s ease forwards}
  .landing-page .hero-cta{display:flex;gap:14px;flex-wrap:wrap;align-items:center;
    opacity:0;animation:fadeUp .9s .55s ease forwards}
  .landing-page .proof{font-family:'Forum',serif;font-size:13px;color:var(--ink-mute);letter-spacing:.04em;
    opacity:0;animation:fadeUp .9s .7s ease forwards}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  .landing-page .scroll-hint{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);z-index:5;
    width:22px;height:36px;border:1px solid var(--line);border-radius:12px}
  .landing-page .scroll-hint::after{content:'';position:absolute;left:50%;top:7px;width:2px;height:6px;border-radius:2px;
    background:var(--ink-dim);transform:translateX(-50%);animation:wheel 1.9s ease-in-out infinite}
  @keyframes wheel{0%{opacity:0;transform:translate(-50%,0)}30%{opacity:1}100%{opacity:0;transform:translate(-50%,12px)}}

  .landing-page /* ===== SECTIONS ===== */
  /* overflow:clip, .landing-page а не hidden: не создаёт область прокрутки и не ломает липкие
     элементы, .landing-page но обрезает пятна подсветки, .landing-page которые вылезали за край экрана */
  section.sec{position:relative;z-index:5;overflow:clip;padding:clamp(70px,9vw,124px) 0}
  .landing-page .sec-head{text-align:center;margin-bottom:clamp(38px,5vw,62px)}
  .landing-page .sec-kicker{font-family:'Forum',serif;font-size:11px;letter-spacing:.32em;text-transform:uppercase;
    color:var(--ink-mute);margin-bottom:14px}
  .landing-page h2{font-family:var(--display);font-size:clamp(29px,4vw,46px);line-height:1.1;color:var(--ink);margin-bottom:14px}
  .landing-page .sec-sub{color:var(--ink-dim);font-size:clamp(16px,1.6vw,18px);max-width:56ch;margin:0 auto}

  .landing-page /* steps */
  .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .landing-page .step{position:relative;text-align:center;padding:30px 26px 32px;border-radius:14px;border:1px solid var(--line-soft);
    background:var(--surface);overflow:hidden;transition:border-color .3s,transform .3s}
  .landing-page .step:hover{border-color:var(--line);transform:translateY(-4px)}
  .landing-page .step::before{content:'';position:absolute;top:0;left:0;height:1px;width:0;background:var(--ink);
    transition:width .6s ease}
  .landing-page .step:hover::before{width:100%}
  .landing-page .step-n{display:none}
  .landing-page .step h3{font-family:'Forum',serif;font-size:25px;color:var(--ink);margin-bottom:13px;letter-spacing:.02em}
  .landing-page .step p{color:var(--ink-dim);font-size:18px;line-height:1.55}

  .landing-page /* ===== WORLD CARDS — the only colour on the page ===== */
  .packs{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;perspective:1100px}
  .landing-page /* Обложка занимает всю карточку, .landing-page текст лежит поверх и раскрывается при наведении. */
  .pack{position:relative;display:block;height:clamp(350px,40vh,430px);border-radius:14px;
    overflow:hidden;border:1px solid var(--line-soft);background:var(--surface);text-decoration:none;
    transform:translateY(var(--ty,0)) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));
    transform-style:preserve-3d;
    transition:transform .7s cubic-bezier(.22,.61,.36,1),box-shadow .7s,border-color .7s}
  .landing-page .pack .cv{position:absolute;inset:0;overflow:hidden}
  .landing-page .pack .cv .cv-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;
    opacity:0;transition:opacity .7s ease;filter:brightness(.82) contrast(1.04)}
  .landing-page .pack .cv .cv-vid.ready{opacity:1}
  .landing-page .pack .cv:has(.cv-vid.ready) img{opacity:0}
    .landing-page .pack .cv img{width:100%;height:100%;object-fit:cover;filter:grayscale(.5) brightness(.74) contrast(1.05);transition:opacity .7s ease;
    transition:filter 1.1s ease .1s;animation:packdrift 18s ease-in-out infinite alternate;will-change:transform}
  @keyframes packdrift{
    0%{transform:scale(1.08) translate(2%,1%)}
    50%{transform:scale(1.14) translate(-2%,-2%)}
    100%{transform:scale(1.08) translate(1%,-1%)}}
  .landing-page /* лёгкий блик, .landing-page медленно проходящий по обложке */
  .pack .cv::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;mix-blend-mode:soft-light;
    background:linear-gradient(115deg,transparent 40%,#ffffff26 50%,transparent 60%);
    background-size:250% 100%;animation:packsheen 9s ease-in-out infinite}
  @keyframes packsheen{0%,70%{background-position:130% 0}100%{background-position:-30% 0}}
  .landing-page .pack .cv::after{content:'';position:absolute;inset:0;
    background:linear-gradient(0deg,#0a0a0cfa 14%,#0a0a0ca8 44%,#0a0a0c1f 74%)}
  .landing-page .pack:hover{transform:translateY(-8px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));
    border-color:color-mix(in srgb,var(--g) 55%,transparent);box-shadow:0 30px 66px -28px var(--g)}
  .landing-page .pack:hover .cv img{filter:grayscale(0) brightness(.82)}
  .landing-page .pack .tag{position:absolute;top:13px;left:13px;z-index:3;font-family:'Forum',serif;font-size:9px;
    letter-spacing:.16em;text-transform:uppercase;border-radius:100px;padding:5px 11px;
    background:#0a0a0ccc;color:var(--g);border:1px solid color-mix(in srgb,var(--g) 45%,transparent)}
  .landing-page .pack-body{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:20px 18px;
    display:flex;flex-direction:column;gap:10px}
  .landing-page .pack h3{font-family:var(--display);font-size:21px;color:var(--ink);line-height:1.14;
    transition:transform .45s cubic-bezier(.22,.61,.36,1)}
  .landing-page /* max-height анимируется, .landing-page height:auto — нет; запас берём с потолком побольше */
  .pack-reveal{display:flex;flex-direction:column;gap:10px;max-height:0;opacity:0;overflow:hidden;
    transform:translateY(10px);
    transition:max-height .95s cubic-bezier(.22,.61,.36,1) .14s,
               opacity .75s ease .18s,transform .8s cubic-bezier(.22,.61,.36,1) .18s}
  .landing-page .pack:hover .pack-reveal,.landing-page .pack:focus-visible .pack-reveal{max-height:260px;opacity:1;transform:none}
  .landing-page .pack-desc{font-size:14px;line-height:1.45;color:var(--ink-dim)}
  .landing-page .pack-stats{display:flex;flex-wrap:wrap;gap:6px}
  .landing-page .pack-stats span{font-family:'Forum',serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--ink-mute);border:1px solid var(--line-soft);border-radius:100px;padding:4px 9px}
  .landing-page .pack-foot{display:flex;justify-content:space-between;align-items:center;padding-top:2px}
  .landing-page .pack .rating{font-family:'Forum',serif;font-size:13px;color:var(--g)}
  .landing-page .pack .go{font-family:'Forum',serif;font-size:12px;letter-spacing:.1em;color:var(--g)}
  /* на тачах наведения нет — там показываем всё сразу */
  @media (hover:none){
    .landing-page .pack-reveal{max-height:none;opacity:1;transform:none}
    .landing-page .pack{height:auto}
    .landing-page .pack .cv{position:relative;height:170px}
    .landing-page .pack-body{position:static}
  }

  .landing-page /* features */
  .feats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .landing-page .feat{position:relative;padding:28px 24px;border-radius:14px;border:1px solid var(--line-soft);
    background:var(--surface);transition:.3s ease}
  .landing-page .feat:hover{border-color:var(--line);background:var(--surface-2);transform:translateY(-4px)}
  .landing-page /* иконки разной формы (широкие ползунки, .landing-page высокий телефон) прижаты к нижней линии
     коробки — тогда расстояние до заголовка у всех одинаковое, .landing-page текст не «плавает» */
  .feat .ic{width:54px;height:48px;margin-bottom:16px;display:block;background:var(--ink-dim);
    -webkit-mask:var(--m) center bottom/contain no-repeat;mask:var(--m) center bottom/contain no-repeat;
    transition:background .3s,transform .3s}
  .landing-page .feat:hover .ic{background:var(--ink);transform:translateY(-2px)}
  .landing-page .feat h3{font-family:'Forum',serif;font-size:17px;color:var(--ink);margin-bottom:8px}
  .landing-page .feat p{color:var(--ink-dim);font-size:15px}

  .landing-page /* pricing */
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:stretch}
  .landing-page .tier{position:relative;display:flex;flex-direction:column;padding:32px 26px;border-radius:16px;
    border:1px solid var(--line-soft);background:var(--surface);transition:.35s ease}
  .landing-page .tier:hover{transform:translateY(-5px);border-color:var(--line)}
  .landing-page .tier.best{border-color:var(--line);background:var(--surface-2)}
  .landing-page .tier .badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);font-family:'Forum',serif;
    font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#0a0a0c;padding:5px 14px;
    border-radius:100px;background:var(--ink)}
  .landing-page .tier h3{font-family:var(--display);font-size:23px;color:var(--ink);margin-bottom:4px}
  .landing-page .tier .price{font-family:var(--display);font-size:42px;color:var(--ink);margin:12px 0 4px}
  .landing-page .tier .price small{font-size:15px;color:var(--ink-mute);font-family:'Forum',serif}
  .landing-page .tier ul{list-style:none;margin:20px 0 26px;display:flex;flex-direction:column;gap:11px}
  .landing-page .tier li{font-size:15px;color:var(--ink-dim);display:flex;gap:11px;align-items:flex-start}
  .landing-page .tier li::before{content:'—';color:var(--ink-mute);flex:none}
  .landing-page .tier .btn{margin-top:auto;width:100%}
  .landing-page /* tier identity: colour signals the step up, .landing-page per the competitor references */
  .tier{border-top:2px solid color-mix(in srgb,var(--t) 60%,transparent)}
  .landing-page .tier-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
  .landing-page .tier-role{font-family:'Forum',serif;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--t)}
  .landing-page .tier h3{color:var(--t)}
  .landing-page .tier.best{box-shadow:0 0 46px -16px color-mix(in srgb,var(--t) 70%,transparent)}
  .landing-page .tier.top{background:linear-gradient(180deg,color-mix(in srgb,var(--t) 9%,var(--surface)),var(--surface))}
  .landing-page .tier.best .badge,.landing-page .tier.top .badge{background:var(--t);color:#0a0a0c}
  .landing-page .tier li::before{color:var(--t)}
  .landing-page .tier{--g:var(--t)}
  .landing-page .tier li.off{color:var(--ink-mute);opacity:.55}
  .landing-page .tier li.off::before{content:'×';color:var(--ink-mute)}
  .landing-page /* the limit line carries the actual unit economics — it must read louder than the perks */
  .tier-lim{margin:2px 0 4px;padding:9px 12px;border-radius:9px;font-size:13.5px;color:var(--ink);
    background:color-mix(in srgb,var(--t) 11%,transparent);
    border:1px solid color-mix(in srgb,var(--t) 26%,transparent)}
  .landing-page .tier-lim b{color:var(--t);font-weight:600}
  .landing-page .price .old{font-size:19px;color:var(--ink-mute);text-decoration:line-through;margin-right:8px;
    font-family:'Forum',serif}
  .landing-page .price .permo{display:block;font-style:normal;font-family:'Forum',serif;font-size:12.5px;
    letter-spacing:.04em;color:var(--ink-mute);margin-top:2px}
  .landing-page /* billing switch */
  .pay-sw{display:flex;justify-content:center;gap:4px;margin:0 auto 30px;padding:4px;width:max-content;
    border:1px solid var(--line);border-radius:999px;background:var(--surface)}
  .landing-page .pay-sw button{font-family:'Forum',serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
    padding:9px 18px;border-radius:999px;border:0;background:none;color:var(--ink-mute);cursor:pointer;
    transition:color .25s ease,background .25s ease}
  .landing-page .pay-sw button[aria-pressed=true]{background:var(--ink);color:#0a0a0c}
  .landing-page .pay-sw .save{color:var(--fant);margin-left:6px;letter-spacing:.04em;text-transform:none}
  .landing-page .pay-sw button[aria-pressed=true] .save{color:#7a5a12}
  .landing-page /* one-time pack purchase — the low-commitment door for cold traffic */
  .once{position:relative;margin-top:20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;
    gap:16px 22px;padding:20px 24px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
  .landing-page .once h4{font-family:var(--display);font-size:19px;color:var(--ink);margin-bottom:5px}
  .landing-page .once p{font-size:14px;color:var(--ink-dim);max-width:56ch}
  .landing-page .once .amt{font-family:var(--display);font-size:26px;color:var(--ink);white-space:nowrap}
  .landing-page .once .amt small{font-family:'Forum',serif;font-size:13px;color:var(--ink-mute)}
  .landing-page .price-note{margin-top:16px;text-align:center;font-size:13px;color:var(--ink-mute)}

  .landing-page /* ===== ЭФФЕКТЫ НА ТАРИФАХ ===== */
  /* вращающийся световой ободок у рекомендованного тарифа */
  .tier.best::before{content:'';position:absolute;inset:-1px;border-radius:inherit;z-index:0;
    padding:1px;pointer-events:none;
    background:conic-gradient(from var(--a,0deg),transparent 0 62%,var(--t) 78%,transparent 92%);
    -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
    -webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
    mask-composite:exclude;animation:tierspin 6s linear infinite}
  @property --a{syntax:'<angle>';initial-value:0deg;inherits:false}
  @keyframes tierspin{to{--a:360deg}}
  .landing-page .tier>*{position:relative;z-index:1}
  .landing-page /* цена подсвечивается бегущим бликом */
  .tier .price{background:linear-gradient(100deg,var(--ink) 38%,var(--t) 50%,var(--ink) 62%);
    background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
    animation:pricesheen 5.5s ease-in-out infinite}
  @keyframes pricesheen{0%,68%{background-position:120% 0}100%{background-position:-40% 0}}
  .landing-page .tier .price small{-webkit-text-fill-color:var(--ink-mute)}
  .landing-page /* пункты проявляются лесенкой, .landing-page когда блок доезжает до экрана */
  /* Прячем пункты ТОЛЬКО после того, .landing-page как скрипт пометил карточку классом anim:
     иначе любая ошибка в JS оставила бы перки невидимыми навсегда. */
  .tier.anim li{opacity:0;transform:translateX(-6px);transition:opacity .5s ease,transform .5s ease}
  .landing-page .tier.anim.lit li{opacity:1;transform:none}
  .landing-page .tier.anim li.off{opacity:0}
  .landing-page .tier.anim.lit li.off{opacity:.55}
  .landing-page .tier .badge{animation:badgefloat 3.4s ease-in-out infinite}
  @keyframes badgefloat{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-3px)}}
  .landing-page .tier:hover{transform:translateY(-7px)}
  .landing-page .tier .btn{transition:transform .3s ease,box-shadow .3s ease}
  .landing-page .tier:hover .btn-ghost{border-color:color-mix(in srgb,var(--t) 60%,transparent);
    box-shadow:0 0 26px -10px var(--t)}
  @media (prefers-reduced-motion:reduce){
    .landing-page .tier.best::before,.landing-page .tier .price,.landing-page .tier .badge{animation:none}
    .landing-page .tier li,.landing-page .tier li.off{opacity:1;transform:none}
    .landing-page .tier .price{color:var(--ink);-webkit-text-fill-color:var(--ink)}
  }
  .landing-page /* ===== live mini-demos (Steam-style showcase, .landing-page built from real UI, .landing-page not recordings) ===== */
  .demo{margin-top:15px;border-radius:10px;border:1px solid var(--line-soft);background:#0a0a0c99;padding:12px;overflow:hidden}
  .landing-page /* inventory */
  .d-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin-bottom:10px}
  .landing-page .d-grid i{position:relative;aspect-ratio:1/1;border-radius:6px;overflow:hidden;
    background:#ffffff08;border:1px solid var(--line-soft);
    transition:border-color .3s,background .3s,box-shadow .3s}
  .landing-page .d-grid i img{width:100%;height:100%;object-fit:cover;
    filter:brightness(.9) contrast(1.02);transition:filter .3s}
  .landing-page .d-grid i.sel img{filter:brightness(1.08) contrast(1.05)}
  .landing-page .d-grid i.sel{border-color:var(--fant);color:var(--fant);
    background:color-mix(in srgb,var(--fant) 14%,transparent);box-shadow:0 0 12px -3px var(--fant)}
  .landing-page .d-card{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:36px;
    border:1px solid var(--line-soft);border-radius:8px;padding:7px 9px;background:#ffffff06}
  .landing-page .d-name{font-family:'Forum',serif;font-size:12px;color:var(--ink);transition:opacity .25s ease}
  .landing-page .d-go{font-family:'Forum',serif;font-size:9px;letter-spacing:.09em;text-transform:uppercase;
    color:#0a0a0c;background:var(--ink);border-radius:6px;padding:4px 8px;white-space:nowrap}
  .landing-page /* journal */
  .d-rows{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
  .landing-page .d-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink-mute);
    padding:6px 9px;border-radius:7px;border:1px solid transparent;transition:.3s ease}
  .landing-page .d-row b{margin-left:auto;font-weight:400;font-family:'Forum',serif;font-size:10px;color:var(--ink-mute);
    background:#ffffff0c;border-radius:100px;padding:1px 7px}
  .landing-page .d-row .dot{width:7px;height:7px;border-radius:50%;background:var(--d);flex:none}
  .landing-page .d-row.on{background:#ffffff0a;border-color:var(--line-soft);color:var(--ink)}
  .landing-page .d-entry{font-size:12px;line-height:1.35;color:var(--ink-dim);border-left:2px solid var(--line);
    padding-left:9px;min-height:33px;transition:opacity .25s ease}
  .landing-page /* scene */
  .d-txt{font-size:12px;line-height:1.4;color:var(--ink-dim);margin-bottom:9px}
  .landing-page .d-shot{border-radius:8px;overflow:hidden;height:76px;opacity:0;transform:scale(1.06);filter:blur(8px);
    transition:opacity 1.5s ease,transform 1.7s cubic-bezier(.22,.61,.36,1),filter 1.5s ease}
  .landing-page .d-shot img{width:100%;height:100%;object-fit:cover;filter:grayscale(.45) brightness(.85)}
  .landing-page .demo-scene.show .d-shot{opacity:1;transform:none;filter:blur(0)}

  .landing-page /* final + footer */
  .final{text-align:center;position:relative;border-radius:18px;padding:clamp(48px,6vw,78px) 26px;
    border:1px solid var(--line-soft);overflow:hidden;background:var(--surface)}
  .landing-page .final::before{content:'';position:absolute;inset:-50%;background:
    conic-gradient(from 0deg,#ffffff00,#ffffff10,#ffffff00 40%);animation:sweep 14s linear infinite}
  @keyframes sweep{to{transform:rotate(360deg)}}
  .landing-page .final>*{position:relative;z-index:2}
  .landing-page footer{border-top:1px solid var(--line-soft);padding:38px 0;margin-top:64px}
  .landing-page .foot-in{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:center;
    width:min(var(--max),92vw);margin:0 auto;color:var(--ink-mute);font-size:14px}
  .landing-page .foot-in a{color:var(--ink-dim);text-decoration:none;margin-left:22px;transition:color .2s}
  .landing-page .foot-in a:hover{color:var(--ink)}

  .landing-page /* ===== premium layers — same recipe as the reference: big soft glows + looping video ===== */
  /* световые пятна убраны: на тёмном фоне читались как круг, .landing-page а край секции их обрезал */
  .aura{display:none}
  @keyframes auraDrift{from{transform:translate(-3%,2%) scale(1)}to{transform:translate(5%,-4%) scale(1.18)}}
  .landing-page .hero-video,.landing-page .cta-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
  .landing-page /* the still IS the video's poster, .landing-page so the browser swaps it natively:
     no crossfade, .landing-page no two mismatched layers ghosting over each other */
  .hero-video{filter:grayscale(.88) contrast(1.06) brightness(.82);z-index:1;
    animation:kenburns 26s ease-in-out infinite alternate}
  .landing-page /* the closing block has no still behind it, .landing-page so a plain fade-in is safe there */
  .cta-video{filter:grayscale(.9) brightness(.5);z-index:0;opacity:0;transition:opacity 1.4s ease}
  .landing-page .cta-video.on{opacity:1}
  .landing-page /* light that follows the pointer across the closing block */
  .final{--mx:50%;--my:50%}
  .landing-page .final::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;opacity:0;
    transition:opacity .45s ease;
    background:radial-gradient(460px circle at var(--mx) var(--my),rgba(255,255,255,.10),transparent 62%)}
  .landing-page .final:hover::after{opacity:1}

  .landing-page /* reveal — hidden only while JS is alive so content can never get stuck */
  .rv{transition:opacity .8s ease,transform .8s cubic-bezier(.22,.61,.36,1)}
  .landing-page.js .rv{opacity:0;transform:translateY(26px)}
  .landing-page.js .rv.in{opacity:1;transform:none}

  .landing-page /* ===== EFFECT LAYER ===== */
  /* headings rise word by word out of a clipping mask */
  .wsp{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.06em}
  .landing-page .wsp>i{display:inline-block;font-style:inherit;transform:translateY(110%);
    transition:transform .9s cubic-bezier(.19,1,.22,1)}
  .landing-page .rv.in .wsp>i{transform:none}

  .landing-page /* cursor spotlight — follows the pointer inside any card */
  .spot::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:4;
    opacity:0;transition:opacity .45s ease;
    background:radial-gradient(340px circle at var(--mx,50%) var(--my,50%),
      color-mix(in srgb,var(--g,var(--ink)) 15%,transparent),transparent 60%)}
  .landing-page .spot:hover::before{opacity:1}

  .landing-page /* world cards tilt toward the cursor; --ty keeps the hover lift composable */
  .packs{perspective:1100px}
  .landing-page .pack{transform:translateY(var(--ty,0)) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));
    transform-style:preserve-3d}
  .landing-page .pack:hover{--ty:-8px;transform:translateY(var(--ty)) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}

  .landing-page /* .btn-solid already carries its own sweep — this only gives the ghost buttons one */
  .btn-ghost::after{content:'';position:absolute;top:0;left:-140%;width:55%;height:100%;
    transform:skewX(-18deg);pointer-events:none;
    background:linear-gradient(100deg,transparent,rgba(255,255,255,.16),transparent)}
  .landing-page .btn-ghost:hover::after{animation:sheen .9s cubic-bezier(.4,0,.2,1)}
  @keyframes sheen{to{left:145%}}

  .landing-page /* the grain SVG already exists in the markup — this only lifts it above the
     content and makes it crawl, .landing-page which is what reads as film rather than texture */
  /* svg is a replaced element: inset alone leaves it at its intrinsic 300px and
     shoves it off-screen, .landing-page so the size has to be stated outright */
  .grain{inset:0;width:100%;height:100%;z-index:55;opacity:.055;
    animation:grainshift .9s steps(3) infinite}
  @keyframes grainshift{
    0%{transform:translate(0,0)} 33%{transform:translate(-3%,2%)} 66%{transform:translate(2%,-3%)}
    100%{transform:translate(0,0)}}

  .landing-page /* ===== 3D PRODUCT WINDOW — tilts flat as it scrolls into view ===== */
  .stage-wrap{perspective:1500px;perspective-origin:50% 0}
  .landing-page .stage{transform:rotateX(var(--tilt,22deg)) scale(var(--sc,.93));transform-origin:50% 0;
    border:1px solid var(--line);border-radius:15px;background:var(--surface);overflow:hidden;
    box-shadow:0 70px 130px -55px #000,0 0 0 1px rgba(255,255,255,.04) inset}
  .landing-page .stage-bar{display:flex;align-items:center;gap:9px;padding:12px 16px;
    border-bottom:1px solid var(--line-soft);background:var(--surface-2)}
  .landing-page .stage-bar em{font-family:'Forum',serif;font-style:normal;font-size:12px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--ink-mute)}
  .landing-page .stage-bar u{margin-left:auto;text-decoration:none;font-family:'Forum',serif;font-size:11px;
    color:var(--fant);letter-spacing:.1em}
  .landing-page .stage-body{padding:22px 20px;display:flex;flex-direction:column;gap:13px;min-height:230px}
  .landing-page .sm{max-width:76%;padding:11px 15px;border-radius:13px;font-size:15px;line-height:1.5}
  .landing-page .sm.nar{background:#ffffff08;border:1px solid var(--line-soft);color:var(--ink-dim);border-top-left-radius:4px}
  .landing-page .sm.me{align-self:flex-end;background:#ffffff16;border:1px solid var(--line);color:var(--ink);
    border-bottom-right-radius:4px}
  .landing-page .stage-opts{display:flex;flex-wrap:wrap;gap:9px;margin-top:auto;padding-top:6px}
  .landing-page .stage-opts b{font-family:'Forum',serif;font-weight:400;font-size:13px;color:var(--ink-dim);
    border:1px solid var(--line);border-radius:100px;padding:9px 16px;background:#ffffff06}

  .landing-page /* ===== STICKY CTA DOCK ===== */
  /* pinned to the corner, .landing-page not the centre: NovelAI centres theirs and it lands
     right on top of the copy it is meant to sell */
  .dock{position:fixed;right:22px;bottom:20px;z-index:58;display:flex;align-items:center;gap:14px;
    padding:8px 8px 8px 20px;border-radius:100px;background:#101014ee;border:1px solid var(--line);
    backdrop-filter:blur(14px);box-shadow:0 22px 55px -22px #000;
    transform:translateY(150%);opacity:0;pointer-events:none;
    transition:transform .55s cubic-bezier(.19,1,.22,1),opacity .35s ease}
  .landing-page .dock.on{transform:none;opacity:1;pointer-events:auto}
  .landing-page .dock i{font-style:normal;font-family:'Forum',serif;font-size:13.5px;color:var(--ink-dim);white-space:nowrap}
  @media(max-width:620px){.landing-page .dock i{display:none} .landing-page .dock{padding:8px}}

  .landing-page /* ===== DASHED FORK — one choice, .landing-page two outcomes ===== */
  .fork{display:flex;flex-direction:column;align-items:center}
  .landing-page .fork-stem{width:1px;height:26px;background:repeating-linear-gradient(180deg,
    var(--line) 0 4px,transparent 4px 9px)}
  .landing-page /* top bar plus two legs running down: border box with the bottom edge removed */
  .fork-arm{width:min(62%,520px);height:34px;border:1px dashed var(--line);border-bottom:0;
    border-radius:14px 14px 0 0}
  .landing-page .fork-out{display:grid;grid-template-columns:1fr 1fr;gap:18px;width:100%;margin-top:-1px}
  .landing-page .fork-card{position:relative;padding:18px 20px;border-radius:13px;border:1px solid var(--line-soft);
    background:var(--surface);transition:.35s ease}
  .landing-page .fork-card:hover{border-color:color-mix(in srgb,var(--k) 55%,transparent);transform:translateY(-4px)}
  .landing-page .fork-card em{display:block;font-style:normal;font-family:'Forum',serif;font-size:10px;
    letter-spacing:.18em;text-transform:uppercase;color:var(--k);margin-bottom:9px}
  .landing-page .fork-card p{font-size:14.5px;line-height:1.5;color:var(--ink-dim)}
  .landing-page .fork-src{width:100%;max-width:min(62%,520px);padding:18px 20px;border-radius:13px;
    border:1px solid var(--line);background:var(--surface-2)}
  .landing-page .fork-src em{display:block;font-style:normal;font-family:'Forum',serif;font-size:10px;
    letter-spacing:.18em;text-transform:uppercase;color:var(--ink-mute);margin-bottom:9px}
  .landing-page .fork-src p{font-size:15px;line-height:1.5;color:var(--ink)}
  @media(max-width:700px){
    .landing-page .fork-out{grid-template-columns:1fr}
    .landing-page .fork-arm{width:1px;border:0;height:18px;
      background:repeating-linear-gradient(180deg,var(--line) 0 4px,transparent 4px 9px)}
    .landing-page .fork-src{max-width:100%}
  }

  .landing-page /* ===== ОКНО ИСТОРИИ — построено по образцу блока NovelAI ===== */
  .gp-wrap{position:relative;perspective:1750px;perspective-origin:50% 0;
    width:94vw;max-width:1180px;margin-left:calc(50% - min(46vw,590px));padding:3% 0 1%}
  .landing-page .gp{--g:#d9a94a;position:relative;z-index:1;width:100%;border:1px solid #ffffff14;
    border-radius:16px;background:#17151a;overflow:hidden;
    display:flex;flex-direction:column;height:clamp(460px,64vh,620px);
    transform:rotateX(var(--tilt,13deg)) scale(var(--sc,.94));transform-origin:50% 0;
    box-shadow:0 60px 120px -50px #000}
  .landing-page /* текст истории: сплошная проза с абзацным отступом, .landing-page без плашек */
  .gp-chat{flex:1 1 auto;min-height:0;padding:1.6em 2.4% .4em;overflow-y:auto;touch-action:pan-y;
    overscroll-behavior:contain;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none}
  .landing-page .gp-chat::-webkit-scrollbar{display:none}
  .landing-page .gp-m{margin-bottom:.7em;font-size:clamp(15px,1.15vw,17px)}
  .landing-page .gp-m.nar p{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:17px;line-height:1.58;
    color:#b9b2a6;text-indent:1.6em}
  .landing-page .gp-m.nar .kf{aspect-ratio:2.6/1;max-height:clamp(170px,26vh,290px);overflow:hidden;
    border-radius:8px;margin:2px 0 13px;animation:kfIn 1.4s cubic-bezier(.22,.61,.36,1) both}
  @keyframes kfIn{0%{opacity:0;filter:blur(10px);transform:scale(1.05)}
    60%{opacity:1;filter:blur(0)}100%{opacity:1;filter:blur(0);transform:none}}
  .landing-page .gp-m.nar .kf img{width:100%;height:100%;object-fit:cover}
  .landing-page .gp-m.me p,.landing-page .gp-m.me{font-family:'Cormorant Garamond',serif;font-size:16px;line-height:1.52;
    color:#e8c97a;font-style:italic;text-indent:1.6em}
  .landing-page /* запись мира — засечка на полях рукописи, .landing-page а не строка лога */
  .gp-m.ctx{position:relative;display:flex;flex-direction:column;gap:.3em;text-indent:0;
    margin:.5em 0 1.1em;padding:.8em 0 .8em 1.4em;
    animation:ctxIn 1.6s cubic-bezier(.19,1,.22,1) both}
  .landing-page .gp-m.ctx::before{content:'';position:absolute;left:0;top:0;bottom:0;width:1px;
    background:linear-gradient(180deg,transparent,#d9a94a99 22%,#d9a94a99 78%,transparent)}
  .landing-page .gp-m.ctx::after{content:'';position:absolute;left:-.22em;top:calc(50% - .22em);
    width:.44em;height:.44em;background:#d9a94a;transform:rotate(45deg)}
  .landing-page .gp-m.ctx .k{display:block;font-family:'Forum',serif;font-size:.62em;letter-spacing:.24em;
    text-transform:uppercase;color:#d9a94a;opacity:.85}
  .landing-page .gp-m.ctx b{display:block;font-family:var(--display);font-size:1.15em;font-weight:400;
    color:#ece5d7;line-height:1.15;font-style:normal}
  .landing-page .gp-m.ctx i{display:block;font-style:italic;font-size:.9em;color:#8d8579;line-height:1.4}
  .landing-page /* Журнальная пометка не должна читаться как сюжетная находка: гасим золото,
     .landing-page ромб делаем полым, .landing-page название — обычным курсивом, .landing-page а не заголовком. */
  .gp-m.ctx.note{opacity:.75;padding-top:.6em;padding-bottom:.6em}
  .landing-page .gp-m.ctx.note::before{background:linear-gradient(180deg,transparent,#ffffff26 20%,#ffffff26 80%,transparent)}
  .landing-page .gp-m.ctx.note::after{background:none;border:1px solid #ffffff4d;box-shadow:none}
  .landing-page .gp-m.ctx.note .k{color:#7d7770;letter-spacing:.18em}
  .landing-page .gp-m.ctx.note b{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1em;color:#a9a297}
  .landing-page .gp-m.ctx.note i{font-size:.82em;color:#77716a}
  @keyframes ctxIn{0%{opacity:0;filter:blur(7px);transform:translateY(.5em)}
    55%{opacity:1;filter:blur(0)}
    100%{opacity:1;filter:blur(0);transform:none}}
  .landing-page .gp-m.sys{font-family:'Forum',serif;font-size:12px;color:#6d6d78;text-indent:0}
  .landing-page /* варианты выбора — наша механика, .landing-page её в образце нет */
  .gp-foot{flex:none;padding:0 2.4%;display:flex;flex-direction:column;gap:.5em}
  .landing-page .gp-q{font-family:'Forum',serif;font-size:10px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--g);margin:6px 0 2px;animation:qWait 2.4s ease-in-out infinite}
  @keyframes qWait{0%,100%{opacity:.55}50%{opacity:1}}
  .landing-page .gp-c{text-align:left;font-size:1em;color:#cfc7bb;padding:.6em 1em;border-radius:8px;cursor:pointer;
    border:1px solid #ffffff14;background:#ffffff05;transition:.3s ease}
  .landing-page .gp-c:hover{background:#d9a94a17;border-color:#d9a94a44;color:#f0e8d8}
  .landing-page .gp-c .n{font-family:'Forum',serif;color:var(--g);margin-right:8px}
  .landing-page /* нижняя панель инструментов */
  .gp-bar{flex:none;display:flex;justify-content:flex-end;margin:.9em 2% 1.1em;padding-top:.9em;
    border-top:1px solid #ffffff10}
  .landing-page .gp-send{font-family:'Forum',serif;font-size:clamp(11px,.85em,13px);letter-spacing:.1em;color:#b9b2a6;
    cursor:pointer;border:1px solid #ffffff1f;border-radius:8px;padding:.7em 1.6em;background:#ffffff06;transition:.3s ease}
  .landing-page .gp-send:hover{color:#f0e8d8;border-color:#d9a94a55;background:#d9a94a14}
  .landing-page /* пока демо ждёт — кнопка дышит, .landing-page чтобы было видно, .landing-page что можно нажать */
  .gp-send.hot{color:#f0e8d8;border-color:#d9a94a5c;background:#d9a94a12;
    animation:sendPulse 2.1s ease-in-out infinite}
  @keyframes sendPulse{0%,100%{box-shadow:0 0 0 0 #d9a94a00}50%{box-shadow:0 0 24px -6px #d9a94a}}
  .landing-page .gp-c{animation:optIn .6s cubic-bezier(.19,1,.22,1) both}
  @keyframes optIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @media(max-width:640px){
    .landing-page .gp-wrap{width:100%;max-width:100%;margin:0;padding:4% 0 2%;perspective:none}   .landing-page /* ровно по родителю, .landing-page без сдвига */
    .gp{height:auto;min-height:66vh;transform:none}   .landing-page /* наклон убран — он и сдвигал вправо */
    .gp-chat{padding:1.2em 4% .4em;overflow:hidden}   .landing-page /* не перехватываем свайп страницы */
    .gp-m.nar .kf{max-height:30vh}
    .landing-page .gp-foot{padding:0 16px} .landing-page .gp-bar{margin:12px 14px 14px}
    .landing-page .gp-m.nar p,.landing-page .gp-m.me{font-size:15px}
  }

  .landing-page /* ===== JOURNAL ENTRY CARDS WITH TAGS ===== */
  .lore{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}
  .landing-page .lore-c{padding:18px 19px;border-radius:13px;border:1px solid var(--line-soft);background:var(--surface);
    transition:.35s ease}
  .landing-page .lore-c:hover{border-color:var(--line);transform:translateY(-4px)}
  .landing-page .lore-c h4{font-family:var(--display);font-size:17px;color:var(--ink);margin-bottom:8px}
  .landing-page .lore-c p{font-size:14px;line-height:1.5;color:var(--ink-dim);margin-bottom:13px}
  .landing-page .lore-t{display:flex;flex-wrap:wrap;gap:6px}
  .landing-page .lore-t span{font-family:'Forum',serif;font-size:10.5px;letter-spacing:.06em;color:var(--ink-mute);
    border:1px solid var(--line-soft);border-radius:5px;padding:3px 8px;background:#ffffff05}
  @media(max-width:900px){.landing-page .lore{grid-template-columns:1fr}}

  @media (prefers-reduced-motion:reduce){
    .landing-page.js .rv{opacity:1;transform:none}
    .landing-page .hero-video,.landing-page .final::before,.landing-page .dust i{animation:none}
    .landing-page h1 .l span{transform:none;animation:none}
    .landing-page .lede,.landing-page .hero-cta,.landing-page .proof{opacity:1;animation:none}
    .landing-page .grain{animation:none}
    .landing-page .wsp>i{transform:none}
    .landing-page .pack{transform:none}
    .landing-page .btn-ghost:hover::after{animation:none}
  }
  @media(max-width:1000px){
    .landing-page .packs{grid-template-columns:repeat(2,1fr)}
    .landing-page .steps,.landing-page .feats,.landing-page .tiers{grid-template-columns:1fr}
    .landing-page .nav-links a:not(.btn){display:none}
  }

</style>
