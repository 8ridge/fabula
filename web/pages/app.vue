<template>
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
              <img class="hb-img" src="/assets/hero_fantasy.jpg" alt="" onerror="this.style.display='none'">
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
            <img src="/assets/cover_fantasy.jpg" alt="" onerror="this.style.display='none'">
            <div class="fv"></div>
            <div class="badge">Новинка недели</div>
            <h3>Пепельные земли</h3>
            <p>Тёмное фэнтези · 8 глав · рейтинг ★ 4.8</p>
          </div>
          <div class="sec-h"><span class="t">Архижанры</span><span class="a">все →</span></div>
          <div class="packs">
            <div class="pack" data-open="fant"><div class="cover pv-fant"><img src="/assets/cover_fantasy.jpg" onerror="this.style.display='none'"></div>
              <span class="tagn t-fant">Фэнтези</span><span class="glyph">⚔</span>
              <div class="g-name g-fant">Пепельные земли</div><div class="g-meta">12 историй</div></div>
            <div class="pack" data-open="scifi"><div class="cover pv-scifi"><img src="/assets/cover_scifi.png" onerror="this.style.display='none'"></div>
              <span class="tagn t-scifi">Sci-Fi</span><span class="glyph">✧</span>
              <div class="g-name g-scifi">Кассандра</div><div class="g-meta">9 историй</div></div>
            <div class="pack" data-open="hist"><div class="cover pv-hist"><img src="/assets/cover_history.png" onerror="this.style.display='none'"></div>
              <span class="tagn t-hist">История</span><span class="glyph">⚜</span>
              <div class="g-name g-hist">Восстание Спартака</div><div class="g-meta">7 историй</div></div>
            <div class="pack" data-open="post"><div class="cover pv-mod"><img src="/assets/cover_postapoc.png" onerror="this.style.display='none'"></div>
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
          <div class="appbar" style="position:sticky"><div class="ttl">Профиль</div>
            <div class="p-actions"><button class="p-act" data-act="logout" title="Выйти"><span class="g">🚪</span>Выйти</button><button class="p-act p-gear" data-act="open-settings" title="Настройки">⚙</button></div>
          </div>
          <div class="p-top">
            <div class="ava-wrap">
              <div class="avatar" id="avaBtn" title="Загрузить фото"><img id="avaImg" alt="" style="display:none"><span class="fb" id="avaFb">·</span></div>
              <button type="button" class="ava-cam" id="avaCam" title="Загрузить фото">✎</button>
            </div>
            <input type="file" id="avaFile" accept="image/*" style="display:none">
            <div class="p-name" data-p="username">@…</div>
            <div class="p-tier"><span data-p="email">…</span> <span data-p="verified" style="color:#7cc47f">✓ подтверждена</span></div>
            <div class="p-joined" data-p="joined" style="font-size:12px;color:var(--ink-mute)"></div>
          </div>
          <div class="list-h" style="margin-top:14px">Уровень и достижения</div>
          <div class="p-card p-lvl">
            <div class="lvl-top"><span>Уровень <b>7</b> · Сказитель</span><span><b>1 840</b> / 2 800 XP</span></div>
            <div class="lvl-bar"><i style="width:64%"></i></div>
            <div class="ach">
              <div class="badge"><span class="ic">🗝</span><span class="bl">Первый выбор</span></div>
              <div class="badge"><span class="ic">⚔</span><span class="bl">10 битв</span></div>
              <div class="badge"><span class="ic">📖</span><span class="bl">5 глав</span></div>
              <div class="badge lock"><span class="ic">👑</span><span class="bl">Финал</span></div>
              <div class="badge lock"><span class="ic">✦</span><span class="bl">Секрет</span></div>
            </div>
          </div>
          <div class="list-h">Активные истории</div>
          <div class="story-row" data-open="fant"><div class="th pv-fant"><img src="/assets/cover_fantasy.jpg" onerror="this.style.display='none'"></div>
            <div style="flex:1"><div class="st">Королевство Пепельных земель</div><div class="s-meta"><span>Глава 5 · 62%</span><span>Роль: Странник</span><span>2 дня назад</span></div><div class="sp"><i style="width:62%"></i></div></div></div>
          <div class="story-row" data-open="scifi"><div class="th pv-scifi"><img src="/assets/cover_scifi.png" onerror="this.style.display='none'"></div>
            <div style="flex:1"><div class="st">Станция «Кассандра»</div><div class="s-meta"><span>Глава 2 · 28%</span><span>Роль: Капитан</span><span>неделю назад</span></div><div class="sp"><i style="width:28%"></i></div></div></div>
          <div class="list-h" style="margin-top:18px">Аккаунт</div>
          <div class="p-card">
            <div class="setrow" data-act="username"><span class="l"><span class="g">◈</span>Никнейм</span><span class="chev" data-p="username-mini"></span></div>
            <div class="setrow" data-act="password"><span class="l"><span class="g">⚿</span>Пароль</span><span class="chev">Изменить ›</span></div>
            <div class="setrow"><span class="l"><span class="g">✉</span>Почта</span><span class="chev" style="color:#7cc47f">подключена</span></div>
            <div class="setrow" data-act="google"><span class="l"><span class="g">G</span>Google</span><span class="chev" data-p="google">скоро</span></div>
            <div class="setrow" data-act="devices"><span class="l"><span class="g">🛡</span>Безопасность · устройства</span><span class="chev">›</span></div>
            <div class="setrow" data-act="logout-all"><span class="l"><span class="g">⎇</span>Выйти со всех устройств</span><span class="chev">›</span></div>
          </div>
          <div class="p-card" style="margin-top:12px">
            <div class="setrow" data-act="delete"><span class="l" style="color:#d9655f"><span class="g">🗑</span>Удалить аккаунт</span><span class="chev">›</span></div>
          </div>
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

      <!-- ===== СОЗДАНИЕ ГЕРОЯ ===== -->
      <div class="creator" id="creator">
        <div class="cr-bar">
          <button class="cr-back" id="crBack" aria-label="Назад">‹</button>
          <div class="cr-kick"><b>Создание героя</b><span id="crWorld">Пепельные земли</span></div>
        </div>
        <div class="cr-body">
          <div class="cr-h">Кто ты в этом мире?</div>
          <div class="cr-sub">Опиши героя одной фразой — остальное подберёт ИИ. Или заполни сам.</div>
          <div class="cr-grid">
            <div>
              <div class="cr-portrait" id="crPortrait"><img src="/assets/avatar.jpg" alt=""></div>
              <div class="cr-pbtns">
                <button data-p="gen">✦ Сгенерировать</button>
                <button data-p="upload">↥ Загрузить</button>
              </div>
            </div>
            <div>
              <div class="cr-field">
                <label id="crRoleLabel">Класс</label>
                <div class="cr-roles" id="crRoles"></div>
              </div>
              <div class="cr-field">
                <label>Опиши своего героя</label>
                <textarea id="crPrompt"></textarea>
                <div class="cr-gen"><button id="crGen">✦ Сгенерировать героя</button></div>
              </div>
              <div class="cr-field cr-grid" style="grid-template-columns:1fr 1fr;gap:12px">
                <div><label>Имя</label><input type="text" id="crName" placeholder="Безымянный"></div>
                <div><label id="crFieldLabel">Раса</label>
                  <select class="cr-sel" id="crField"></select></div>
              </div>
              <div class="cr-field">
                <label>Кратко о герое</label>
                <textarea id="crBio" placeholder="Пара строк о характере и прошлом"></textarea>
              </div>
              <div class="cr-stats-h"><b>Характеристики</b><button class="cr-reroll" id="crReroll">⟳ Перебросить</button></div>
              <div class="cr-stats" id="crStats"></div>
              <button class="cr-go" id="crGo">Начать приключение</button>
              <div class="cr-note">Героя можно будет докрутить в любой момент</div>
            </div>
          </div>
        </div>
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
      <div class="pmodal" id="pmodal">
        <div class="pmodal-card">
          <div class="pmodal-h" id="pmTitle">Заголовок</div>
          <div id="pmBody"></div>
          <div class="pmodal-msg" id="pmMsg"></div>
          <div class="pmodal-btns"><button class="pmodal-cancel" id="pmCancel">Отмена</button><button class="pmodal-ok" id="pmOk">Сохранить</button></div>
        </div>
      </div>
      <div class="sheet2" id="settingsSheet">
        <div class="sheet2-card">
          <div class="sheet2-h">Настройки <button class="sheet2-x" id="setClose">✕</button></div>
          <div class="set-grp"><div class="set-lh">Звук и музыка</div>
            <label class="set-tog"><span>Общий звук</span><input type="checkbox" id="sndMaster"></label>
            <label class="set-tog"><span>Музыка / эмбиент</span><input type="checkbox" id="sndMusic"></label>
            <label class="set-tog"><span>Эффекты (клики)</span><input type="checkbox" id="sndSfx"></label>
          </div>
          <div class="set-grp"><div class="set-lh">Оформление</div>
            <div class="set-seg" id="fontSeg"><button data-fs="s">S</button><button data-fs="m">M</button><button data-fs="l">L</button></div>
            <div class="set-hint">Размер шрифта в чтении</div>
          </div>
          <div class="set-grp"><div class="set-lh">Подписка</div>
            <div class="set-row-soon"><span>Подписка и грейды</span><span class="soon">Скоро</span></div>
          </div>
        </div>
      </div>
      <div class="sheet2" id="devSheet">
        <div class="sheet2-card">
          <div class="sheet2-h">Устройства <button class="sheet2-x" id="devClose">✕</button></div>
          <div id="devList" class="dev-list"></div>
        </div>
      </div>
      <div class="grain"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><filter id="ng"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/></filter><rect width="100%" height="100%" filter="url(#ng)"/></svg></div>
      <div class="homebar"></div>
    </div>
  </div>


