<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const pageRoot = ref(null)
let dispose = () => {}

useSeoMeta({
  title: 'ФАБУЛА - истории',
  description: 'Выберите мир и продолжите историю.',
})

onMounted(async () => {
  const { mountHubRuntime } = await import('~/legacy/hub-runtime.client')
  dispose = mountHubRuntime(pageRoot.value) || dispose
})

onBeforeUnmount(() => dispose())
</script>

<template>
  <div ref="pageRoot" class="hub-page">
<div class="phone">
    <div class="notch"></div>
    <div class="screen" id="screen">
      <div class="statusbar"><span>9:41</span><span class="ic">▮▮▮ ❋ ▰</span></div>
      <div class="soundbtn" id="soundBtn" title="Звук">🔇</div>

      <!-- ===== HOME ===== -->
      <section class="scr on" data-scr="home">
        <div class="scroll">
          <div class="appbar"><div class="ttl" style="font-size:19px;letter-spacing:.18em">ФАБУЛА</div><div class="iconbtn">☰</div></div>
          <div class="hero-wrap ornate">
            <div class="hero-bg">
              <div class="hb-base"></div><div class="hb-rays"></div><div class="hb-glow"></div><div class="hb-near"></div>
              <img class="hb-img" src="/assets/hero_fantasy.jpg" alt="">
            </div>
            <div class="vg"></div>
            <div class="hero-txt">
              <div class="kicker">Пак · Фэнтези</div>
              <h1>Королевство<br>Пепельных земель</h1>
              <p class="story-lead">Ты очнулся в руинах, не помня имени. На горизонте горит Тёмная Цитадель.</p>
            </div>
          </div>
          <div class="chips">
            <span class="chip on">Тёмное фэнтези</span><span class="chip">Лоу-фэнтези</span><span class="chip">Стимпанк</span>
          </div>
          <button class="cta" data-open="fant">Начать историю ⚔</button>
          <div class="subcta">~15 мин на главу · выбор решает всё</div>
        </div>
      </section>

      <!-- ===== PACKS ===== -->
      <section class="scr" data-scr="packs">
        <div class="scroll">
          <div class="tex-parch"></div><div class="tex-damask"></div><div class="vignette"></div>
          <div class="appbar" style="position:sticky"><div class="ttl">Паки историй</div><div class="iconbtn">⚲</div></div>
          <div class="search"><span>⚲</span> Найти историю…</div>
          <div class="fchips">
            <span class="chip on">Все</span><span class="chip">Фэнтези</span><span class="chip">Sci-Fi</span>
            <span class="chip">История</span><span class="chip">Пост-апок</span>
          </div>
          <div class="featured" data-open="fant">
            <img src="/assets/cover_fantasy.jpg" alt="">
            <div class="fv"></div>
            <div class="badge">Новинка недели</div>
            <h3>Пепельные земли</h3>
            <p>Тёмное фэнтези · 8 глав · рейтинг ★ 4.8</p>
          </div>
          <div class="sec-h"><span class="t">Архижанры</span><span class="a">все →</span></div>
          <div class="packs">
            <div class="pack" data-open="fant"><div class="cover pv-fant"><img src="/assets/cover_fantasy.jpg"></div>
              <span class="tagn t-fant">Фэнтези</span><span class="glyph">⚔</span>
              <div class="g-name g-fant">Пепельные земли</div><div class="g-meta">12 историй</div></div>
            <div class="pack" data-open="scifi"><div class="cover pv-scifi"><img src="/assets/cover_scifi.jpg"></div>
              <span class="tagn t-scifi">Sci-Fi</span><span class="glyph">✧</span>
              <div class="g-name g-scifi">Кассандра</div><div class="g-meta">9 историй</div></div>
            <div class="pack" data-open="hist"><div class="cover pv-hist"><img src="/assets/cover_history.jpg"></div>
              <span class="tagn t-hist">История</span><span class="glyph">⚜</span>
              <div class="g-name g-hist">Восстание Спартака</div><div class="g-meta">7 историй</div></div>
            <div class="pack" data-open="post"><div class="cover pv-mod"><img src="/assets/cover_postapoc.jpg"></div>
              <span class="tagn t-post">Пост-апок</span><span class="glyph">☣</span>
              <div class="g-name g-post">После тишины</div><div class="g-meta">6 историй</div></div>
          </div>
        </div>
      </section>

      <!-- ===== INVENTORY ===== -->
      <section class="scr" data-scr="inventory">
        <div class="scroll">
          <div class="tex-leather"></div><div class="vignette"></div>
          <div class="appbar" style="position:sticky"><div class="ttl">Инвентарь</div><div class="iconbtn" style="color:var(--gold-2)">⛃ 248</div></div>
          <div class="inv-hero"><div class="portrait"></div><div><div class="nm">Безымянный</div><div class="cls">Скиталец · ур. 7</div></div></div>
          <div class="tabs"><span class="tab on">Всё</span><span class="tab">Оружие</span><span class="tab">Артефакты</span><span class="tab">Расходники</span><span class="tab">Ключи</span></div>
          <div class="slots" id="slots"></div>
          <div id="itemCard"></div>
        </div>
      </section>

      <!-- ===== PROFILE ===== -->
      <section class="scr" data-scr="profile">
        <div class="scroll">
          <div class="tex-parch"></div><div class="vignette"></div>
          <div class="appbar" style="position:sticky"><div class="ttl">Профиль</div><div class="iconbtn">⚙</div></div>
          <div class="p-top">
            <div class="avatar"><img src="/assets/avatar.jpg"><span class="fb">♞</span><span class="ring"></span></div>
            <div class="p-name">Безымянный</div>
            <div class="p-tier">⚜ Подписка · Бард</div>
            <div style="width:100%"><div class="xp"><span>Уровень 7</span><span>1 840 / 2 800 XP</span></div><div class="xpbar"><i></i></div></div>
          </div>
          <div class="stats"><div class="stat"><b>12</b><span>историй</span></div><div class="stat"><b>34</b><span>часа</span></div><div class="stat"><b>8</b><span>достижений</span></div></div>
          <div class="list-h">Активные истории</div>
          <div class="story-row" data-open="fant"><div class="th pv-fant"><img src="/assets/cover_fantasy.jpg"></div>
            <div style="flex:1"><div class="st">Королевство Пепельных земель</div><div class="sp"><i style="width:62%"></i></div><div class="pct">Глава 5 · 62%</div></div></div>
          <div class="story-row" data-open="scifi"><div class="th pv-scifi"><img src="/assets/cover_scifi.jpg"></div>
            <div style="flex:1"><div class="st">Станция «Кассандра»</div><div class="sp"><i style="width:28%"></i></div><div class="pct">Глава 2 · 28%</div></div></div>
          <div class="list-h" style="margin-top:16px">Настройки</div>
          <div class="setrow"><span class="l"><span class="g">☙</span>Подписка и грейды</span><span class="chev">›</span></div>
          <div class="setrow"><span class="l"><span class="g">♪</span>Звук и музыка</span><span class="chev">›</span></div>
          <div class="setrow"><span class="l"><span class="g">✦</span>Оформление</span><span class="chev">›</span></div>
          <div class="setrow" id="installRow"><span class="l"><span class="g">⤓</span>Установить приложение</span><span class="chev">›</span></div>
          <a class="setrow" href="/" style="border:none;text-decoration:none"><span class="l"><span class="g">⌂</span>Вернуться на сайт</span><span class="chev">›</span></a>
        </div>
      </section>

      <!-- ===== READER ===== -->
      <div class="reader" id="reader">
        <div class="tex-parch"></div><div class="vignette"></div>
        <div class="rbar">
          <div class="back" id="rMenu">☰</div>
          <div class="rt" id="rTitle">Пепельные земли</div>
          <div style="width:36px"></div>
        </div>
        <div class="chat" id="chat"></div>
        <div class="chatfoot" id="chatFoot"></div>
        <div class="rquick">
          <button class="rq" data-tool="inventory" title="Инвентарь">☙</button>
          <button class="rq" data-tool="journal" title="Журнал">✒</button>
          <button class="rq" data-tool="check" title="Проверка">⚄</button>
        </div>
        <!-- правый лист персонажа (десктоп) -->
        <aside class="cpanel" id="cpanel">
          <button class="cpanel-toggle" id="cpToggle" title="Свернуть лист" aria-label="Свернуть лист"></button>
          <div class="cpanel-in" id="cpanelIn"></div>
        </aside>
      </div>

      <!-- ===== DRAWER (side menu) ===== -->
      <div class="scrim" id="dScrim" style="z-index:94"></div>
      <aside class="drawer" id="drawer">
        <div class="drawer-head"><div class="dt" id="drawerTitle">Пепельные земли</div><div class="ds">Меню сценария</div></div>
        <a data-tool="inventory"><span class="g">☙</span>Инвентарь</a>
        <a data-tool="journal"><span class="g">✒</span>Журнал</a>
        <a data-tool="check"><span class="g">⚄</span>Бросить проверку</a>
        <a data-tool="character"><span class="g">♞</span>Персонаж</a>
        <a data-tool="settings"><span class="g">⚙</span>Настройки сценария</a>
        <a data-tool="exit" class="exit"><span class="g">✕</span>Выйти из истории</a>
      </aside>

      <!-- ===== BOTTOM SHEET ===== -->
      <div class="scrim" id="scrim"></div>
      <div class="sheet" id="sheet"><div class="sheet-grip"></div><div class="sheet-body" id="sheetBody"></div></div>

      <!-- ===== NAV ===== -->
      <nav class="nav" id="nav">
        <a class="side-brand" href="/" title="На сайт">ФАБУЛА</a>
        <a data-go="home" class="act"><span class="g">✦</span>История</a>
        <a data-go="packs"><span class="g">▤</span>Паки</a>
        <a data-go="profile"><span class="g">◇</span>Профиль</a>
      </nav>

      <div class="toast" id="toast"></div>
      <div class="grain"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><filter id="ng"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/></filter><rect width="100%" height="100%" filter="url(#ng)"/></svg></div>
      <div class="homebar"></div>
    </div>
  </div>
  </div>