</template>

<script setup>
import { onMounted } from 'vue'
import '~/assets/css/app.css'
definePageMeta({ layout: false })
useHead({
  title: 'ФАБУЛА · MVP',
  link: [{ rel: 'stylesheet', href: '/assets/fonts/fonts.css' }]
})

const googleClientId = useRuntimeConfig().public.googleClientId || ''

onMounted(() => {
  /* ===== сессия: читаем JWT-токен, положенный лендингом ===== */
  let session = null;
  try { const t = localStorage.getItem('fabula-token'), u = localStorage.getItem('fabula-user'); if (t && u) session = { token: t, user: JSON.parse(u) }; } catch(e) {}
  window.__fabulaSession = session;                 // доступно всему приложению
  if (session && session.user) window.__fabulaUserName = session.user.username;

  const AUTH_API = (location.hostname==='localhost' || location.hostname==='127.0.0.1')
    ? 'http://127.0.0.1:8000' : 'https://dungeon20-p5svbq.saturn.ac';

  async function apiAuth(path, method='GET', body=null){
    const token = localStorage.getItem('fabula-token') || '';
    const opt = { method, headers: { 'Authorization': 'Bearer ' + token } };
    if (body instanceof FormData){ opt.body = body; }
    else if (body){ opt.headers['Content-Type']='application/json'; opt.body = JSON.stringify(body); }
    const res = await fetch(AUTH_API + path, opt);
    let data = null; try { data = await res.json(); } catch(_){}
    return { res, data };
  }

  function fmtJoined(iso){
    try { return new Date(iso).toLocaleDateString('ru-RU', {day:'numeric', month:'long', year:'numeric'}); }
    catch(_){ return ''; }
  }

  async function loadProfile(){
    const { res, data } = await apiAuth('/auth/me');
    if (res.status === 401){ location.href = '/'; return; }  // нет сессии → на сайт
    if (!res.ok || !data) return;
    window.__fabulaUser = data;
    const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    set('[data-p="username"]', '@' + data.username);
    set('[data-p="email"]', data.email);
    set('[data-p="joined"]', 'на ФАБУЛЕ с ' + fmtJoined(data.created_at));
    const badge = document.querySelector('[data-p="verified"]');
    if (badge) badge.style.display = data.email_verified ? '' : 'none';
    const gp = document.querySelector('[data-p="google"]');
    if (gp) gp.textContent = data.providers.includes('google') ? 'привязан · отвязать' : 'привязать';
    const av=document.getElementById('avaImg'), fb=document.getElementById('avaFb');
    if(fb) fb.textContent=((data.username||'?').trim().charAt(0)||'?').toUpperCase();
    if(av){ if(data.has_avatar){ av.style.display=''; av.src=AUTH_API + '/auth/avatar/'+data.id+'?v='+(data.avatar_v||''); if(fb) fb.style.display='none'; } else { av.style.display='none'; av.removeAttribute('src'); if(fb) fb.style.display=''; } }
  }
  loadProfile();

  const avaBtn=document.getElementById('avaBtn'), avaFile=document.getElementById('avaFile');
  if(avaBtn&&avaFile){
    avaBtn.addEventListener('click', ()=>avaFile.click());
    const avaCam=document.getElementById('avaCam'); if(avaCam) avaCam.addEventListener('click', (e)=>{ e.stopPropagation(); avaFile.click(); });
    avaFile.addEventListener('change', async ()=>{
      const f=avaFile.files&&avaFile.files[0]; if(!f) return;
      if(f.size>3*1024*1024){ toast('Файл больше 3 МБ'); return; }
      const img=new Image(); img.onload=async ()=>{
        const s=Math.min(img.width,img.height), c=document.createElement('canvas'); c.width=256; c.height=256;
        c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,256,256);
        c.toBlob(async (blob)=>{
          const fd=new FormData(); fd.append('file', blob, 'avatar.webp');
          const { res, data } = await apiAuth('/auth/avatar','POST',fd);
          if(res.ok){ toast('Аватар обновлён'); const id=(window.__fabulaUser||{}).id; const el=document.getElementById('avaImg'); const fbx=document.getElementById('avaFb'); if(el&&id){ el.style.display=''; el.src=AUTH_API + '/auth/avatar/'+id+'?v='+((data&&data.v)||Date.now()); if(fbx) fbx.style.display='none'; } }
          else toast('Не удалось загрузить');
        }, 'image/webp', 0.9);
      };
      img.src=URL.createObjectURL(f);
    });
  }

  function toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.textContent=msg; t.classList.add('on'); setTimeout(()=>t.classList.remove('on'),2200); }

  const pm = document.getElementById('pmodal');
  function openModal(title, bodyHtml, onOk){
    document.getElementById('pmTitle').textContent = title;
    document.getElementById('pmBody').innerHTML = bodyHtml;
    document.querySelectorAll('#pmBody .pm-eye').forEach(b=>b.addEventListener('click',()=>{ const i=b.previousElementSibling; if(i&&i.tagName==='INPUT'){ i.type=i.type==='password'?'text':'password'; b.textContent=i.type==='password'?'👁':'🙈'; } }));
    document.getElementById('pmMsg').textContent = '';
    document.getElementById('pmOk').style.display = bodyHtml.includes('pmGoogleBtn') ? 'none' : '';
    pm.classList.add('on');
    const ok = document.getElementById('pmOk'), cancel = document.getElementById('pmCancel');
    const close = ()=>{ pm.classList.remove('on'); ok.onclick=null; cancel.onclick=null; };
    cancel.onclick = close;
    ok.onclick = async ()=>{ const keep = await onOk(document.getElementById('pmMsg')); if(!keep) close(); };
    const first = document.querySelector('#pmBody input'); if(first) first.focus();
  }

  const setSheet=document.getElementById('settingsSheet');
  document.querySelectorAll('[data-act="open-settings"]').forEach(b=>b.addEventListener('click',()=>setSheet.classList.add('on')));
  const setClose=document.getElementById('setClose'); if(setClose) setClose.addEventListener('click',()=>setSheet.classList.remove('on'));
  const sndEls={ master:document.getElementById('sndMaster'), music:document.getElementById('sndMusic'), sfx:document.getElementById('sndSfx') };
  const sndGet=(k)=>localStorage.getItem('fabula-snd-'+k)!=='off';
  function applySound(){
    try{ if(typeof master!=='undefined' && master) master.gain.value = sndGet('master') ? 0.9 : 0; }catch(e){}
    try{ if(typeof ambGain!=='undefined' && ambGain) ambGain.gain.value = (sndGet('master')&&sndGet('music')) ? 0.2 : 0; }catch(e){}
    window.__fabulaSfxOff = !(sndGet('master')&&sndGet('sfx'));
  }
  Object.entries(sndEls).forEach(([k,el])=>{ if(!el) return; el.checked=sndGet(k); el.addEventListener('change',()=>{ localStorage.setItem('fabula-snd-'+k, el.checked?'on':'off'); applySound(); }); });
  applySound();
  const fsSeg=document.getElementById('fontSeg');
  function applyFont(){ const fs=localStorage.getItem('fabula-fontsize')||'m'; document.documentElement.style.setProperty('--read-fs', fs==='s'?'16px':fs==='l'?'21px':'18px'); if(fsSeg) fsSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.fs===fs)); }
  if(fsSeg) fsSeg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ localStorage.setItem('fabula-fontsize', b.dataset.fs); applyFont(); }));
  applyFont();

  const devSheet=document.getElementById('devSheet');
  const devCloseBtn=document.getElementById('devClose'); if(devCloseBtn) devCloseBtn.addEventListener('click',()=>devSheet.classList.remove('on'));
  function relTime(iso){ if(!iso) return ''; const d=new Date(iso), now=new Date(), days=Math.floor((now-d)/86400000);
    if(days<=0) return 'сегодня'; if(days===1) return 'вчера'; if(days<7) return days+' дн. назад'; return d.toLocaleDateString('ru-RU'); }
  async function openDevices(){
    devSheet.classList.add('on');
    const list=document.getElementById('devList'); list.innerHTML='<div class="dev-empty">Загрузка…</div>';
    const { res, data } = await apiAuth('/auth/sessions','GET');
    if(!res.ok || !Array.isArray(data)){ list.innerHTML='<div class="dev-empty">Не удалось загрузить</div>'; return; }
    if(!data.length){ list.innerHTML='<div class="dev-empty">Нет активных устройств</div>'; return; }
    list.innerHTML='';
    data.forEach(s=>{
      const row=document.createElement('div'); row.className='dev-row';
      const info=document.createElement('div'); info.className='dev-info';
      const name=document.createElement('div'); name.className='dev-name'; name.textContent=s.device||'Устройство';
      if(s.current){ const b=document.createElement('span'); b.className='dev-cur'; b.textContent='это устройство'; name.appendChild(document.createTextNode(' ')); name.appendChild(b); }
      const meta=document.createElement('div'); meta.className='dev-meta';
      meta.textContent=(s.country_name||'—')+' · вход '+relTime(s.created_at)+' · активно '+relTime(s.last_seen_at);
      info.appendChild(name); info.appendChild(meta); row.appendChild(info);
      if(!s.current){ const kill=document.createElement('button'); kill.className='dev-kill'; kill.textContent='Выйти';
        kill.addEventListener('click', async ()=>{ const { res }=await apiAuth('/auth/sessions/'+s.id,'DELETE'); if(res.ok){ toast('Устройство отключено'); openDevices(); } });
        row.appendChild(kill); }
      list.appendChild(row);
    });
  }

  function clearSession(){ try{ localStorage.removeItem('fabula-token'); localStorage.removeItem('fabula-user'); }catch(_){}; location.href='/'; }

  document.querySelectorAll('[data-scr="profile"] [data-act]').forEach(row => {
    row.addEventListener('click', async () => {
      const act = row.dataset.act;
      if (act === 'logout') { clearSession(); return; }
      if (act === 'devices') { openDevices(); return; }
      if (act === 'logout-all') {
        const { res } = await apiAuth('/auth/logout-all', 'POST');
        if (res.ok) { toast('Вышли со всех устройств'); clearSession(); }
        return;
      }
      if (act === 'username') {
        const cur = (window.__fabulaUser && window.__fabulaUser.username) || '';
        openModal('Смена ника',
          `<label class="pm-l">Новый ник</label><input id="pmNick" value="${cur}" placeholder="3–20, латиница/цифры/_">`,
          async (msg)=>{
            const v = (document.getElementById('pmNick').value||'').trim();
            if(!/^[A-Za-z0-9_]{3,20}$/.test(v)){ msg.textContent='Ник: 3–20, латиница, цифры, _'; return true; }
            const { res } = await apiAuth('/auth/username','PATCH',{ username:v });
            if(res.ok){ toast('Ник обновлён'); loadProfile(); return false; }
            msg.textContent = res.status===409 ? 'Ник занят' : 'Проверь формат'; return true;
          });
        requestAnimationFrame(()=>{ const ni=document.getElementById('pmNick'); if(ni){ ni.focus(); const L=ni.value.length; ni.setSelectionRange(L,L); } });
        return;
      }
      if (act === 'password') {
        openModal('Смена пароля',
          `<label class="pm-l">Текущий пароль</label><div class="pm-field"><input id="pmCur" type="password" autocomplete="current-password"><button type="button" class="pm-eye" tabindex="-1">👁</button></div>`+
          `<label class="pm-l">Новый пароль (≥6)</label><div class="pm-field"><input id="pmNew" type="password" autocomplete="new-password"><button type="button" class="pm-eye" tabindex="-1">👁</button></div>`+
          `<label class="pm-l">Повтор нового</label><div class="pm-field"><input id="pmRep" type="password" autocomplete="new-password"><button type="button" class="pm-eye" tabindex="-1">👁</button></div>`,
          async (msg)=>{
            const cur=document.getElementById('pmCur').value, nw=document.getElementById('pmNew').value, rp=document.getElementById('pmRep').value;
            if(nw.length<6){ msg.textContent='Новый пароль от 6 символов'; return true; }
            if(nw!==rp){ msg.textContent='Пароли не совпадают'; return true; }
            const { res } = await apiAuth('/auth/change-password','POST',{ current_password:cur, new_password:nw });
            if(res.ok){ toast('Пароль изменён, войдите заново'); clearSession(); return false; }
            msg.textContent='Неверный текущий пароль'; return true;
          });
        return;
      }
      if (act === 'google') {
        const u = window.__fabulaUser || {};
        if ((u.providers||[]).includes('google')) {
          const { res } = await apiAuth('/auth/link/google', 'DELETE');
          if (res.status === 400) toast('Сначала добавь пароль'); else if (res.ok) { toast('Google отвязан'); loadProfile(); }
          return;
        }
        const clientId = googleClientId;
        if (!clientId) { toast('Google-вход скоро'); return; }
        openModal('Привязать Google', `<div id="pmGoogleBtn" style="display:flex;justify-content:center;padding:6px 0"></div>`, async ()=>true);
        await new Promise((resolve)=>{ if(window.google&&window.google.accounts) return resolve(); const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true; s.onload=()=>resolve(); document.head.appendChild(s); });
        window.google.accounts.id.initialize({ client_id: clientId, callback: async (resp)=>{
          const { res } = await apiAuth('/auth/link/google','POST',{ id_token: resp.credential });
          document.getElementById('pmodal').classList.remove('on');
          if (res.status === 409) toast('Этот Google уже привязан к другому'); else if (res.ok) { toast('Google привязан'); loadProfile(); }
        }});
        const holder = document.getElementById('pmGoogleBtn');
        if (holder) window.google.accounts.id.renderButton(holder, { theme:'filled_black', size:'large', text:'continue_with', shape:'pill', width: 280 });
        return;
      }
      if (act === 'delete') {
        if (!confirm('Удалить аккаунт навсегда? Это необратимо.')) return;
        const { res } = await apiAuth('/auth/account', 'DELETE');
        if (res.ok) { toast('Аккаунт удалён'); clearSession(); }
        return;
      }
    });
  });

/* ================= SOUND (Web Audio) ================= */
let AC=null, master=null, ambGain=null, ambOsc=[], unlocked=false, muted=false;
function initAudio(){
  if(AC) return;
  AC=new (window.AudioContext||window.webkitAudioContext)();
  master=AC.createGain(); master.gain.value=0.9; master.connect(AC.destination);
  applySound();
}
function canPlay(){ return AC && unlocked && !muted; }
function blip(freq,dur,type,vol){
  if(!canPlay()) return;
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine'; o.frequency.value=freq;
  g.gain.setValueAtTime(0.0001,AC.currentTime);
  g.gain.exponentialRampToValueAtTime(vol||0.25,AC.currentTime+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+dur);
  o.connect(g); g.connect(master); o.start(); o.stop(AC.currentTime+dur+0.02);
}
function sfxClick(){ if(window.__fabulaSfxOff) return; blip(1300,0.05,'triangle',0.22); blip(2600,0.03,'sine',0.09); }
function sfxRoll(){ if(window.__fabulaSfxOff) return; for(let i=0;i<6;i++) setTimeout(()=>blip(300+Math.random()*500,0.03,'square',0.06),i*70); }
function sfxNav(){ if(window.__fabulaSfxOff) return; blip(560,0.09,'sine',0.24); setTimeout(()=>blip(840,0.10,'sine',0.17),55); }
function sfxPage(){
  if(window.__fabulaSfxOff) return;
  if(!canPlay()) return;
  const now=AC.currentTime, dur=0.34;
  /* soft muffled paper turn — lowpass so no harsh highs */
  const buf=AC.createBuffer(1,Math.floor(AC.sampleRate*dur),AC.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++){ const t=i/d.length; d[i]=(Math.random()*2-1)*Math.pow(1-t,2.8)*Math.sin(t*Math.PI); }
  const src=AC.createBufferSource(); src.buffer=buf;
  const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=0.4;
  lp.frequency.setValueAtTime(1100,now); lp.frequency.exponentialRampToValueAtTime(420,now+dur);
  const g=AC.createGain(); g.gain.setValueAtTime(0.0001,now);
  g.gain.exponentialRampToValueAtTime(0.16,now+0.04); g.gain.exponentialRampToValueAtTime(0.0001,now+dur);
  src.connect(lp); lp.connect(g); g.connect(master); src.start(now);
}
/* unlock audio on first user gesture anywhere (browsers block autoplay). No background drone. */
function unlock(){
  initAudio(); if(AC.state==='suspended') AC.resume();
  if(!unlocked){ unlocked=true; if(!muted) sfxNav(); }
}
document.addEventListener('pointerdown', unlock);
const soundBtn=document.getElementById('soundBtn');
soundBtn.textContent='🔊';
soundBtn.addEventListener('click',(e)=>{
  e.stopPropagation();
  initAudio(); if(AC.state==='suspended') AC.resume(); unlocked=true;
  muted=!muted; soundBtn.textContent=muted?'🔇':'🔊';
  if(!muted) sfxNav();
});

/* ================= NAV ================= */
const scrs=document.querySelectorAll('.scr');
function go(name){
  scrs.forEach(s=>s.classList.toggle('on',s.dataset.scr===name));
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('act',a.dataset.go===name));
  sfxNav();
}
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>go(a.dataset.go)));
  try {
    const scr = new URLSearchParams(location.search).get('scr')
    if (scr && ['home','packs','profile'].includes(scr)) go(scr)
  } catch(e) {}