</template>

<style>

  .hub-page{
    /* нейтральный шелл — как на лендинге; цвет даёт только активный пак */
    --shell-ink:#eaeaee; --shell-dim:#a2a2ab; --shell-mute:#6d6d78; --shell-line:rgba(255,255,255,.12);
    /* --acc — акцент текущего пака; по умолчанию фэнтезийное золото */
    --acc:#d9a94a; --acc-2:#f2cd7c; --acc-deep:#8a6122;
    --ink:#e9dfc9; --ink-dim:#b6a88a; --ink-mute:#8a7c60;
    --gold:#d9a94a; --gold-2:#f2cd7c; --gold-deep:#8a6122; --gold-line:#a97a2c;
    --ember:#e0662f; --blood:#a8402c;
    --rare:#5b8fd6; --epic:#9a6fd0; --leg:#e8b24a;
    --bg-0:#0b0906; --hair:#d9a94a2e;
    --scifi:#54e6d0; --hist:#c9a865; --post:#9bbf3a;
    --nav-h:76px;
    --display:'Forum',serif;
  }
  .hub-page, .hub-page *{margin:0;padding:0;box-sizing:border-box}
  .hub-page,.hub-page{min-height:100%}
  .hub-page{font-family:'Cormorant Garamond',serif;color:var(--ink);
    background:radial-gradient(60% 40% at 50% 0%,#17130c,#0a0a0d 60%,#070709) fixed;
    min-height:100vh;display:flex;flex-direction:column;align-items:center;gap:16px;
    padding:28px 14px 46px}
  .hub-page .board-h{text-align:center}
  .hub-page .board-h .wm{font-family:var(--display);font-size:34px;color:var(--gold-2);
    letter-spacing:.06em;text-shadow:0 0 26px rgba(217,169,74,.35)}
  .hub-page .board-h .sub{font-family:'Forum',serif;letter-spacing:.3em;text-transform:uppercase;
    font-size:11px;color:var(--ink-mute);margin-top:4px}

  .hub-page /* ===== PHONE ===== */
  .phone{position:relative;height:min(824px,82vh);width:auto;aspect-ratio:384/832;max-width:96vw;border-radius:52px;padding:11px;
    background:linear-gradient(150deg,#2a2a30,#111114 40%,#1c1c22);
    box-shadow:0 2px 3px #ffffff18 inset,0 55px 100px -34px #000,0 0 0 2px #000}
  .hub-page .notch{position:absolute;top:20px;left:50%;transform:translateX(-50%);width:116px;height:28px;
    background:#000;border-radius:16px;z-index:60}
  .hub-page .notch::after{content:"";position:absolute;right:22px;top:50%;transform:translateY(-50%);
    width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#26364a,#050608)}
  .hub-page .screen{position:relative;width:100%;height:100%;border-radius:42px;overflow:hidden;background:var(--bg-0)}
  .hub-page .statusbar{position:absolute;top:0;left:0;right:0;height:50px;z-index:50;display:flex;
    align-items:center;justify-content:space-between;padding:16px 26px 0;
    font-family:'Forum',serif;font-size:14px;color:var(--ink);pointer-events:none}
  .hub-page .statusbar .ic{font-size:11px;letter-spacing:1px;opacity:.85}
  .hub-page .homebar{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:120px;height:5px;
    border-radius:100px;background:#ffffff40;z-index:55;pointer-events:none}
  .hub-page .soundbtn{position:absolute;top:56px;right:20px;z-index:52;width:34px;height:34px;border-radius:10px;
    border:1px solid var(--hair);background:#000000a8;color:var(--gold-2);display:grid;place-items:center;
    font-size:15px;backdrop-filter:blur(4px);cursor:pointer}
  .hub-page .fontbtn{position:absolute;top:56px;left:20px;z-index:52;height:34px;padding:0 12px;border-radius:10px;
    border:1px solid var(--hair);background:#000000a8;color:var(--gold-2);display:flex;align-items:center;
    font-family:'Forum',serif;font-size:12px;letter-spacing:.06em;backdrop-filter:blur(4px);cursor:pointer}

  .hub-page /* textures */
  .grain{position:absolute;inset:0;opacity:.06;pointer-events:none;mix-blend-mode:overlay;z-index:2}
  .hub-page .vignette{position:absolute;inset:0;pointer-events:none;z-index:-1;
    box-shadow:inset 0 0 90px 8px #0006}
  .hub-page .tex-parch{position:absolute;inset:0;z-index:-1;background:
    radial-gradient(70px 50px at 20% 22%,#7a5a3320,#0000),
    radial-gradient(90px 60px at 82% 68%,#6b4a2818,#0000),
    radial-gradient(120% 100% at 50% 0%,#241a0c,#14100a 55%,#0b0806),
    repeating-linear-gradient(0deg,#0000 0 4px,#00000010 4px 5px)}
  .hub-page .tex-leather{position:absolute;inset:0;z-index:-1;background:
    radial-gradient(120% 90% at 50% 0%,#22190d,#140d06 60%,#0a0704),
    repeating-radial-gradient(circle at 50% 50%,#0000 0 12px,#00000014 12px 13px)}
  .hub-page .tex-damask{position:absolute;inset:0;z-index:-1;opacity:.5;background:
    linear-gradient(45deg,#d9a94a10 25%,#0000 25% 75%,#d9a94a10 75%) 0 0/30px 30px,
    linear-gradient(45deg,#d9a94a10 25%,#0000 25% 75%,#d9a94a10 75%) 15px 15px/30px 30px}

  .hub-page /* ===== SCREENS ===== */
  .scr{position:absolute;inset:0;z-index:10;display:none;flex-direction:column}
  .hub-page .scr.on{display:flex;animation:scrin .35s ease both}
  @keyframes scrin{from{opacity:0}to{opacity:1}}
  .hub-page .scroll{position:absolute;inset:0;overflow-y:auto;scrollbar-width:none;
    padding:0 22px calc(var(--nav-h) + 18px);z-index:10}
  .hub-page .scroll::-webkit-scrollbar{display:none}
  .hub-page .appbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;
    padding:58px 0 12px;background:linear-gradient(#0b0906ee,#0b090600);backdrop-filter:blur(3px)}
  .hub-page .appbar .ttl{font-family:var(--display);font-size:21px;color:var(--shell-ink);letter-spacing:.22em}
  .hub-page .iconbtn{width:36px;height:36px;border-radius:11px;border:1px solid var(--shell-line);background:#ffffff08;
    display:grid;place-items:center;color:var(--shell-dim);font-size:15px;cursor:pointer;transition:.2s}
  .hub-page .iconbtn:hover{color:var(--shell-ink);border-color:var(--shell-ink)}
  .hub-page .kicker{font-family:'Forum',serif;letter-spacing:.3em;text-transform:uppercase;font-size:10px;
    color:var(--acc);display:flex;align-items:center;gap:9px;margin-bottom:8px}
  .hub-page .kicker::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--acc);
    animation:kdot 2.6s ease-in-out infinite}
  @keyframes kdot{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}

  .hub-page /* ---- HOME ---- */
  .hero-wrap{position:relative;border-radius:20px;overflow:hidden;min-height:330px;display:flex;
    flex-direction:column;justify-content:flex-end;padding:20px;margin-bottom:16px}
  .hub-page .hero-bg{position:absolute;inset:0;z-index:0}
  .hub-page .hb-base{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 8%,#3a2a12,#1c1206 34%,#0c0803 66%,#060402)}
  .hub-page .hb-glow{position:absolute;left:50%;top:18%;transform:translateX(-50%);width:300px;height:300px;border-radius:50%;
    background:radial-gradient(circle,rgba(224,102,47,.5),rgba(217,169,74,.16) 40%,transparent 70%);filter:blur(6px);mix-blend-mode:screen}
  .hub-page .hb-rays{position:absolute;inset:0;opacity:.4;mix-blend-mode:screen;
    background:conic-gradient(from 200deg at 50% 12%,#0000 0 12deg,#e0662f22 12deg 24deg,#0000 24deg 52deg,#f2cd7c1f 52deg 64deg,#0000 64deg)}
  .hub-page .hb-near{position:absolute;left:-6%;right:-6%;bottom:32%;height:40%;background:linear-gradient(#0000,#050301);
    clip-path:polygon(0 55%,16% 30%,30% 48%,46% 22%,60% 46%,76% 26%,92% 50%,100% 36%,100% 100%,0 100%)}
  .hub-page .hb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
  .hub-page .hero-wrap .vg{position:absolute;inset:0;z-index:2;box-shadow:inset 0 -60px 60px -20px #000,inset 0 0 80px 10px #0007}
  .hub-page .hero-txt{position:relative;z-index:5}
  .hub-page .hero-txt h1{font-family:var(--display);font-size:33px;line-height:1.04;margin:9px 0 12px;letter-spacing:.005em;
    background:linear-gradient(180deg,#fff8ea,var(--acc-2) 55%,var(--acc-deep));
    -webkit-background-clip:text;background-clip:text;color:transparent;
    filter:drop-shadow(0 2px 10px #000a)}
  .hub-page .story-lead{font-size:16px;line-height:1.4;color:var(--ink);max-width:32ch;
    text-shadow:0 1px 6px #000a}
  .hub-page .chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;margin-bottom:12px}
  .hub-page .chips::-webkit-scrollbar{display:none}
  .hub-page .chip{flex:none;font-family:'Forum',serif;font-size:13px;padding:8px 15px;border-radius:100px;
    border:1px solid var(--hair);color:var(--ink-dim);background:#ffffff08;white-space:nowrap;letter-spacing:.03em;cursor:pointer}
  .hub-page .chip.on{color:#12100a;border-color:transparent;background:linear-gradient(180deg,var(--acc-2),var(--acc-deep));
    box-shadow:0 6px 18px -6px color-mix(in srgb,var(--acc) 60%,transparent)}
  .hub-page .cta{position:relative;width:100%;border:none;font-family:'Forum',serif;font-size:15px;letter-spacing:.14em;
    text-transform:uppercase;color:#08080a;padding:18px;border-radius:14px;overflow:hidden;cursor:pointer;
    background:linear-gradient(180deg,#ffffff 0%,#f0f0f4 55%,#dcdce4 100%);text-shadow:0 1px 0 rgba(255,255,255,.7);
    box-shadow:0 1px 0 rgba(255,255,255,.95) inset,0 -2px 7px rgba(0,0,0,.16) inset,0 8px 22px -10px rgba(0,0,0,.6);
    transition:transform .12s,box-shadow .2s}
  .hub-page .cta:hover{box-shadow:0 1px 0 rgba(255,255,255,1) inset,0 -2px 7px rgba(0,0,0,.18) inset,0 12px 28px -10px rgba(0,0,0,.6)}
  .hub-page .cta:active{transform:scale(.97)}
  .hub-page .cta::before{content:"";position:absolute;top:0;left:-40%;width:34%;height:100%;
    background:linear-gradient(100deg,#0000,#fff9,#0000);transform:skewX(-20deg);animation:sheen 4s ease-in-out infinite}
  @keyframes sheen{0%,55%{left:-40%}80%,100%{left:130%}}
  .hub-page .subcta{text-align:center;font-family:'Forum',serif;font-size:12px;color:var(--ink-mute);margin-top:12px;letter-spacing:.05em}

  .hub-page /* ---- NAV ---- */
  .nav{position:absolute;bottom:0;left:0;right:0;z-index:40;display:flex;justify-content:space-around;
    height:var(--nav-h);padding:12px 8px 20px;background:linear-gradient(#0b080600,#0b0806 45%);
    border-top:1px solid var(--hair);backdrop-filter:blur(8px)}
  .hub-page .nav a{display:flex;flex-direction:column;align-items:center;gap:3px;font-family:'Forum',serif;
    font-size:10px;letter-spacing:.06em;color:#7a6f5a;text-decoration:none;cursor:pointer;transition:.18s}
  .hub-page .nav a{color:var(--shell-mute)}
  .hub-page .nav a .g{font-size:18px}.hub-page .nav a.act{color:var(--shell-ink);transform:translateY(-1px)}
  .hub-page .side-brand{display:none;color:var(--shell-ink)}   .hub-page /* нейтральный бренд в десктоп-сайдбаре */

  /* ---- PACKS ---- */
  .search{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:12px;
    border:1px solid var(--hair);background:#ffffff07;color:var(--ink-mute);font-size:15px;margin-bottom:14px}
  .hub-page .fchips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;margin-bottom:16px;scrollbar-width:none}
  .hub-page .fchips::-webkit-scrollbar{display:none}
  .hub-page .featured{position:relative;border-radius:16px;overflow:hidden;padding:18px;margin-bottom:18px;min-height:150px;
    display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;
    background:linear-gradient(0deg,#0b0806f0,#0b080670 40%,#0b080630),radial-gradient(120% 100% at 70% 10%,#4a2d10,#1a0f06)}
  .hub-page .featured img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
  .hub-page .featured .fv{position:absolute;inset:0;z-index:1;background:linear-gradient(0deg,#0b0806f2,#0b080640 55%,#0b080610)}
  .hub-page .featured .badge{position:absolute;top:14px;left:14px;z-index:2;font-family:'Forum',serif;font-size:10px;letter-spacing:.16em;
    text-transform:uppercase;color:#1a1206;background:linear-gradient(180deg,var(--gold-2),var(--gold-deep));padding:5px 11px;border-radius:100px}
  .hub-page .featured h3{position:relative;z-index:2;font-family:var(--display);font-size:23px;color:var(--gold-2);line-height:1.05}
  .hub-page .featured p{position:relative;z-index:2;font-size:14px;color:var(--ink-dim);margin-top:4px}
  .hub-page .sec-h{display:flex;align-items:center;justify-content:space-between;margin:4px 0 12px}
  .hub-page .sec-h .t{font-family:'Forum',serif;letter-spacing:.14em;text-transform:uppercase;font-size:13px;color:var(--ink)}
  .hub-page .sec-h .a{font-family:'Forum',serif;font-size:12px;color:var(--gold);letter-spacing:.05em;cursor:pointer}
  .hub-page .packs{display:grid;grid-template-columns:1fr 1fr;gap:13px}
  .hub-page .pack{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:3/4;padding:12px;
    display:flex;flex-direction:column;justify-content:flex-end;border:1px solid var(--hair);
    box-shadow:0 12px 24px -14px #000;cursor:pointer;transition:transform .16s}
  .hub-page .pack:active{transform:scale(.97)}
  .hub-page .pack .cover{position:absolute;inset:0;z-index:0}
  .hub-page .pack .cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .hub-page .pv-scifi{background:linear-gradient(0deg,#080b12f5,#0a1420a0 45%,#0e2233)}
  .hub-page .pv-fant{background:linear-gradient(0deg,#0e0806f5,#2a170aa0 45%,#3a2410)}
  .hub-page .pv-hist{background:linear-gradient(0deg,#0d0a06f5,#241a0da0 45%,#3a2c16)}
  .hub-page .pv-mod{background:linear-gradient(0deg,#0a0a0af5,#141414a0 45%,#20201e)}
  .hub-page .pack .cover::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(0deg,#0b0806f0,#0b080630 55%,#0b080610)}
  .hub-page .pack .glyph{position:absolute;top:12px;right:12px;font-size:19px;color:#ffffff40;z-index:2}
  .hub-page .pack .g-name{position:relative;z-index:2;font-size:16px;line-height:1.05}
  .hub-page .pack .g-meta{position:relative;z-index:2;font-size:13px;color:var(--ink-mute);margin-top:3px}
  .hub-page .pack .tagn{position:absolute;top:10px;left:10px;z-index:2;font-family:'Forum',serif;font-size:9px;
    letter-spacing:.1em;text-transform:uppercase;border-radius:100px;padding:3px 8px;background:#0007}
  .hub-page /* per-genre typography */
  .g-fant{font-family:var(--display);color:var(--gold-2)}
  .hub-page .g-scifi{font-family:'Tektur',sans-serif;font-weight:700;color:var(--scifi);text-transform:uppercase;letter-spacing:.02em;
    text-shadow:0 0 12px rgba(84,230,208,.4)}
  .hub-page .g-hist{font-family:'Forum',serif;color:var(--hist);letter-spacing:.03em}
  .hub-page .g-post{font-family:'Oswald',sans-serif;font-weight:700;color:var(--post);text-transform:uppercase;letter-spacing:.01em}
  .hub-page .t-fant{color:var(--gold-2);border:1px solid var(--gold-line)}
  .hub-page .t-scifi{color:var(--scifi);border:1px solid #54e6d066;font-family:'Tektur',sans-serif!important}
  .hub-page .t-hist{color:var(--hist);border:1px solid #c9a86566}
  .hub-page .t-post{color:var(--post);border:1px solid #9bbf3a66;font-family:'Oswald',sans-serif!important;font-weight:600}

  .hub-page /* ---- INVENTORY ---- */
  .inv-hero{display:flex;gap:14px;align-items:center;margin-bottom:16px;padding:14px;border-radius:14px;
    border:1px solid var(--hair);background:#ffffff06}
  .hub-page .portrait{width:60px;height:60px;border-radius:10px;flex:none;position:relative;overflow:hidden;
    background:radial-gradient(circle at 50% 30%,#5a4526,#1c130a);border:1px solid var(--gold-line)}
  .hub-page .portrait::after{content:"☗";position:absolute;inset:0;display:grid;place-items:center;font-size:28px;color:#00000055}
  .hub-page .inv-hero .nm{font-family:var(--display);font-size:18px;color:var(--gold-2)}
  .hub-page .inv-hero .cls{font-size:14px;color:var(--ink-dim)}
  .hub-page .tabs{display:flex;gap:7px;overflow-x:auto;margin-bottom:16px;scrollbar-width:none}
  .hub-page .tabs::-webkit-scrollbar{display:none}
  .hub-page .tab{flex:none;font-family:'Forum',serif;font-size:12px;letter-spacing:.08em;padding:7px 13px;border-radius:100px;
    border:1px solid var(--hair);color:var(--ink-mute);white-space:nowrap;cursor:pointer}
  .hub-page .tab.on{color:var(--gold-2);border-color:var(--gold-line);background:#d9a94a12}
  .hub-page .slots{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
  .hub-page .slot{aspect-ratio:1;border-radius:11px;position:relative;display:grid;place-items:center;font-size:22px;cursor:pointer;
    background:linear-gradient(160deg,#241a0e,#120c06),repeating-linear-gradient(45deg,#0000 0 6px,#00000018 6px 7px);
    border:1px solid #ffffff12;color:var(--ink);box-shadow:inset 0 2px 6px #0007;transition:transform .12s}
  .hub-page .slot:active{transform:scale(.94)}
  .hub-page .slot.empty{color:#4a4030;font-size:14px;background:#0e0a06;border-style:dashed;border-color:#ffffff10;cursor:default}
  .hub-page .slot.rare{border-color:var(--rare);box-shadow:0 0 12px -2px var(--rare),inset 0 2px 6px #0007}
  .hub-page .slot.epic{border-color:var(--epic);box-shadow:0 0 12px -2px var(--epic),inset 0 2px 6px #0007}
  .hub-page .slot.leg{border-color:var(--leg);box-shadow:0 0 14px -1px var(--leg),inset 0 2px 6px #0007}
  .hub-page .slot.sel{outline:2px solid var(--gold-2);outline-offset:2px}
  .hub-page .slot .q{position:absolute;bottom:3px;right:5px;font-family:'Forum',serif;font-size:10px;color:var(--ink-dim)}
  .hub-page .item-card{border-radius:12px;padding:12px 13px;background:linear-gradient(#1c1409,#120c06);border:1px solid var(--gold-line)}
  .hub-page .item-card .ih{display:flex;align-items:center;gap:12px;margin-bottom:8px}
  .hub-page .item-card .isym{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:24px;background:#0e0a06}
  .hub-page .item-card .inm{font-family:'Forum',serif;font-size:16px}
  .hub-page .item-card .irar{font-size:13px;letter-spacing:.04em}
  .hub-page .item-card .idesc{font-size:15px;color:var(--ink-dim);line-height:1.35;font-style:italic}
  .hub-page .item-card .iact{display:flex;gap:8px;margin-top:12px}
  .hub-page .mini-btn{flex:1;text-align:center;font-family:'Forum',serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;
    padding:10px;border-radius:10px;border:1px solid var(--gold-line);color:var(--gold-2);background:#d9a94a10;cursor:pointer}
  .hub-page .mini-btn.solid{color:#1a1206;background:linear-gradient(180deg,var(--gold-2),var(--gold-deep));border-color:transparent}

  .hub-page /* ---- PROFILE ---- */
  .p-top{display:flex;flex-direction:column;align-items:center;text-align:center;padding:6px 0 16px}
  .hub-page .avatar{width:92px;height:92px;border-radius:50%;position:relative;margin-bottom:12px;overflow:hidden;
    background:radial-gradient(circle at 50% 30%,#6a5230,#1c130a);border:2px solid var(--gold);
    box-shadow:0 0 0 5px #0a0704,0 0 22px -2px var(--gold)}
  .hub-page .avatar img{width:100%;height:100%;object-fit:cover}
  .hub-page .avatar .fb{position:absolute;inset:0;display:grid;place-items:center;font-size:44px;color:#00000066}
  .hub-page .avatar .ring{position:absolute;inset:-9px;border-radius:50%;border:1px dashed var(--gold-line);opacity:.6}
  .hub-page .p-name{font-family:var(--display);font-size:25px;color:var(--gold-2);line-height:1}
  .hub-page .p-tier{font-family:'Forum',serif;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);
    border:1px solid var(--gold-line);border-radius:100px;padding:4px 12px;margin-top:8px;background:#d9a94a10}
  .hub-page .xp{margin:14px 0 4px;display:flex;justify-content:space-between;font-family:'Forum',serif;font-size:12px;color:var(--ink-mute)}
  .hub-page .xpbar{height:9px;border-radius:100px;background:#0e0a06;border:1px solid var(--hair);overflow:hidden}
  .hub-page .xpbar i{display:block;height:100%;width:64%;border-radius:100px;background:linear-gradient(90deg,var(--gold-deep),var(--gold-2));box-shadow:0 0 10px var(--gold)}
  .hub-page .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}
  .hub-page .stat{text-align:center;padding:14px 6px;border-radius:12px;border:1px solid var(--hair);background:#ffffff06}
  .hub-page .stat b{display:block;font-family:var(--display);font-size:22px;color:var(--gold-2)}
  .hub-page .stat span{font-family:'Forum',serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-mute)}
  .hub-page .list-h{font-family:'Forum',serif;letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:var(--ink);margin:6px 0 10px}
  .hub-page .story-row{display:flex;gap:12px;align-items:center;padding:12px;border-radius:12px;margin-bottom:10px;
    border:1px solid var(--hair);background:#ffffff05;cursor:pointer}
  .hub-page .story-row .th{width:44px;height:56px;border-radius:7px;flex:none;overflow:hidden;position:relative}
  .hub-page .story-row .th img{width:100%;height:100%;object-fit:cover}
  .hub-page .story-row .st{font-family:'Forum',serif;font-size:14px;color:var(--ink)}
  .hub-page .story-row .sp{height:5px;border-radius:100px;background:#0e0a06;margin-top:6px;overflow:hidden}
  .hub-page .story-row .sp i{display:block;height:100%;background:linear-gradient(90deg,var(--gold-deep),var(--gold-2))}
  .hub-page .story-row .pct{font-family:'Forum',serif;font-size:12px;color:var(--gold);margin-top:4px}
  .hub-page .setrow{display:flex;align-items:center;justify-content:space-between;padding:14px 4px;border-bottom:1px solid #ffffff0c;
    font-size:16px;color:var(--ink-dim);cursor:pointer}
  .hub-page .setrow .l{display:flex;align-items:center;gap:12px}.hub-page .setrow .l .g{color:var(--gold);width:20px;text-align:center}
  .hub-page .setrow .chev{color:var(--ink-mute)}

  .hub-page /* ===== READER OVERLAY ===== */
  .reader{position:absolute;inset:0;z-index:70;display:none;flex-direction:column;background:#0b0806}
  .hub-page .reader.on{display:flex;animation:scrin .3s ease both}
  .hub-page .reader .tex-parch{z-index:0}
  .hub-page .rbar{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;
    padding:56px 20px 10px}
  .hub-page .rbar .back{width:36px;height:36px;border-radius:11px;border:1px solid var(--hair);background:#00000066;
    display:grid;place-items:center;color:var(--ink);font-size:17px;cursor:pointer}
  .hub-page .rbar .rt{font-family:'Forum',serif;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);text-align:center;flex:1}
  .hub-page .seg{display:flex;gap:0;position:relative;z-index:10;margin:0 20px 8px;border:1px solid var(--hair);border-radius:10px;overflow:hidden}
  .hub-page .seg button{flex:1;font-family:'Forum',serif;font-size:11px;letter-spacing:.06em;padding:8px 4px;background:#0000;
    color:var(--ink-mute);border:none;cursor:pointer;border-right:1px solid var(--hair)}
  .hub-page .seg button:last-child{border-right:none}
  .hub-page .seg button.on{color:#1a1206;background:linear-gradient(180deg,var(--gold-2),var(--gold-deep))}
  .hub-page .rprogress{position:relative;z-index:10;display:flex;gap:6px;justify-content:center;padding:4px 0 10px}
  .hub-page .rprogress i{width:26px;height:3px;border-radius:100px;background:#ffffff1e}
  .hub-page .rprogress i.on{background:var(--gold-2)}
  .hub-page .rstage{position:relative;z-index:10;flex:1;overflow:hidden;perspective:1700px;margin:0 6px}
  .hub-page .page{position:absolute;inset:0;overflow-y:auto;scrollbar-width:none;padding:6px 22px 20px;transform-origin:left center;backface-visibility:hidden;will-change:transform,opacity,filter;display:flex;flex-direction:column;justify-content:safe center}
  .hub-page .page::-webkit-scrollbar{display:none}
  .hub-page .page h2{font-family:var(--display);font-size:26px;color:var(--gold-2);line-height:1.06;margin-bottom:12px}
  .hub-page .page .kf{width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;margin-bottom:14px;position:relative;
    background:linear-gradient(135deg,#2a1a0c,#0e0a06);border:1px solid var(--gold-line)}
  .hub-page .page .kf img{width:100%;height:100%;object-fit:cover}
  .hub-page .page .kf .lbl{position:absolute;inset:0;display:none;place-items:center;font-family:'Forum',serif;font-size:12px;letter-spacing:.14em;color:#ffffff44;text-transform:uppercase}
  .hub-page .page .kf.noimg .lbl{display:grid}
  .hub-page .page p{font-size:18px;line-height:1.5;color:var(--ink);margin-bottom:14px}
  .hub-page .page p .drop{float:left;font-family:var(--display);font-size:64px;line-height:.66;padding:8px 12px 0 0;color:var(--gold-2)}
  .hub-page .choices{display:flex;flex-direction:column;gap:10px;margin-top:6px}
  .hub-page .choice{text-align:left;font-family:'Cormorant Garamond',serif;font-size:17px;color:var(--ink);padding:14px 16px;border-radius:12px;
    border:1px solid var(--gold-line);background:#d9a94a0d;cursor:pointer;transition:.16s}
  .hub-page .choice:hover{background:#d9a94a1c;transform:translateX(3px)}
  .hub-page .choice .n{font-family:'Forum',serif;color:var(--gold);margin-right:8px}
  .hub-page .rfoot{position:relative;z-index:10;display:flex;gap:12px;padding:10px 20px 26px}
  .hub-page .rbtn{flex:1;font-family:'Forum',serif;font-size:14px;letter-spacing:.1em;text-transform:uppercase;padding:15px;border-radius:14px;
    border:1px solid var(--gold-line);color:var(--gold-2);background:#d9a94a10;cursor:pointer}
  .hub-page .rbtn.solid{color:#1a1206;background:linear-gradient(180deg,var(--gold-2),var(--gold-deep));border-color:transparent}
  .hub-page .rbtn:disabled{opacity:.35;cursor:default}

  .hub-page /* page-turn animations */
  .turn-flip-out{animation:flipOut .42s cubic-bezier(.55,.06,.68,.19) forwards}
  .hub-page .turn-flip-in{animation:flipIn .48s cubic-bezier(.22,.61,.36,1) forwards}
  @keyframes flipOut{from{transform:rotateY(0);filter:brightness(1)}to{transform:rotateY(-110deg);filter:brightness(.32)}}
  @keyframes flipIn{from{transform:rotateY(110deg);filter:brightness(.32)}60%{filter:brightness(.85)}to{transform:rotateY(0);filter:brightness(1)}}
  .hub-page .turn-slide-out{animation:slideOut .3s cubic-bezier(.55,.06,.68,.19) forwards}
  .hub-page .turn-slide-in{animation:slideIn .38s cubic-bezier(.22,.61,.36,1) forwards}
  @keyframes slideOut{to{transform:translateX(-64px) scale(.955);opacity:0}}
  @keyframes slideIn{from{transform:translateX(72px) scale(.955);opacity:0}to{transform:none;opacity:1}}
  .hub-page .turn-fade-out{animation:fadeOut .26s ease forwards}
  .hub-page .turn-fade-in{animation:fadeIn .42s ease forwards}
  @keyframes fadeOut{to{opacity:0;filter:blur(3px)}}
  @keyframes fadeIn{from{opacity:0;filter:blur(3px)}to{opacity:1;filter:blur(0)}}

  .hub-page .toast{position:absolute;bottom:96px;left:50%;transform:translateX(-50%) translateY(20px);z-index:80;
    background:#1a1206ee;border:1px solid var(--gold-line);color:var(--gold-2);font-family:'Forum',serif;
    font-size:13px;padding:10px 18px;border-radius:100px;opacity:0;transition:.3s;pointer-events:none;white-space:nowrap}
  .hub-page .toast.on{opacity:1;transform:translateX(-50%) translateY(0)}

  .hub-page .hint{max-width:520px;text-align:center;color:#7c7565;font-size:13px;line-height:1.55}

  .hub-page .portrait img{width:100%;height:100%;object-fit:cover;position:relative;z-index:1}

  .hub-page /* ===== BOTTOM SHEETS ===== */
  .scrim{position:fixed;inset:0;z-index:80;background:#000;opacity:0;visibility:hidden;transition:opacity .28s,visibility .28s}
  .hub-page .scrim.on{opacity:.6;visibility:visible}
  .hub-page .sheet{position:fixed;left:0;right:0;bottom:0;z-index:90;max-height:88dvh;display:flex;flex-direction:column;
    background:linear-gradient(#1a1207,#100b05);border-top:1px solid var(--gold-line);border-radius:22px 22px 0 0;
    transform:translateY(101%);transition:transform .34s cubic-bezier(.22,.61,.36,1);
    box-shadow:0 -20px 60px -10px #000;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 8px)}
  .hub-page .sheet.on{transform:translateY(0)}
  .hub-page .sheet-grip{width:44px;height:5px;border-radius:100px;background:#ffffff33;margin:10px auto 4px;flex:none;cursor:grab;touch-action:none}
  .hub-page .sheet-body{overflow-y:auto;scrollbar-width:none;padding:6px 16px 18px}
  .hub-page .sheet-body::-webkit-scrollbar{display:none}
  .hub-page .sheet-title{font-family:var(--display);font-size:22px;color:var(--gold-2);margin:2px 0 14px}
  .hub-page /* scenario card */
  .sc-cover{position:relative;height:150px;border-radius:14px;overflow:hidden;margin-bottom:14px;
    background:linear-gradient(135deg,#2a1a0c,#0e0a06);border:1px solid var(--hair)}
  .hub-page .sc-cover img{width:100%;height:100%;object-fit:cover}
  .hub-page .sc-tag{position:absolute;top:10px;left:10px;font-size:11px;letter-spacing:.04em;padding:5px 12px;border-radius:100px;
    background:#0009;border:1px solid var(--gold-line)}
  .hub-page .sc-title{font-family:var(--display);font-size:26px;color:var(--gold-2);line-height:1.05;margin-bottom:8px}
  .hub-page .sc-syn{font-size:16px;line-height:1.4;color:var(--ink-dim);margin-bottom:16px}
  .hub-page .sc-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}
  .hub-page .sc-grid>div{background:#ffffff06;border:1px solid var(--hair);border-radius:12px;padding:10px 6px;text-align:center}
  .hub-page .sc-grid span{display:block;font-family:'Forum',serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-mute);margin-bottom:4px}
  .hub-page .sc-grid b{font-family:'Forum',serif;font-size:13px;color:var(--ink)}
  .hub-page .sc-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px}
  .hub-page .sc-tags span{font-size:13px;color:var(--gold);border:1px solid var(--gold-line);border-radius:100px;padding:4px 11px;background:#d9a94a0d}
  .hub-page .sc-start{width:100%}
  .hub-page /* ===== DRAWER ===== */
  .drawer{position:fixed;top:0;bottom:0;left:0;z-index:95;width:76%;max-width:318px;
    background:linear-gradient(160deg,#1a1207,#0c0803);border-right:1px solid var(--gold-line);
    transform:translateX(-102%);transition:transform .32s cubic-bezier(.22,.61,.36,1);
    display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 24px) 0 calc(env(safe-area-inset-bottom,0px) + 20px);
    box-shadow:20px 0 60px -10px #000}
  .hub-page .drawer.on{transform:translateX(0)!important}
  .hub-page .drawer-head{padding:4px 24px 16px;border-bottom:1px solid var(--hair);margin-bottom:8px}
  .hub-page .drawer-head .dt{font-family:var(--display);font-size:21px;color:var(--gold-2)}
  .hub-page .drawer-head .ds{font-family:'Forum',serif;font-size:12px;letter-spacing:.06em;color:var(--ink-mute);margin-top:3px}
  .hub-page .drawer a{display:flex;align-items:center;gap:14px;padding:15px 24px;color:var(--ink-dim);font-size:17px;cursor:pointer;transition:.16s}
  .hub-page .drawer a:hover{background:#d9a94a10;color:var(--ink)}
  .hub-page .drawer a .g{width:22px;text-align:center;color:var(--gold);font-size:18px}
  .hub-page .drawer a.exit{margin-top:auto;color:var(--blood)}
  .hub-page .drawer a.exit .g{color:var(--blood)}
  .hub-page /* journal */
  .jrn .e{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #ffffff0c}
  .hub-page .jrn .e .dot{width:9px;height:9px;border-radius:50%;background:var(--gold);margin-top:6px;flex:none;box-shadow:0 0 8px var(--gold)}
  .hub-page .jrn .e .ch{font-family:'Forum',serif;font-size:11px;letter-spacing:.06em;color:var(--ink-mute);text-transform:uppercase;margin-bottom:2px}
  .hub-page .jrn .e .tx{font-size:15px;color:var(--ink);line-height:1.35}
  .hub-page .jrn-empty{color:var(--ink-mute);font-style:italic;text-align:center;padding:24px}
  .hub-page /* journal category tabs + colored dots */
  .jtabs{display:flex;gap:7px;overflow-x:auto;margin-bottom:14px;scrollbar-width:none}
  .hub-page .jtabs::-webkit-scrollbar{display:none}
  .hub-page .jtabs button{flex:none;font-family:'Forum',serif;font-size:12px;letter-spacing:.04em;padding:7px 13px;border-radius:100px;
    border:1px solid var(--hair);color:var(--ink-mute);background:#ffffff06;white-space:nowrap;cursor:pointer}
  .hub-page .jtabs button.on{color:var(--gold-2);border-color:var(--gold-line);background:#d9a94a12}
  .hub-page .jrn .e .dot.char{background:var(--rare);box-shadow:0 0 8px var(--rare)}
  .hub-page .jrn .e .dot.event{background:var(--gold);box-shadow:0 0 8px var(--gold)}
  .hub-page .jrn .e .dot.action{background:var(--ember);box-shadow:0 0 8px var(--ember)}
  .hub-page .jrn .e .dot.place{background:var(--post);box-shadow:0 0 8px var(--post)}
  .hub-page /* journal accordion (vertical collapsers + editing / cheat) */
  .jhint{font-size:13px;color:var(--ink-mute);font-style:italic;margin-bottom:12px;line-height:1.4}
  .hub-page .jsec{border:1px solid var(--hair);border-radius:12px;margin-bottom:10px;overflow:hidden;background:#ffffff04}
  .hub-page .jsec-h{display:flex;align-items:center;gap:10px;padding:13px 14px;cursor:pointer;user-select:none}
  .hub-page .jsec-h:hover{background:#d9a94a08}
  .hub-page .jcar{color:var(--gold);font-size:12px;transition:transform .2s}
  .hub-page .jsec.open .jcar{transform:rotate(90deg)}
  .hub-page .jsec-t{flex:1;font-family:'Forum',serif;font-size:15px;letter-spacing:.04em;color:var(--ink);display:flex;align-items:center;gap:9px}
  .hub-page .jsec-t::before{content:'';width:9px;height:9px;border-radius:50%;flex:none}
  .hub-page .jsec-t.dot-char::before{background:var(--rare);box-shadow:0 0 8px var(--rare)}
  .hub-page .jsec-t.dot-event::before{background:var(--gold);box-shadow:0 0 8px var(--gold)}
  .hub-page .jsec-t.dot-action::before{background:var(--ember);box-shadow:0 0 8px var(--ember)}
  .hub-page .jsec-t.dot-place::before{background:var(--post);box-shadow:0 0 8px var(--post)}
  .hub-page .jsec-n{font-family:'Forum',serif;font-size:12px;color:var(--ink-mute);background:#ffffff0c;border-radius:100px;padding:2px 9px;min-width:24px;text-align:center}
  .hub-page .jsec-b{display:none;padding:2px 12px 12px}
  .hub-page .jsec.open .jsec-b{display:block;animation:msgIn .3s ease both}
  .hub-page .jempty{color:var(--ink-mute);font-style:italic;font-size:14px;padding:8px 2px}
  .hub-page .jitem{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-top:1px solid #ffffff0c}
  .hub-page .jitem:first-child{border-top:none}
  .hub-page .jtx{flex:1;font-size:15px;line-height:1.4;color:var(--ink)}
  .hub-page .jedit{flex:none;width:30px;height:30px;border-radius:8px;border:1px solid var(--hair);background:#ffffff06;color:var(--gold);cursor:pointer;font-size:13px}
  .hub-page .jedit:hover{border-color:var(--gold-line);background:#d9a94a12}
  .hub-page .jchat{flex:none;width:30px;height:30px;border-radius:8px;border:1px solid var(--gold-line);background:#d9a94a10;color:var(--gold-2);cursor:pointer;font-size:14px}
  .hub-page .jchat:hover{background:#d9a94a22}
  .hub-page .jitem.editing{flex-direction:column;align-items:stretch;gap:8px}
  .hub-page .jta{width:100%;min-height:70px;resize:vertical;font-family:'Cormorant Garamond',serif;font-size:15px;line-height:1.4;color:var(--ink);
    background:#0e0a06;border:1px solid var(--gold-line);border-radius:10px;padding:10px 12px}
  .hub-page .jta:focus{outline:none;border-color:var(--gold-2)}
  .hub-page .jact{display:flex;gap:8px;justify-content:flex-end}
  .hub-page .jsave,.hub-page .jcancel{font-family:'Forum',serif;font-size:12px;letter-spacing:.06em;padding:8px 16px;border-radius:8px;cursor:pointer}
  .hub-page .jsave{color:#1a1206;background:linear-gradient(180deg,var(--gold-2),var(--gold-deep));border:none}
  .hub-page .jcancel{color:var(--ink-dim);background:#0000;border:1px solid var(--hair)}
  .hub-page /* inventory redesign: limit + pagination + rectangular cells + labels + qty */
  .inv-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px}
  .hub-page .inv-count{font-family:'Forum',serif;font-size:13px;color:var(--ink-dim);letter-spacing:.03em}
  .hub-page .inv-count b{color:var(--gold-2)}
  .hub-page .inv-pager{display:flex;align-items:center;gap:10px;font-family:'Forum',serif;font-size:13px;color:var(--ink-mute)}
  .hub-page .pg-btn{width:30px;height:30px;border-radius:8px;border:1px solid var(--hair);background:#ffffff08;color:var(--gold-2);font-size:15px;cursor:pointer}
  .hub-page .pg-btn:active{transform:scale(.94)}
  .hub-page .inv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
  .hub-page .inv-cw{display:flex;flex-direction:column;gap:5px}
  .hub-page .inv-cell{position:relative;aspect-ratio:1/1;border-radius:10px;display:grid;place-items:center;font-size:23px;cursor:pointer;
    background:linear-gradient(160deg,#241a0e,#120c06),repeating-linear-gradient(45deg,#0000 0 6px,#00000018 6px 7px);
    border:1px solid #ffffff12;color:var(--ink);box-shadow:inset 0 2px 6px #0007;transition:transform .12s}
  .hub-page .inv-cell:active{transform:scale(.95)}
  .hub-page .inv-cell.empty{color:#4a4030;font-size:16px;background:#0e0a06;border-style:dashed;border-color:#ffffff10;cursor:default}
  .hub-page .inv-cell.rare{border-color:var(--rare);box-shadow:0 0 12px -3px var(--rare),inset 0 2px 6px #0007}
  .hub-page .inv-cell.epic{border-color:var(--epic);box-shadow:0 0 12px -3px var(--epic),inset 0 2px 6px #0007}
  .hub-page .inv-cell.leg{border-color:var(--leg);box-shadow:0 0 14px -2px var(--leg),inset 0 2px 6px #0007}
  .hub-page .inv-cell.sel{outline:2px solid var(--gold-2);outline-offset:2px}
  .hub-page .inv-cell .qty{position:absolute;bottom:4px;right:5px;font-family:'Forum',serif;font-size:11px;color:var(--gold-2);
    background:#000a;border-radius:6px;padding:1px 6px}
  .hub-page .inv-lbl{font-size:11px;line-height:1.12;color:var(--ink-dim);text-align:center;min-height:2.24em;
    overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .hub-page /* reader floating quick-access icons (protruding, .hub-page safe-area aware) */
  .rquick{position:absolute;right:0;top:44%;transform:translateY(-50%);z-index:14;display:flex;flex-direction:column;gap:10px;
    padding-right:env(safe-area-inset-right,0px)}
  .hub-page .rq{width:46px;height:46px;border-radius:14px 0 0 14px;border:1px solid var(--gold-line);border-right:none;
    background:linear-gradient(#1c1409,#120c06);color:var(--gold-2);font-size:20px;cursor:pointer;
    box-shadow:-8px 0 22px -8px #000;transition:transform .14s}
  .hub-page .rq:hover{transform:translateX(-3px)}
  .hub-page .rq:active{transform:scale(.94)}

  .hub-page /* ===== ПРОВЕРКА НАВЫКА (свой бросок d20) ===== */
  .msg.roll{align-self:center;max-width:96%;width:340px;text-align:center;padding:18px 16px 16px;
    border-radius:16px;border:1px solid var(--acc);background:radial-gradient(120% 100% at 50% 0,
    color-mix(in srgb,var(--acc) 12%,#0d0a06),#0b0806);box-shadow:0 0 40px -18px var(--acc)}
  .hub-page .roll-hd{font-family:'Forum',serif;font-size:11px;letter-spacing:.16em;text-transform:uppercase;
    color:var(--acc);margin-bottom:3px}
  .hub-page .roll-sub{font-family:'Forum',serif;font-size:11px;color:var(--ink-mute);margin-bottom:12px}
  .hub-page .die{width:118px;height:118px;margin:2px auto 0;position:relative;display:grid;place-items:center}
  .hub-page /* пульсирующее свечение под кубиком */
  .die::before{content:"";position:absolute;width:90%;height:90%;border-radius:50%;
    background:radial-gradient(circle,color-mix(in srgb,var(--acc) 55%,transparent),transparent 68%);
    filter:blur(8px);opacity:.5;animation:dieGlow 1.6s ease-in-out infinite}
  @keyframes dieGlow{0%,100%{opacity:.35;transform:scale(.92)}50%{opacity:.6;transform:scale(1.04)}}
  .hub-page .die svg{position:relative;width:100%;height:100%;filter:drop-shadow(0 6px 16px #000b)}
  .hub-page .die .edge{stroke:color-mix(in srgb,var(--acc) 80%,#fff);stroke-width:1.4;stroke-linejoin:round}
  .hub-page .die .fa{fill:color-mix(in srgb,var(--acc) 16%,#0c0c12)}
  .hub-page .die .fb{fill:color-mix(in srgb,var(--acc) 30%,#0c0c12)}
  .hub-page .die .fc{fill:color-mix(in srgb,var(--acc) 8%,#08080e)}
  .hub-page .die .top{fill:color-mix(in srgb,var(--acc) 42%,#0c0c12)}
  .hub-page .die .num{fill:#fff;font-family:var(--display);font-size:30px;text-anchor:middle;dominant-baseline:central;
    filter:drop-shadow(0 1px 2px #000)}
  .hub-page /* кувырок при броске */
  .die.spin svg{animation:dieTumble .42s cubic-bezier(.5,.1,.5,.9) infinite}
  @keyframes dieTumble{0%{transform:rotate(0) scale(.96)}50%{transform:rotate(190deg) scale(1.04)}100%{transform:rotate(360deg) scale(.96)}}
  .hub-page /* приземление — пружина */
  .die.land svg{animation:dieLand .62s cubic-bezier(.2,1.5,.35,1)}
  @keyframes dieLand{0%{transform:scale(.55) rotate(-30deg)}55%{transform:scale(1.14) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
  .hub-page /* вспышка исхода */
  .die.flash::before{animation:dieFlash .7s ease-out}
  @keyframes dieFlash{0%{opacity:1;transform:scale(1.5)}100%{opacity:.4;transform:scale(1)}}
  .hub-page .roll-calc{font-family:'Forum',serif;font-size:13px;color:var(--ink-dim);margin-top:10px}
  .hub-page .roll-calc b{color:var(--acc)}
  .hub-page .roll-total{font-family:var(--display);font-size:30px;margin-top:4px;color:#fff}
  .hub-page .roll-out{font-family:'Forum',serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-top:6px}
  .hub-page .roll-out.crit{color:var(--acc-2,var(--gold-2))}.hub-page .roll-out.win{color:#9bbf3a}
  .hub-page .roll-out.fail{color:#c76b57}.hub-page .roll-out.crit-fail{color:#a8402c}
  .hub-page /* лист выбора проверки */
  .chk-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:6px}
  .hub-page .chk{display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;
    padding:12px 14px;border-radius:12px;border:1px solid var(--hair);background:#ffffff06;
    color:var(--ink);font-family:'Cormorant Garamond',serif;font-size:16px;cursor:pointer;transition:.2s}
  .hub-page .chk:hover{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 10%,transparent)}
  .hub-page .chk b{font-family:'Forum',serif;font-size:13px;color:var(--acc)}
  .hub-page .chk-lead{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:15px;color:var(--ink-dim);
    text-align:center;margin:2px 0 10px;padding:0 8px}
  .hub-page .roll-btn{text-align:center!important;border-color:var(--acc)!important;
    background:color-mix(in srgb,var(--acc) 14%,transparent)!important;letter-spacing:.06em}


  .hub-page /* ===== ПРАВЫЙ ЛИСТ ПЕРСОНАЖА (десктоп, .hub-page сворачиваемый) ===== */
  .cpanel{display:none}
  @media (min-width:900px){
    .hub-page /* панель — абсолютом справа, .hub-page чтобы не ломать вертикальную колонку ридера */
    .reader{transition:padding-right .32s cubic-bezier(.22,.61,.36,1)}
    .hub-page .reader.cp-open{padding-right:320px}
    .hub-page .cpanel{display:flex;flex-direction:column;position:absolute;right:0;top:0;bottom:0;z-index:16;
      width:320px;border-left:1px solid var(--shell-line);background:linear-gradient(180deg,#111114,#0c0b0e);
      transition:transform .32s cubic-bezier(.22,.61,.36,1)}
    .hub-page .cpanel.collapsed{transform:translateX(100%)}
    .hub-page .cpanel-in{flex:1;overflow-y:auto;scrollbar-width:none;padding:26px 20px 30px}
    .hub-page .cpanel-in::-webkit-scrollbar{display:none}
    .hub-page /* язычок-сворачиватель, .hub-page торчит на левой границе панели */
    /* язычок слит с кромкой панели: тот же фон, .hub-page тонкая полоса, .hub-page мягкий шеврон */
    .cpanel-toggle{position:absolute;left:-22px;top:50%;transform:translateY(-50%);z-index:18;
      width:22px;height:60px;border-radius:8px 0 0 8px;border:1px solid var(--shell-line);border-right:none;
      background:linear-gradient(180deg,#111114,#0c0b0e);color:var(--shell-mute);cursor:pointer;
      display:grid;place-items:center;font-size:13px;transition:color .2s,background .2s}
    .hub-page .cpanel-toggle::before{content:"‹"}
    .hub-page .cpanel-toggle:hover{color:var(--shell-ink);background:#17171b}
    .hub-page /* свёрнуто: ручка прилипает к правому краю экрана, .hub-page шеврон разворачивается */
    .cpanel.collapsed .cpanel-toggle{left:-22px}
    .hub-page .cpanel.collapsed .cpanel-toggle::before{content:"›"}
    .hub-page .reader .rbar,.hub-page .reader .chat,.hub-page .reader .chatfoot{max-width:720px}

    .hub-page .cp-hero{display:flex;align-items:center;gap:13px;margin-bottom:16px}
    .hub-page .cp-ava{width:54px;height:54px;border-radius:13px;overflow:hidden;flex:none;
      border:1px solid var(--acc);box-shadow:0 0 22px -8px var(--acc)}
    .hub-page .cp-ava img{width:100%;height:100%;object-fit:cover}
    .hub-page .cp-nm{font-family:var(--display);font-size:20px;color:var(--shell-ink);line-height:1.1}
    .hub-page .cp-cls{font-family:'Forum',serif;font-size:11px;letter-spacing:.08em;color:var(--shell-mute);margin-top:3px}
    .hub-page /* HP */
    .cp-bar-l{display:flex;justify-content:space-between;font-family:'Forum',serif;font-size:11px;
      letter-spacing:.1em;text-transform:uppercase;color:var(--shell-dim);margin:14px 0 5px}
    .hub-page .cp-bar{height:8px;border-radius:100px;background:#ffffff10;overflow:hidden}
    .hub-page .cp-bar i{display:block;height:100%;border-radius:100px;background:linear-gradient(90deg,#c0392b,#e0662f)}
    .hub-page .cp-xp i{background:linear-gradient(90deg,var(--acc-deep),var(--acc))}
    .hub-page /* верхняя тройка: AC / Скорость / Ур. */
    .cp-top3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0 4px}
    .hub-page .cp-top3 div{text-align:center;padding:10px 4px;border-radius:11px;border:1px solid var(--shell-line);
      background:#ffffff06}
    .hub-page .cp-top3 b{display:block;font-family:var(--display);font-size:19px;color:var(--shell-ink)}
    .hub-page .cp-top3 span{font-family:'Forum',serif;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--shell-mute)}
    .hub-page /* характеристики */
    .cp-hd{font-family:var(--display);font-size:14px;letter-spacing:.04em;color:var(--shell-ink);
      margin:20px 0 10px;padding-bottom:7px;border-bottom:1px solid var(--shell-line)}
    .hub-page .cp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .hub-page .cp-stat{text-align:center;padding:11px 4px;border-radius:12px;border:1px solid var(--shell-line);background:#ffffff05}
    .hub-page .cp-stat .k{font-family:'Forum',serif;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--acc)}
    .hub-page .cp-stat .v{font-family:var(--display);font-size:22px;color:var(--shell-ink);line-height:1.1;margin:2px 0}
    .hub-page .cp-stat .m{font-family:'Forum',serif;font-size:11px;color:var(--shell-dim)}
    .hub-page /* быстрые действия */
    .cp-quick{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}
    .hub-page .cp-quick button{display:flex;align-items:center;gap:8px;padding:11px 12px;border-radius:11px;cursor:pointer;
      border:1px solid var(--shell-line);background:#ffffff06;color:var(--shell-dim);
      font-family:'Forum',serif;font-size:12px;letter-spacing:.04em;transition:.2s}
    .hub-page .cp-quick button:hover{color:var(--shell-ink);border-color:var(--acc)}
    .hub-page .cp-full{width:100%;margin-top:9px;padding:12px;border-radius:11px;cursor:pointer;
      border:1px solid var(--acc);background:color-mix(in srgb,var(--acc) 12%,transparent);
      color:var(--shell-ink);font-family:'Forum',serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
  }

  .hub-page /* ===== reader chat feed (vertical canvas) ===== */
  .chat{position:relative;z-index:10;flex:1;overflow-y:auto;scrollbar-width:none;padding:14px 18px 12px;display:flex;flex-direction:column;gap:14px}
  .hub-page .chat::-webkit-scrollbar{display:none}
  .hub-page .msg{animation:msgIn .42s cubic-bezier(.22,.61,.36,1) both}
  @keyframes msgIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .hub-page .msg.nar{align-self:flex-start;max-width:94%;background:linear-gradient(#1a130a,#130d06);border:1px solid var(--hair);
    border-radius:5px 16px 16px 16px;padding:14px 16px;box-shadow:0 8px 22px -16px #000}
  .hub-page .msg.nar .msg-h{font-family:var(--display);font-size:22px;color:var(--gold-2);line-height:1.08;margin-bottom:8px}
  .hub-page .msg.nar p{font-size:17px;line-height:1.5;color:var(--ink)}
  .hub-page .msg.nar .dropc{float:left;font-family:var(--display);font-size:50px;line-height:.7;padding:6px 10px 0 0;color:var(--gold-2)}
  .hub-page .msg.nar .kf{width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;margin-bottom:10px;position:relative;
    border:1px solid var(--gold-line);background:linear-gradient(135deg,#2a1a0c,#0e0a06)}
  .hub-page .msg.nar .kf img{width:100%;height:100%;object-fit:cover}
  .hub-page .msg.nar .kf .lbl{position:absolute;inset:0;display:none;place-items:center;font-family:'Forum',serif;font-size:12px;letter-spacing:.14em;color:#ffffff44;text-transform:uppercase}
  .hub-page .msg.nar .kf.noimg .lbl{display:grid}
  .hub-page .msg.player{align-self:flex-end;max-width:82%;background:linear-gradient(180deg,var(--gold-2),var(--gold-deep));color:#1a1206;
    border-radius:16px 16px 5px 16px;padding:12px 16px;font-family:'Forum',serif;font-size:15px;line-height:1.35;box-shadow:0 8px 20px -12px rgba(217,169,74,.5)}
  .hub-page .msg.sys{align-self:center;max-width:80%;text-align:center;color:var(--ink-mute);font-style:italic;font-size:14px}
  .hub-page .msg.ctx{align-self:center;max-width:92%;text-align:center;font-family:'Forum',serif;font-size:13px;letter-spacing:.02em;
    color:var(--gold-2);background:#d9a94a12;border:1px solid var(--gold-line);border-radius:100px;padding:8px 16px}
  .hub-page .msg.ctx b{color:var(--gold-2);font-weight:400}
  .hub-page .chatfoot{position:relative;z-index:10;display:flex;flex-direction:column;gap:9px;
    padding:10px 18px calc(env(safe-area-inset-bottom,0px) + 16px);border-top:1px solid var(--hair);
    background:linear-gradient(#0b080600,#0b0806 45%)}
  .hub-page .choice-q{font-family:'Forum',serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);text-align:center}
  .hub-page .cont-btn{font-family:'Forum',serif;font-size:14px;letter-spacing:.1em;text-transform:uppercase;padding:14px;border-radius:14px;
    border:1px solid var(--gold-line);color:var(--gold-2);background:#d9a94a12;cursor:pointer;transition:.16s}
  .hub-page .cont-btn:hover{background:#d9a94a22}
  .hub-page .chat-end{text-align:center;font-family:var(--display);color:var(--gold);opacity:.7;padding:10px}
  .hub-page /* settings */
  .set-group{margin-bottom:16px}
  .hub-page .set-group .lh{font-family:'Forum',serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-mute);margin-bottom:8px}
  .hub-page .set-seg{display:flex;border:1px solid var(--hair);border-radius:10px;overflow:hidden}
  .hub-page .set-seg button{flex:1;padding:11px 4px;background:#0000;color:var(--ink-mute);border:none;border-right:1px solid var(--hair);
    font-family:'Forum',serif;font-size:13px;cursor:pointer}
  .hub-page .set-seg button:last-child{border-right:none}
  .hub-page .set-seg button.on{color:#1a1206;background:linear-gradient(180deg,var(--gold-2),var(--gold-deep))}

  .hub-page /* ===== DEPLOYED PWA — fullscreen app, .hub-page no demo chrome ===== */
  body{padding:0!important;gap:0!important;display:block!important;height:100dvh;overflow:hidden;background:var(--bg-0)}
  .hub-page .board-h,.hub-page .hint,.hub-page .devtoggle,.hub-page .pwa-state,.hub-page #installBtn,.hub-page #devBtn,.hub-page .fontbtn{display:none!important}
  .hub-page .phone{position:fixed!important;inset:0!important;width:auto!important;height:100dvh!important;
    max-width:none!important;aspect-ratio:auto!important;padding:0!important;border-radius:0!important;
    background:var(--bg-0)!important;box-shadow:none!important}
  .hub-page .notch,.hub-page .statusbar,.hub-page .homebar{display:none!important}
  .hub-page .screen{border-radius:0!important}
  .hub-page .soundbtn{top:calc(env(safe-area-inset-top,0px) + 12px)!important}
  .hub-page .appbar{padding-top:calc(env(safe-area-inset-top,0px) + 16px)!important}
  .hub-page .nav{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 18px)!important}
  /* ===== DESKTOP: real adaptive layout — sidebar + wide content area ===== */
  @media (min-width:900px){
    .hub-page .screen{border-radius:0!important}
    .hub-page /* left sidebar navigation (persistent) */
    .nav{flex-direction:column!important;justify-content:flex-start!important;align-items:stretch!important;gap:6px!important;
      top:0!important;bottom:0!important;left:0!important;right:auto!important;height:100%!important;
      width:clamp(224px,17vw,280px)!important;border-top:none!important;border-right:1px solid var(--hair)!important;
      padding:92px 14px 24px!important;background:linear-gradient(180deg,#140e07,#0b0806)!important;backdrop-filter:none!important}
    .hub-page /* clickable brand = the way back to the landing (there was no route out before) */
    .side-brand{display:block!important;position:absolute;top:30px;left:24px;font-family:var(--display);
      font-size:22px;letter-spacing:.14em;color:var(--gold-2);text-decoration:none;
      text-shadow:0 0 18px rgba(217,169,74,.35);transition:opacity .2s}
    .hub-page .side-brand:hover{opacity:.75}
    .hub-page .nav a{flex-direction:row!important;justify-content:flex-start!important;gap:14px!important;width:100%!important;
      padding:14px 18px!important;border-radius:12px!important;font-size:15px!important;letter-spacing:.03em!important}
    .hub-page .nav a .g{font-size:20px!important}
    .hub-page .nav a.act{background:#ffffff12!important;color:var(--shell-ink)!important;transform:none!important}
    .hub-page /* content area fills the rest of the width; inner blocks centered at a comfortable width */
    .scroll{left:clamp(224px,17vw,280px)!important;padding:0 max(4%,28px) 48px!important}
    .hub-page .appbar,.hub-page .hero-wrap,.hub-page .search,.hub-page .fchips,.hub-page .featured,.hub-page .sec-h,.hub-page .packs,.hub-page .inv-hero,.hub-page .tabs,.hub-page .slots,.hub-page #itemCard,
    .hub-page .p-top,.hub-page .stats,.hub-page .list-h,.hub-page .story-row,.hub-page .setrow{max-width:1120px;margin-left:auto!important;margin-right:auto!important}
    .hub-page .chips,.hub-page .cta,.hub-page .subcta{max-width:640px;margin-left:auto!important;margin-right:auto!important}
    .hub-page .cta{display:block!important}  .hub-page /* button defaults to inline-block; block lets margin:auto center it */
    .appbar{padding-top:32px!important}
    .hub-page .hero-wrap{min-height:56vh!important;border-radius:24px;margin-bottom:22px!important}
    .hub-page .packs{grid-template-columns:repeat(4,1fr)!important}
    .hub-page .scr[data-scr="inventory"] .slots{grid-template-columns:repeat(8,1fr)!important}
    .hub-page .soundbtn{top:26px!important;right:30px!important}
    .hub-page /* reader: comfortable centered reading column */
    .reader .rbar,.hub-page .reader .chat,.hub-page .reader .chatfoot{max-width:760px;margin-left:auto;margin-right:auto;width:100%}
    .hub-page /* modal = centered dialog (not a bottom sheet) on desktop */
    .sheet-grip{display:none}
    .hub-page .sheet{top:50%!important;bottom:auto!important;left:0!important;right:0!important;margin:0 auto!important;
      width:min(560px,92vw)!important;max-height:86dvh;border-radius:22px!important;border:1px solid var(--gold-line)!important;
      transform:translateY(-44%)!important;opacity:0;visibility:hidden;
      transition:transform .32s cubic-bezier(.22,.61,.36,1),opacity .3s,visibility .3s!important}
    .hub-page .sheet.on{transform:translateY(-50%)!important;opacity:1!important;visibility:visible!important}
    .hub-page .sheet-body{padding-top:20px!important}
    .hub-page .drawer{width:300px!important;max-width:300px!important}
  }
  .hub-page .devtoggle{margin-top:12px;font-family:'Forum',serif;font-size:13px;letter-spacing:.06em;
    color:var(--gold-2);border:1px solid var(--gold-line);background:#d9a94a12;border-radius:100px;
    padding:9px 20px;cursor:pointer;transition:.18s}
  .hub-page .devtoggle:hover{background:#d9a94a22;transform:translateY(-1px)}
  .hub-page .pwa-state{display:block;margin-top:8px;font-family:'Forum',serif;font-size:11px;letter-spacing:.08em;color:var(--ink-mute)}

  .hub-page /* ===== ART DIRECTION POLISH (heraldic ornament · gold thread · grain · bevel) ===== */
  .ornate{position:relative}
  .hub-page .ornate::before,.hub-page .ornate::after{content:'⚜';position:absolute;color:var(--gold);font-size:13px;line-height:1;
    opacity:.85;z-index:4;text-shadow:0 0 8px rgba(217,169,74,.55);pointer-events:none}
  .hub-page .ornate::before{top:7px;left:9px}
  .hub-page .ornate::after{bottom:7px;right:9px}
  .hub-page .gthread{height:1px;margin:16px 0;background:linear-gradient(90deg,#0000,var(--gold-line),#0000)}
  .hub-page .sc-grid .ic{display:block;font-size:15px;color:var(--gold);margin-bottom:5px;line-height:1}
  .hub-page /* 5% parchment grain on raised surfaces */
  .msg.nar{background:radial-gradient(#ffffff07 .5px,transparent .5px) 0 0/3px 3px,linear-gradient(#1a130a,#130d06)}
  .hub-page .sheet{background:radial-gradient(#ffffff06 .5px,transparent .5px) 0 0/3px 3px,linear-gradient(#1a1207,#100b05)}
  .hub-page .item-card{background:radial-gradient(#ffffff07 .5px,transparent .5px) 0 0/3px 3px,linear-gradient(#1c1409,#120c06)}
  .hub-page .inv-cell{background:radial-gradient(#ffffff08 .5px,transparent .5px) 0 0/3px 3px,
    linear-gradient(160deg,#241a0e,#120c06)}
  .hub-page /* beveled "gemstone set in metal" primary buttons */
  .rbtn.solid,.hub-page .jsave,.hub-page .mini-btn.solid,.hub-page .cta{
    box-shadow:0 1px 0 rgba(255,246,222,.45) inset,0 -3px 8px rgba(90,60,15,.55) inset,0 10px 26px -10px rgba(217,169,74,.5)}
  .hub-page /* hairline gold frame on the hero plate */
  .hero-wrap{border:1px solid var(--gold-line)}

</style>