/* ================= INVENTORY ================= */
const items=[
  {g:'⚔',rar:'leg',q:'',name:'Клинок Тихого Пепла',rarName:'Легендарный · оружие',desc:'«Выкован из остывшего сердца павшей звезды. Помнит каждого, кого рассёк.»'},
  {g:'☙',rar:'epic',q:'',name:'Плащ Скитальца',rarName:'Эпический · броня',desc:'«Хранит тепло костров всех дорог, что ты прошёл.»'},
  {g:'⚚',rar:'rare',q:'',name:'Посох Тумана',rarName:'Редкий · артефакт',desc:'«Указывает путь там, где его нет.»'},
  {g:'♆',rar:'',q:'',name:'Ржавый компас',rarName:'Обычный · артефакт',desc:'«Стрелка давно смотрит только на Цитадель.»'},
  {g:'✜',rar:'',q:'3',name:'Обломок реликвии',rarName:'Обычный · ключ',desc:'«Часть чего-то большего. Но чего?»'},
  {g:'☖',rar:'rare',q:'',name:'Печать Дома',rarName:'Редкий · ключ',desc:'«Открывает двери, о которых ты не знал.»'},
  {g:'†',rar:'',q:'5',name:'Пепельная соль',rarName:'Обычный · расходник',desc:'«Отгоняет то, что бродит в ночи.»'},
  {g:'◆',rar:'',q:'2',name:'Осколок звезды',rarName:'Обычный · артефакт',desc:'«Всё ещё тёплый.»'},
  {g:'♨',rar:'',q:'4',name:'Фляга с водой',rarName:'Обычный · расходник',desc:'«Почти пустая. Береги каждый глоток.»'},
  {g:'✦',rar:'epic',q:'',name:'Амулет Трёх Звёзд',rarName:'Эпический · артефакт',desc:'«Тот же герб, что на клинке. Совпадение?»'},
  {g:'❦',rar:'',q:'',name:'Обрывок карты',rarName:'Обычный · ключ',desc:'«Полусгоревший. Виден только путь к мосту.»'},
  {g:'✚',rar:'rare',q:'2',name:'Целебный мох',rarName:'Редкий · расходник',desc:'«Растёт только на пепле. Затягивает раны.»'},
];
const rarColor={leg:'var(--leg)',epic:'var(--epic)',rare:'var(--rare)','':'var(--gold-2)'};
const slotsEl=document.getElementById('slots'), cardEl=document.getElementById('itemCard');
function buildSlots(){
  let h='';
  items.forEach((it,i)=>{ h+=`<div class="slot ${it.rar}" data-i="${i}">${it.g}${it.q?`<span class="q">${it.q}</span>`:''}</div>`; });
  for(let k=0;k<4;k++) h+=`<div class="slot empty">+</div>`;
  slotsEl.innerHTML=h;
  slotsEl.querySelectorAll('.slot[data-i]').forEach(s=>s.addEventListener('click',()=>{ selectItem(+s.dataset.i); }));
}
function selectItem(i){
  const it=items[i], c=rarColor[it.rar];
  slotsEl.querySelectorAll('.slot').forEach(s=>s.classList.remove('sel'));
  slotsEl.querySelector(`.slot[data-i="${i}"]`).classList.add('sel');
  cardEl.innerHTML=`<div class="item-card">
    <div class="ih"><div class="isym" style="border:1px solid ${c};color:${c};box-shadow:0 0 12px -2px ${c}">${it.g}</div>
      <div><div class="inm" style="color:${c}">${it.name}</div><div class="irar" style="color:${c}">${it.rarName}</div></div></div>
    <p class="idesc">${it.desc}</p>
    <div class="iact"><div class="mini-btn solid">Экипировать</div><div class="mini-btn">Осмотреть</div></div></div>`;
  cardEl.querySelectorAll('.mini-btn').forEach(b=>b.addEventListener('click',()=>{ sfxClick(); toast(b.classList.contains('solid')?'Предмет экипирован':'Осмотр…'); }));
  sfxClick();
}
buildSlots(); selectItem(0);
document.querySelectorAll('#screen .tab').forEach(t=>t.addEventListener('click',()=>{
  t.parentElement.querySelectorAll('.tab').forEach(x=>x.classList.remove('on')); t.classList.add('on'); sfxClick();
}));
document.querySelectorAll('#screen .chip').forEach(c=>c.addEventListener('click',()=>{
  c.parentElement.querySelectorAll('.chip').forEach(x=>x.classList.remove('on')); c.classList.add('on'); sfxClick();
}));

/* ================= READER ================= */
const stories={
  fant:{title:'Пепельные земли', cover:'/assets/cover_fantasy.jpg', tag:'Тёмное фэнтези', tagClass:'g-fant',
    synopsis:'Мир истлел до пепла. Ты очнулся среди руин без имени — и Тёмная Цитадель на горизонте зовёт тебя к себе.',
    chapters:8, difficulty:'Тяжёлая', tone:'Мрачный', time:'~15 мин', role:'Скиталец', tags:['выживание','моральный выбор','лор'], rating:'4.8',
    creation:{ headline:'Кто очнулся среди пепла?', sub:'Опиши героя одной фразой — остальное подберёт ИИ.',
      hint:'Напр.: седой наёмник без имени, с холодным клинком и тёплым сердцем',
      roleLabel:'Класс', roles:['Воин','Маг','Плут','Странник'],
      fieldLabel:'Раса', fieldOpts:['Человек','Полукровка','Житель пепла','Неизвестно'] },
    pages:[
    {h:'Королевство Пепельных земель', drop:'Д', text:'ревние хроники лгали — мир не погиб в одночасье. Он умирал медленно, век за веком, пока от цветущих долин Эхокарта не остался лишь серый пепел, что стелется по ветру, будто снег. Ты очнулся среди холодных руин, не помня ни своего имени, ни того, как здесь оказался. В памяти — лишь одно: далёкие шпили Тёмной Цитадели, что зовут тебя к себе.'},
    {kf:'/assets/keyframe_01.jpg', cat:'action', log:'Подобран Клинок Тихого Пепла — три звезды над разбитой короной.', text:'Ты с трудом поднимаешься на ноги. Ветер несёт пепел, забиваясь в горло. Среди обломков рука натыкается на сталь — тёплый клинок, будто им только что рубили. Кто-то вложил его тебе в ладонь, пока ты спал. На лезвии выгравирован герб, которого ты не узнаёшь: три звезды над разбитой короной.'},
    {kf:'/assets/keyframe_02.jpg', cat:'char', log:'Старик-хранитель — ждал того, кто поднимет меч.', text:'«Значит, ты всё-таки проснулся», — раздаётся хриплый голос за спиной. Старик в лохмотьях, лицо изрезано шрамами. Он смотрит не на тебя — только на клинок в твоей руке. «Двадцать лет я ждал того, кто поднимет этот меч. Всё надеялся, что это будет кто-то… посильнее».'},
    {kf:'/assets/cover_fantasy.jpg', cat:'place', log:'Тёмная Цитадель — горит на горизонте вечным пламенем.', text:'Он указывает костлявым пальцем на горизонт, где над горами горит Цитадель — вечным, неугасающим пламенем. «Там начался пепел. Там ему и конец. Дорога одна, странник, да только пройти по ней можно по-разному».'},
    {kf:'/assets/keyframe_03.jpg', text:'Впереди развилка. Слева — тропа к сожжённой деревне, откуда всё ещё тянет дымом и, кажется, доносятся голоса. Справа — древний каменный мост к Цитадели, и по нему медленно движется тёмная фигура тебе навстречу. Старик молчит, ожидая твоего решения.'},
    {choices:[
      'Пойти к деревне — там могут быть выжившие.',
      'Ступить на мост навстречу незнакомцу.',
      'Расспросить старика, кто ты такой.'], branch:'fork'}
  ],
  branches:{
    fork:[
      /* 0 — деревня */[
        {kf:'/assets/keyframe_01.jpg', text:'Ты идёшь на голоса. Деревня догорает: обугленные балки, дым ест глаза. Голоса оказались не людьми — мародёры роются в пепле. И тут из-под рухнувшей стропилины слышится детский плач: кого-то придавило.'},
        {check:{abil:'str', dc:12, prompt:'Поднять обгоревшую балку и вытащить ребёнка.',
          win:[{cat:'char', log:'Спасённый ребёнок — теперь у тебя есть должник в этих землях.', text:'Мышцы рвутся от натуги — балка со скрипом поддаётся. Ты выхватываешь ребёнка за миг до того, как всё обрушивается в сноп искр. Он цепляется за твой плащ и молчит, но смотрит так, будто запомнил тебя навсегда.'}],
          fail:[{text:'Балка не идёт. Ты рвёшь её из последних сил, но пепел под ногами предательски осыпается. Плач стихает. За спиной хрустит гравий — мародёры услышали. Пора решать быстро.'}]}}],
      /* 1 — мост */[
        {kf:'/assets/cover_fantasy.jpg', text:'Ты ступаешь на древний мост. Тёмная фигура ждёт посередине — рыцарь в закопчённых латах, забрало опущено. «Ещё один, кто идёт к Цитадели, — гулко произносит он. — Назад дороги нет. Докажи, что достоин пройти».'},
        {check:{abil:'cha', dc:13, prompt:'Убедить рыцаря пропустить тебя без боя.',
          win:[{cat:'char', log:'Рыцарь моста — пропустил тебя, назвав «носителем клинка».', text:'Ты говоришь тихо, но клинок в твоей руке говорит громче. Рыцарь долго молчит, затем отступает в сторону. «Три звезды над короной… Значит, всё-таки ты. Проходи, носитель. И не оборачивайся».'}],
          fail:[{text:'Слова отскакивают от холодной стали. Рыцарь обнажает меч: «Слова — это дёшево». Придётся пробиваться силой — или отступить к развилке.'}]}}],
      /* 2 — расспросить старика */[
        {kf:'/assets/keyframe_02.jpg', text:'«Кто я такой?» — спрашиваешь ты. Старик усмехается щербатым ртом. «А ты сам вспомни. Клинок помнит руку. Закрой глаза — и увидишь».'},
        {check:{abil:'wis', dc:12, prompt:'Заглянуть в собственную память сквозь туман.',
          win:[{cat:'event', log:'Всплыло имя — Кель. И зал в огне, и корона, что раскололась надвое.', text:'На миг пепел исчезает. Ты видишь зал в огне, корону, что раскалывается надвое, и голос зовёт: «Кель!». Имя обжигает горло. Твоё имя. Старик кивает, будто услышал его вместе с тобой.'}],
          fail:[{text:'Ты тянешься в темноту — и натыкаешься на стену. Висок простреливает болью, пепел возвращается. Ничего. Пока ничего. «Рано, — вздыхает старик. — Дорога сама тебе напомнит».'}]}}]
    ]
  }},
  scifi:{title:'Станция «Кассандра»', cover:'/assets/cover_scifi.jpg', tag:'Хард sci-fi', tagClass:'g-scifi',
    synopsis:'Ты проснулся на 214 лет позже срока. Экипаж исчез, реактор умирает, а ИИ уверяет, что ты — не тот, за кого себя выдаёшь.',
    chapters:9, difficulty:'Обычная', tone:'Напряжённый', time:'~15 мин', role:'«Капитан»', tags:['мистерия','выживание','ИИ'], rating:'4.6',
    creation:{ headline:'Кого разбудила «Кассандра»?', sub:'Опиши, кем ты был до криосна.',
      hint:'Напр.: пилот-контрабандист с чужим именем и имплантом в голове',
      roleLabel:'Профессия', roles:['Капитан','Инженер','Пилот','ИИ-оператор'],
      fieldLabel:'Фракция', fieldOpts:['Флот','Корпорация','Вольные','Без фракции'] },
    pages:[
    {h:'Станция «Кассандра»', drop:'С', text:'истема разбудила тебя на 214 лет позже срока. Экипаж исчез, реактор гудит на 4%, а бортовой ИИ утверждает, что ты — не тот, за кого себя выдаёшь.'},
    {text:'До ближайшего сигнала — восемь часов кислорода. В отсеке мигает красный. Голос ИИ спокоен: «Рада, что вы наконец проснулись, капитан. Или мне называть вас иначе?»'},
    {choices:['Потребовать доступ к бортовому журналу.','Молча идти к реактору.','Спросить ИИ, что случилось с экипажем.']}
  ]},
  hist:{title:'Восстание Спартака', cover:'/assets/cover_history.jpg', tag:'Античность', tagClass:'g-hist',
    synopsis:'Песок арены хранит вчерашнюю кровь. Ты — раб-гладиатор школы Батиата, и сегодня в казарме шепчутся о побеге.',
    chapters:7, difficulty:'Тяжёлая', tone:'Драматичный', time:'~15 мин', role:'Гладиатор', tags:['история','восстание','свобода'], rating:'4.7',
    creation:{ headline:'Кто выйдет на песок арены?', sub:'Опиши, кем ты был до рабства.',
      hint:'Напр.: фракийский пастух, проданный в гладиаторы за долги',
      roleLabel:'Роль', roles:['Гладиатор','Раб','Дезертир','Наёмник'],
      fieldLabel:'Происхождение', fieldOpts:['Фракиец','Галл','Римлянин','Чужеземец'] },
    pages:[
    {h:'Восстание Спартака', drop:'П', text:'есок арены ещё хранит вчерашнюю кровь. Ты — раб-гладиатор школы Батиата, и сегодня в казарме шепчутся о побеге.'},
    {text:'Один неверный взгляд стражи — и всё кончено. Спартак смотрит на тебя через решётку: «Ну что, брат? Жить рабом или умереть свободным?»'},
    {choices:['Присоединиться к заговору.','Выждать и оценить силы.','Выдать заговор ради свободы.']}
  ]},
  post:{title:'После тишины', cover:'/assets/cover_postapoc.jpg', tag:'Пост-апок', tagClass:'g-post',
    synopsis:'Город зарос за двадцать лет. Где-то впереди — первый человеческий звук за долгие дни. Спасение или ловушка?',
    chapters:6, difficulty:'Обычная', tone:'Тревожный', time:'~15 мин', role:'Выживший', tags:['зомби','выживание','атмосфера'], rating:'4.5',
    creation:{ headline:'Кто выжил в мёртвом городе?', sub:'Опиши, кем ты был до тишины.',
      hint:'Напр.: бывший врач, потерявший семью, но не руки',
      roleLabel:'Навык', roles:['Выживший','Мародёр','Врач','Следопыт'],
      fieldLabel:'Убежище', fieldOpts:['Метро','Больница','Крыши','Одиночка'] },
    pages:[
    {h:'После тишины', drop:'Г', text:'ород зарос за двадцать лет. Ты идёшь по бывшему проспекту, где сквозь асфальт пробились деревья, а витрины ослепли от пыли.'},
    {text:'Где-то впереди — звук. Первый человеческий звук за много дней. Он может значить спасение. Или ловушку.'},
    {choices:['Пойти на звук.','Обойти стороной, держась в тени.','Затаиться и ждать темноты.']}
  ]}
};
let curStory='fant', feedIndex=0;
const reader=document.getElementById('reader'), titleEl=document.getElementById('rTitle'),
      chatEl=document.getElementById('chat'), chatFoot=document.getElementById('chatFoot');

function scrollChat(){ chatEl.scrollTop=chatEl.scrollHeight; }
function addMsg(type, inner){
  const d=document.createElement('div'); d.className='msg '+type; d.innerHTML=inner;
  chatEl.appendChild(d); requestAnimationFrame(scrollChat); return d;
}
function beatInner(p){
  let h='';
  if(p.h) h+='<div class="msg-h">'+p.h+'</div>';
  if(p.kf) h+='<div class="kf"><img src="'+p.kf+'" onerror="this.parentElement.classList.add(\'noimg\');this.style.display=\'none\'"><div class="lbl">иллюстрация</div></div>';
  if(p.drop) h+='<p><span class="dropc">'+p.drop+'</span>'+p.text+'</p>';
  else if(p.text) h+='<p>'+p.text+'</p>';
  return h;
}
function renderContinue(){
  chatFoot.innerHTML='<button class="cont-btn" id="contBtn">Продолжить ↓</button>';
  chatFoot.querySelector('#contBtn').addEventListener('click',()=>{ sfxPage(); advance(); });
}
let queue=[];   // очередь предстоящих битов истории (позволяет ветвиться)
function renderChoices(p){
  let h='<div class="choice-q">Что ты сделаешь?</div>';
  p.choices.forEach((c,i)=>{ h+='<button class="choice" data-c="'+i+'">'+c+'</button>'; });
  chatFoot.innerHTML=h;
  chatFoot.querySelectorAll('.choice').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.c, txt=b.textContent.trim();
    addMsg('player', txt);
    journal.push({cat:'action', tx:'Выбор: '+txt});
    sfxClick(); chatFoot.innerHTML='';
    // бит выбора мог остаться в очереди (показан через peek) — убираем, чтобы не всплыл повторно
    const at=queue.indexOf(p); if(at>=0) queue.splice(at,1);
    // подставляем ветку выбора в начало очереди
    const br=p.branch && stories[curStory].branches ? stories[curStory].branches[p.branch] : null;
    if(br && br[i]) queue=br[i].concat(queue);
    setTimeout(advance, 400);
  }));
  scrollChat();
}
// встроенная в историю проверка: кнопка «Бросить», исход ветвит рассказ
function renderCheck(p){
  const a=ABIL.find(x=>x.k===p.check.abil);
  chatFoot.innerHTML='<div class="choice-q">Проверка · '+a.name+' '+fmtMod(a.mod)+' · порог '+p.check.dc+'</div>'+
    '<div class="chk-lead">'+p.check.prompt+'</div>'+
    '<button class="choice roll-btn" id="doCheck">Бросить кубик ⚄</button>';
  chatFoot.querySelector('#doCheck').addEventListener('click',()=>{
    chatFoot.innerHTML=''; sfxClick();
    doRoll(a, p.check.dc, (ok)=>{
      const follow=(ok?p.check.win:p.check.fail)||[];
      queue=follow.concat(queue);
      setTimeout(()=>renderContinue(), 700);
    });
  });
  scrollChat();
}
function renderEnd(){ chatFoot.innerHTML='<div class="chat-end">✦ Конец демо-главы · дальше историю продолжит ИИ</div>'; }
function advance(){
  const p=queue.shift();
  if(!p){ renderEnd(); return; }
  if(p.choices){ renderChoices(p); return; }
  if(p.check){ renderCheck(p); return; }
  if(p.log){ journal.push({cat:p.cat||'event', tx:p.log}); }
  addMsg('nar', beatInner(p));
  const nx=queue[0];
  if(!nx){ renderEnd(); }
  else if(nx.choices){ renderChoices(nx); }
  else if(nx.check){ renderContinue(); }
  else { renderContinue(); }
}
/* ===== СОЗДАНИЕ ГЕРОЯ ===== */
const PACK_ACC={fant:'#d9a94a', scifi:'#54e6d0', hist:'#c9a865', post:'#9bbf3a'};
let crKey='fant', crStats=[];
function rollStat(){ // 3d6-подобно, мод из значения
  const v=8+Math.floor(Math.random()*11); // 8..18
  return {v, m:Math.floor((v-10)/2)};
}
function crRenderStats(bump){
  const el=document.getElementById('crStats'); if(!el) return;
  el.innerHTML=ABIL.map((a,i)=>{
    const st=crStats[i];
    return '<div class="cr-stat'+(bump?' bump':'')+'"><div class="k">'+a.k.toUpperCase()+'</div>'+
      '<div class="v">'+st.v+'</div><div class="m">'+fmtMod(st.m)+'</div></div>';
  }).join('');
  if(bump) setTimeout(()=>el.querySelectorAll('.cr-stat').forEach(x=>x.classList.remove('bump')),320);
}
function crReroll(){ crStats=ABIL.map(()=>rollStat()); crRenderStats(true); sfxClick(); }
let crRole=null;
function openCreator(key){
  crKey=key;
  const cr=document.getElementById('creator'), c=stories[key].creation||{};
  cr.style.setProperty('--acc', PACK_ACC[key]||'#d9a94a');
  document.getElementById('crWorld').textContent=stories[key].title;
  // заголовок и подсказка из мира
  cr.querySelector('.cr-h').textContent=c.headline||'Кто ты в этом мире?';
  cr.querySelector('.cr-sub').textContent=c.sub||'Опиши героя одной фразой — остальное подберёт ИИ.';
  document.getElementById('crPrompt').placeholder=c.hint||'Опиши своего героя';
  // роли-чипы
  document.getElementById('crRoleLabel').textContent=c.roleLabel||'Класс';
  const roles=document.getElementById('crRoles'); crRole=null;
  roles.innerHTML=(c.roles||[]).map((r,i)=>'<button class="cr-role'+(i===0?' on':'')+'" data-r="'+r+'">'+r+'</button>').join('');
  crRole=(c.roles||[])[0]||null;
  roles.querySelectorAll('.cr-role').forEach(b=>b.addEventListener('click',()=>{
    roles.querySelectorAll('.cr-role').forEach(x=>x.classList.remove('on')); b.classList.add('on');
    crRole=b.dataset.r; sfxClick();
  }));
  // тематическое поле
  document.getElementById('crFieldLabel').textContent=c.fieldLabel||'Происхождение';
  document.getElementById('crField').innerHTML=(c.fieldOpts||['—']).map(o=>'<option>'+o+'</option>').join('');
  document.getElementById('crName').value='';
  document.getElementById('crBio').value='';
  document.getElementById('crPrompt').value='';
  crReroll();
  cr.classList.add('on'); document.getElementById('nav').style.display='none'; sfxNav();
}
function closeCreator(){ document.getElementById('creator').classList.remove('on'); document.getElementById('nav').style.display=''; }
/* мокап генерации: заполняем поля по промту (реальную модель подключим на бэкенде) */
const GEN_NAMES=['Кель','Ворон','Сайла','Древ','Мирра','Аскет','Тень','Ольвен'];
function crGenerate(){
  const btn=document.getElementById('crGen'); btn.classList.add('busy'); btn.textContent='✦ Генерирую…'; sfxClick();
  setTimeout(()=>{
    const prompt=document.getElementById('crPrompt').value.trim();
    document.getElementById('crName').value=GEN_NAMES[Math.floor(Math.random()*GEN_NAMES.length)];
    const roleTxt = crRole ? crRole.toLowerCase()+', ' : '';
    document.getElementById('crBio').value = prompt
      ? prompt.charAt(0).toUpperCase()+prompt.slice(1)+'. '+(crRole?crRole+' по призванию.':'')
      : 'По роду — '+roleTxt+'но прошлое скрыто в тумане. Каждый выбор пишет, кем он станет.';
    crReroll();
    // «портрет обновился»
    const pt=document.getElementById('crPortrait'); pt.style.opacity=.3;
    setTimeout(()=>{ pt.style.transition='opacity .5s'; pt.style.opacity=1; },350);
    btn.classList.remove('busy'); btn.textContent='✦ Сгенерировать заново';
  }, 900);
}
(function(){
  const cr=document.getElementById('creator'); if(!cr) return;
  document.getElementById('crBack').addEventListener('click',()=>{ closeCreator(); sfxClick(); });
  document.getElementById('crReroll').addEventListener('click', crReroll);
  document.getElementById('crGen').addEventListener('click', crGenerate);
  cr.querySelectorAll('.cr-pbtns button').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.p==='gen') crGenerate(); else toast('Загрузка портрета — на бэкенде');
    sfxClick();
  }));
  document.getElementById('crGo').addEventListener('click',()=>{
    const name=document.getElementById('crName').value.trim()||'Безымянный';
    CHAR.name=name;
    CHAR.role=crRole;
    // переносим характеристики создания в лист персонажа
    ABIL.forEach((a,i)=>{ a.mod=crStats[i].m; });
    closeCreator();
    setTimeout(()=>openReader(crKey), 240);
    sfxClick();
  });
})();

function openReader(key){
  curStory=key; feedIndex=0; queue=stories[key].pages.slice(); titleEl.textContent=stories[key].title;
  document.getElementById('drawerTitle').textContent=stories[key].title;
  journal=[]; loggedPages=new Set();
  journal.push({cat:'event', tx:'История начата: '+stories[key].title});
  chatEl.innerHTML=''; chatFoot.innerHTML='';
  reader.classList.add('on'); document.getElementById('nav').style.display='none';
  renderCPanel(); reader.classList.add('cp-open');
  advance(); sfxNav();
}
function closeReader(){ reader.classList.remove('on'); document.getElementById('nav').style.display=''; sfxClick(); }
/* open a scenario card (bottom-sheet) instead of jumping straight into reading */
document.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>openScenario(el.dataset.open)));

/* ================= SCENARIO MODAL · SHEETS · DRAWER ================= */
let journal=[], loggedPages=new Set();
const scrim=document.getElementById('scrim'), sheet=document.getElementById('sheet'), sheetBody=document.getElementById('sheetBody');
const drawer=document.getElementById('drawer'), dScrim=document.getElementById('dScrim');

function openSheet(html){ sheetBody.innerHTML=html; sheetBody.scrollTop=0; scrim.classList.add('on'); sheet.classList.add('on'); }
function closeSheet(){ scrim.classList.remove('on'); sheet.classList.remove('on'); }
scrim.addEventListener('click',closeSheet);
/* drag the grip down to dismiss */
(function(){ const grip=sheet.querySelector('.sheet-grip'); let y0=0,dy=0,on=false;
  const down=e=>{on=true;y0=(e.touches?e.touches[0].clientY:e.clientY);dy=0;sheet.style.transition='none';};
  const move=e=>{if(!on)return;const y=(e.touches?e.touches[0].clientY:e.clientY);dy=Math.max(0,y-y0);sheet.style.transform='translateY('+dy+'px)';};
  const up=()=>{if(!on)return;on=false;sheet.style.transition='';sheet.style.transform='';if(dy>100)closeSheet();};
  grip.addEventListener('mousedown',down); grip.addEventListener('touchstart',down,{passive:true});
  window.addEventListener('mousemove',move); window.addEventListener('touchmove',move,{passive:true});
  window.addEventListener('mouseup',up); window.addEventListener('touchend',up);
})();

function openDrawer(){ dScrim.classList.add('on'); drawer.classList.add('on'); }
function closeDrawer(){ dScrim.classList.remove('on'); drawer.classList.remove('on'); }
dScrim.addEventListener('click',closeDrawer);
document.getElementById('rMenu').addEventListener('click',()=>{ openDrawer(); sfxClick(); });
/* swipe from left edge (only inside reader) opens the drawer */
(function(){ let x0=0,on=false;
  document.addEventListener('touchstart',e=>{ if(!reader.classList.contains('on'))return; if(e.touches[0].clientX<26){x0=e.touches[0].clientX;on=true;} },{passive:true});
  document.addEventListener('touchmove',e=>{ if(on && e.touches[0].clientX-x0>50){on=false;openDrawer();} },{passive:true});
  document.addEventListener('touchend',()=>{on=false;});
})();
drawer.querySelectorAll('a[data-tool]').forEach(a=>a.addEventListener('click',()=>{
  const t=a.dataset.tool; closeDrawer(); sfxClick();
  if(t==='exit'){ setTimeout(closeReader,160); } else { setTimeout(()=>openTool(t),200); }
}));
/* floating quick-access icons in the reader (protruding, safe-area aware) */
document.querySelectorAll('.rq[data-tool]').forEach(b=>b.addEventListener('click',()=>{ openTool(b.dataset.tool); sfxClick(); }));

/* --- scenario card --- */
function scenarioHTML(k){ const s=stories[k];
  const cell=(ic,l,v)=>`<div><span class="ic">${ic}</span><span>${l}</span><b>${v}</b></div>`;
  return `<div class="sc-cover ornate"><img src="${s.cover}" onerror="this.parentElement.classList.add('noimg');this.style.display='none'"><span class="sc-tag ${s.tagClass}">${s.tag}</span></div>
    <h2 class="sc-title">${s.title}</h2>
    <p class="sc-syn">${s.synopsis}</p>
    <div class="gthread"></div>
    <div class="sc-grid">${cell('❦','Глав',s.chapters)}${cell('⚔','Сложность',s.difficulty)}${cell('☾','Тон',s.tone)}${cell('⧗','Время',s.time)}${cell('☗','Роль',s.role)}${cell('★','Рейтинг',s.rating)}</div>
    <div class="sc-tags">${s.tags.map(t=>`<span>#${t}</span>`).join('')}</div>
    <button class="rbtn solid sc-start" data-start="${k}">Начать историю ⚔</button>`;
}
function openScenario(k){ openSheet(scenarioHTML(k)); sfxClick();
  const b=sheetBody.querySelector('.sc-start'); if(b) b.addEventListener('click',()=>{ closeSheet(); setTimeout(()=>openCreator(b.dataset.start),240); });
}

/* --- tools as sheets --- */
function openTool(t){
  if(t==='inventory'){ openSheet('<div class="sheet-title">Инвентарь</div><div id="invWrap"></div>'); renderInv(); }
  else if(t==='journal'){ openSheet('<div class="sheet-title">Журнал</div><div id="jwrap"></div>'); renderJournal(); }
  else if(t==='character'){ openSheet('<div class="sheet-title">Персонаж</div>'+charHTML()); }
  else if(t==='check'){ openSheet('<div class="sheet-title">Проверка навыка</div>'+checkHTML()); wireCheckSheet(); }
  else if(t==='settings'){ openSheet('<div class="sheet-title">Настройки сценария</div>'+settingsHTML()); wireSettingsSheet(); }
}

/* ---- INVENTORY: slot limit + pagination + rectangular cells + labels + qty ---- */
const INV_LIMIT=24, INV_PER_PAGE=12; let invPage=0, invSel=0;
function renderInv(){
  const w=sheetBody.querySelector('#invWrap'); if(!w) return;
  const pages=Math.ceil(INV_LIMIT/INV_PER_PAGE);
  invPage=Math.max(0,Math.min(invPage,pages-1));
  let cells='';
  for(let s=0;s<INV_PER_PAGE;s++){ const idx=invPage*INV_PER_PAGE+s;
    if(idx>=INV_LIMIT){ continue; }
    if(idx<items.length){ const it=items[idx];
      cells+='<div class="inv-cw"><div class="inv-cell '+it.rar+'" data-i="'+idx+'">'+it.g+(it.q?'<span class="qty">×'+it.q+'</span>':'')+'</div><div class="inv-lbl">'+it.name+'</div></div>';
    } else {
      cells+='<div class="inv-cw"><div class="inv-cell empty">+</div><div class="inv-lbl">&nbsp;</div></div>';
    }
  }
  w.innerHTML='<div class="inv-head"><div class="inv-count">Занято <b>'+items.length+'</b> / '+INV_LIMIT+' слотов</div>'
    +'<div class="inv-pager"><button class="pg-btn" data-pg="-1">‹</button><span>'+(invPage+1)+' / '+pages+'</span><button class="pg-btn" data-pg="1">›</button></div></div>'
    +'<div class="inv-grid">'+cells+'</div><div id="shItem" style="margin-top:14px"></div>';
  w.querySelectorAll('.inv-cell[data-i]').forEach(c=>c.addEventListener('click',()=>{ invSel=+c.dataset.i; selInv(); sfxClick(); }));
  w.querySelectorAll('.pg-btn').forEach(b=>b.addEventListener('click',()=>{ invPage+=(+b.dataset.pg); renderInv(); sfxClick(); }));
  selInv();
}
function selInv(){
  const card=sheetBody.querySelector('#shItem'); if(!card) return;
  sheetBody.querySelectorAll('.inv-cell').forEach(x=>x.classList.remove('sel'));
  const cell=sheetBody.querySelector('.inv-cell[data-i="'+invSel+'"]');
  if(!cell){ card.innerHTML='<p class="idesc" style="text-align:center;opacity:.6">Выбери предмет на этой странице.</p>'; return; }
  cell.classList.add('sel');
  const it=items[invSel], c=rarColor[it.rar];
  card.innerHTML='<div class="item-card"><div class="ih"><div class="isym" style="border:1px solid '+c+';color:'+c+';box-shadow:0 0 12px -2px '+c+'">'+it.g+'</div>'
    +'<div><div class="inm" style="color:'+c+'">'+it.name+(it.q?' ×'+it.q:'')+'</div><div class="irar" style="color:'+c+'">'+it.rarName+'</div></div></div>'
    +'<p class="idesc">'+it.desc+'</p>'
    +'<div class="iact"><div class="mini-btn solid">В диалог →</div><div class="mini-btn">Осмотреть</div></div></div>';
  const bAdd=card.querySelector('.mini-btn.solid'), bLook=card.querySelector('.mini-btn:not(.solid)');
  if(bAdd) bAdd.addEventListener('click',()=>itemToChat(invSel));
  if(bLook) bLook.addEventListener('click',()=>{ sfxClick(); toast(items[invSel].rarName); });
}
/* --- click item -> inject into the chat context (mockup of add-to-dialog) --- */
function itemReaction(it){
  const map={
    'Клинок Тихого Пепла':'Ты обнажаешь клинок — по лезвию пробегает тусклый отблеск, будто оно узнаёт эти руины. Старик отступает на шаг: «Значит, он всё-таки выбрал тебя».',
    'Амулет Трёх Звёзд':'Ты показываешь амулет. Глаза старика вспыхивают: «Откуда он у тебя?! Этот герб был на знамёнах Цитадели ещё до пепла».',
    'Целебный мох':'Ты прикладываешь мох к ссадине — боль отступает, кожа стягивается прохладой.',
    'Обрывок карты':'Ты разворачиваешь обгоревший клочок. Сквозь копоть проступает лишь одна линия — путь к каменному мосту.'
  };
  return map[it.name] || ('Ты достаёшь «'+it.name+'». Мир будто на миг замирает, отмечая твой жест — и ждёт, что будет дальше.');
}
function itemToChat(i){
  if(!reader.classList.contains('on')) return;
  const it=items[i]; closeSheet();
  setTimeout(()=>{
    addMsg('ctx','🎒 В диалог добавлено: <b>'+it.name+'</b>');
    journal.push({cat:'action', tx:'Достаёт из инвентаря: '+it.name});
    setTimeout(()=>addMsg('nar','<p>'+itemReaction(it)+'</p>'),650);
  },240);
}
function journalToChat(i){
  if(!reader.classList.contains('on')) return;
  const e=journal[i]; closeSheet();
  setTimeout(()=>{
    addMsg('ctx','📜 В диалог добавлено из журнала: <b>'+esc(e.tx)+'</b>');
    setTimeout(()=>addMsg('nar','<p>Ты сверяешься с записью в журнале — детали складываются в цельную картину, и рассказ обретает новую нить.</p>'),650);
  },240);
}

/* ---- JOURNAL by categories (horizontal tabs) ---- */
const JCAT_LABEL={char:'Персонажи',event:'События',action:'Действия',place:'Места'};
const JCAT_ORDER=['char','event','action','place'];
let jopen={char:true,event:true,action:false,place:false};
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function renderJournal(){
  const w=sheetBody.querySelector('#jwrap'); if(!w) return;
  let h='<div class="jhint">✎ Записи можно редактировать — мир доверяет твоему журналу.</div>';
  JCAT_ORDER.forEach(key=>{
    const idxs=journal.map((e,i)=>i).filter(i=>journal[i].cat===key);
    h+='<div class="jsec'+(jopen[key]?' open':'')+'"><div class="jsec-h" data-k="'+key+'">'
      +'<span class="jcar">▸</span><span class="jsec-t '+ 'dot-'+key +'">'+JCAT_LABEL[key]+'</span><span class="jsec-n">'+idxs.length+'</span></div>'
      +'<div class="jsec-b">';
    if(!idxs.length) h+='<div class="jempty">— пусто —</div>';
    idxs.forEach(i=>{ h+='<div class="jitem" data-i="'+i+'"><div class="jtx">'+esc(journal[i].tx)+'</div>'
      +'<button class="jchat" data-i="'+i+'" title="В диалог">➦</button>'
      +'<button class="jedit" data-i="'+i+'" title="Редактировать">✎</button></div>'; });
    h+='</div></div>';
  });
  w.innerHTML=h;
  w.querySelectorAll('.jsec-h').forEach(hh=>hh.addEventListener('click',()=>{ jopen[hh.dataset.k]=!jopen[hh.dataset.k]; renderJournal(); sfxClick(); }));
  w.querySelectorAll('.jedit').forEach(b=>b.addEventListener('click',ev=>{ ev.stopPropagation(); startJEdit(+b.dataset.i); }));
  w.querySelectorAll('.jchat').forEach(b=>b.addEventListener('click',ev=>{ ev.stopPropagation(); journalToChat(+b.dataset.i); }));
}
function startJEdit(i){
  const w=sheetBody.querySelector('#jwrap'); const item=w.querySelector('.jitem[data-i="'+i+'"]'); if(!item) return;
  item.classList.add('editing');
  item.innerHTML='<textarea class="jta">'+esc(journal[i].tx)+'</textarea><div class="jact"><button class="jsave">Сохранить</button><button class="jcancel">Отмена</button></div>';
  const ta=item.querySelector('.jta'); ta.focus(); ta.setSelectionRange(ta.value.length,ta.value.length);
  item.querySelector('.jsave').addEventListener('click',()=>{ const v=ta.value.trim(); if(v) journal[i].tx=v; sfxClick(); toast('Запись изменена ✎'); renderJournal(); });
  item.querySelector('.jcancel').addEventListener('click',()=>{ sfxClick(); renderJournal(); });
}
/* ===== ПРАВЫЙ ЛИСТ ПЕРСОНАЖА ===== */
const CHAR={ name:'Безымянный', hp:31, hpMax:38, ac:14, speed:30, xpNow:6, xpMax:10 };
function renderCPanel(){
  const el=document.getElementById('cpanelIn'); if(!el) return;
  const role=stories[curStory] ? stories[curStory].role : 'Скиталец';
  const hpPct=Math.round(CHAR.hp/CHAR.hpMax*100), xpPct=Math.round(CHAR.xpNow/CHAR.xpMax*100);
  const lvl=7;
  const statCell=a=>'<div class="cp-stat"><div class="k">'+a.k.toUpperCase()+'</div>'+
    '<div class="v">'+(10+a.mod*2)+'</div><div class="m">'+fmtMod(a.mod)+'</div></div>';
  el.innerHTML=
    '<div class="cp-hero"><div class="cp-ava"><img src="/assets/avatar.jpg"></div>'+
      '<div><div class="cp-nm">'+CHAR.name+'</div><div class="cp-cls">'+role+' · ур. '+lvl+'</div></div></div>'+
    '<div class="cp-bar-l"><span>Здоровье</span><span>'+CHAR.hp+' / '+CHAR.hpMax+'</span></div>'+
    '<div class="cp-bar"><i style="width:'+hpPct+'%"></i></div>'+
    '<div class="cp-bar-l"><span>Опыт</span><span>ур. '+lvl+'</span></div>'+
    '<div class="cp-bar cp-xp"><i style="width:'+xpPct+'%"></i></div>'+
    '<div class="cp-top3"><div><b>'+CHAR.ac+'</b><span>Защита</span></div>'+
      '<div><b>'+CHAR.speed+'</b><span>Скорость</span></div><div><b>'+lvl+'</b><span>Уровень</span></div></div>'+
    '<div class="cp-hd">Характеристики</div>'+
    '<div class="cp-stats">'+ABIL.map(statCell).join('')+'</div>'+
    '<div class="cp-quick">'+
      '<button data-tool="inventory">☙ Инвентарь</button>'+
      '<button data-tool="journal">✒ Журнал</button>'+
      '<button data-tool="check">⚄ Проверка</button>'+
      '<button data-tool="settings">⚙ Сценарий</button></div>'+
    '<button class="cp-full" data-tool="character">Полный лист персонажа</button>';
  el.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{ openTool(b.dataset.tool); sfxClick(); }));
}
// сворачивание панели
(function(){
  const t=document.getElementById('cpToggle'), pnl=document.getElementById('cpanel'), rdr=document.getElementById('reader');
  if(t&&pnl) t.addEventListener('click',()=>{
    const collapsed=pnl.classList.toggle('collapsed');
    rdr.classList.toggle('cp-open', !collapsed);
    sfxClick();
  });
})();

/* ===== ПРОВЕРКА НАВЫКА: свой бросок d20 ===== */
// упрощённый набор характеристик героя (модификаторы уже посчитаны)
const ABIL=[
  {k:'str',name:'Сила',mod:0},{k:'dex',name:'Ловкость',mod:3},{k:'con',name:'Телосложение',mod:0},
  {k:'int',name:'Разум',mod:1},{k:'wis',name:'Мудрость',mod:1},{k:'cha',name:'Харизма',mod:4}
];
const fmtMod=m=>(m>=0?'+':'')+m;
function checkHTML(){
  return '<p class="sc-syn" style="margin:0 0 4px">Выбери характеристику — брошу d20 и добавлю модификатор.</p>'+
    '<div class="chk-grid">'+ABIL.map(a=>'<button class="chk" data-k="'+a.k+'">'+a.name+' <b>'+fmtMod(a.mod)+'</b></button>').join('')+'</div>';
}
function wireCheckSheet(){
  sheetBody.querySelectorAll('.chk').forEach(b=>b.addEventListener('click',()=>{
    const a=ABIL.find(x=>x.k===b.dataset.k);
    closeSheet(); sfxClick(); setTimeout(()=>rollCheck(a),220);
  }));
}
function dieSVG(n){
  // гранёный d20: внешний шестиугольник + внутренние грани + верхняя грань с числом
  return '<svg viewBox="0 0 100 100">'+
    '<polygon class="fa edge" points="50,4 12,26 26,64"/>'+
    '<polygon class="fb edge" points="50,4 88,26 74,64"/>'+
    '<polygon class="fc edge" points="12,26 12,74 26,64"/>'+
    '<polygon class="fc edge" points="88,26 88,74 74,64"/>'+
    '<polygon class="fa edge" points="12,74 50,96 26,64"/>'+
    '<polygon class="fb edge" points="88,74 50,96 74,64"/>'+
    '<polygon class="fa edge" points="26,64 74,64 50,96"/>'+
    '<polygon class="top edge" points="50,4 74,64 26,64"/>'+
    '<text class="num" x="50" y="46">'+n+'</text></svg>';
}
// общий бросок d20: рисует карточку, анимирует, зовёт done(успех,итог,label)
function doRoll(a, dc, done){
  const card=addMsg('roll',
    '<div class="roll-hd">Проверка · '+a.name+'</div>'+
    '<div class="roll-sub">Порог сложности '+dc+'</div>'+
    '<div class="die spin" id="rollDie">'+dieSVG(20)+'</div>'+
    '<div class="roll-calc" id="rollCalc">&nbsp;</div>');
  const die=card.querySelector('#rollDie'); sfxRoll();
  // прокрутка случайных чисел, затем остановка
  let ticks=0; const spin=setInterval(()=>{
    die.querySelector('.num').textContent=1+Math.floor(Math.random()*20);
    if(++ticks>13){ clearInterval(spin); land(); }
  },70);
  function land(){
    const roll=1+Math.floor(Math.random()*20), total=roll+a.mod;
    die.classList.remove('spin'); die.classList.add('land','flash');
    setTimeout(()=>die.classList.remove('flash'),700);
    die.querySelector('.num').textContent=roll;
    let cls='fail',label='Провал';
    if(roll===20){cls='crit';label='Критический успех!';}
    else if(roll===1){cls='crit-fail';label='Критический провал';}
    else if(total>=dc){cls='win';label='Успех';}
    sfxClick();
    card.querySelector('#rollCalc').innerHTML=
      'd20 <b>'+roll+'</b> '+fmtMod(a.mod)+' ('+a.name+')'+
      '<div class="roll-total">'+total+'</div>'+
      '<div class="roll-out '+cls+'">'+label+'</div>';
    scrollChat();
    journal.push({cat:'action', tx:'Проверка '+a.name+': '+total+' ('+label+')'});
    if(done) done(cls==='win'||cls==='crit', total, label);
  }
}
// бросок из инструмента (без сюжета): порог 13, свободная проверка
function rollCheck(a){ doRoll(a, 13, null); }

function charHTML(){ const prog=Math.min(100,Math.round(feedIndex/stories[curStory].pages.length*100)), dec=journal.filter(e=>e.cat==='action').length;
  return '<div class="inv-hero" style="margin-bottom:14px"><div class="portrait"><img src="/assets/avatar.jpg" onerror="this.style.display=\'none\'"></div><div><div class="nm">Безымянный</div><div class="cls">'+stories[curStory].role+' · ур. 7</div></div></div>'
    +'<div class="stats"><div class="stat"><b>'+prog+'%</b><span>прогресс</span></div><div class="stat"><b>'+dec+'</b><span>решений</span></div><div class="stat"><b>248</b><span>золота</span></div></div>'
    +'<p class="sc-syn" style="margin-top:14px">«Ты очнулся без имени. Каждый выбор пишет, кем ты станешь».</p>';
}
function settingsHTML(){ const seg=(label,key,opts,c)=>'<div class="set-group"><div class="lh">'+label+'</div><div class="set-seg" data-seg="'+key+'">'+opts.map(o=>'<button data-v="'+o[0]+'" class="'+(o[0]===c?'on':'')+'">'+o[1]+'</button>').join('')+'</div></div>';
  return seg('Тон повествования','tone',[['dark','Мрачный'],['heroic','Героический'],['ironic','Ироничный']],'dark')
    + seg('Сложность','diff',[['easy','Лёгкая'],['normal','Обычная'],['hard','Тяжёлая']],'hard')
    + seg('Появление реплик','pace',[['calm','Спокойно'],['fast','Быстро']],'calm')
    + '<div class="set-group"><div class="lh">Прочее</div><p class="sc-syn" style="margin:0">Звук — кнопка 🔊 вверху. Прогресс сохраняется автоматически.</p></div>';
}
function wireSettingsSheet(){ sheetBody.querySelectorAll('.set-seg').forEach(sg=>{
  sg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    sg.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); sfxClick();
  }));
});}

/* toast */
let toastT=null; const toastEl=document.getElementById('toast');
function toast(msg){ toastEl.textContent=msg; toastEl.classList.add('on'); clearTimeout(toastT);
  toastT=setTimeout(()=>toastEl.classList.remove('on'),1800); }

/* ================= PWA (service worker + install) ================= */
const pwaState=document.getElementById('pwaState');
const installBtn=document.getElementById('installBtn');
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

if(false /* SW отключён в Nuxt */ && 'serviceWorker' in navigator){
  /* reload once when a new service worker takes over, so a redeploy is never
     stuck behind an old cached build. Guard prevents a reload loop; the
     controller check skips the very first install. */
  const hadController=!!navigator.serviceWorker.controller;
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController || reloading) return;
    reloading=true; location.reload();
  });
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js')
      .then((reg)=>{
        reg.update();
        setInterval(()=>reg.update(), 60*60*1000);
        if(pwaState && !standalone) pwaState.textContent='✓ офлайн-режим готов';
      })
      .catch(()=>{ if(pwaState) pwaState.textContent='⚠ SW недоступен (нужен http/https, не file://)'; });
  });
} else if(pwaState){ pwaState.textContent='⚠ этот браузер не поддерживает PWA'; }

let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault(); deferredPrompt=e;
  if(installBtn) installBtn.style.display='';
  if(pwaState) pwaState.textContent='📲 приложение можно установить';
});
async function doInstall(){
  if(!deferredPrompt){ toast('Установка: меню браузера → «Установить приложение»'); return; }
  deferredPrompt.prompt();
  const {outcome}=await deferredPrompt.userChoice;
  deferredPrompt=null; if(installBtn) installBtn.style.display='none';
  toast(outcome==='accepted'?'Устанавливаем…':'Установка отменена');
}
if(installBtn) installBtn.addEventListener('click',(e)=>{ e.stopPropagation(); doInstall(); });
window.addEventListener('appinstalled',()=>{ if(pwaState) pwaState.textContent='✓ установлено'; if(installBtn) installBtn.style.display='none'; });
if(standalone && pwaState) pwaState.textContent='✓ запущено как приложение';

})
</script>
