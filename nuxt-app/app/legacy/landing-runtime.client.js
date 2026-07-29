import { gsap } from 'gsap'

export function mountLandingRuntime(root) {
  
  const context = gsap.context(() => {

root?.classList.add('js');

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
if(dust) for(let i=0;i<34;i++){
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

/* ===== живой геймплей: та же сцена и те же реплики, что в /app ===== */
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


/* обложки миров: видео играет всегда, пока карточка в поле зрения */
(() => {
  const calmMo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const load = (v) => {
    if (!v.dataset.done) {
      v.dataset.done = '1';
      v.src = v.dataset.src;
      v.addEventListener('canplay', () => { v.classList.add('ready'); v.play().catch(()=>{}); }, { once:true });
      v.load();
    } else { v.play().catch(()=>{}); }
  };
  const vids = [...document.querySelectorAll('.cv-vid')];
  // экономия трафика: при включённом «экономия данных» видео не грузим, остаётся постер
  const saveData = navigator.connection && navigator.connection.saveData;
  if (calmMo || saveData) return;
  if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }
  let visible = new Set();
  const io = new IntersectionObserver((es) => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { visible.add(v); if (!document.hidden) load(v); }
    else { visible.delete(v); v.pause(); }             // за экраном пауза
  }), { threshold:.15 });
  vids.forEach(v => io.observe(v));
  // вкладка ушла в фон — глушим всё; вернулась — оживляем только видимое
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) vids.forEach(v => v.pause());
    else visible.forEach(load);
  });
})();

/* nav state + scroll progress + hero parallax */
const nav=document.getElementById('nav'), prog=document.getElementById('prog'), heroBg=document.getElementById('heroBg');
const heroParallax = heroBg ? gsap.quickTo(heroBg, 'y', { duration: 0.45, ease: 'power2.out' }) : null;
const isTouch=matchMedia('(hover:none)').matches;
let ticking=false;
function onScroll(){
  const y=window.scrollY;
  nav.classList.toggle('scrolled', y>40);
  const max=document.body.scrollHeight-innerHeight;
  prog.style.width=(max>0?(y/max*100):0)+'%';
  if(heroBg && !isTouch && y<innerHeight*1.2) heroParallax?.(y * 0.28);
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
if(!calmMotion) tryVideo(document.getElementById('heroVideo'),'/assets/hero_landing.mp4', true);
/* the closing block sits at the bottom — don't spend bandwidth on it until it's near */
(function(){
  const cta=document.getElementById('ctaVideo'), host=document.getElementById('final');
  if(!cta||!host) return;
  if(calmMotion){ cta.remove(); return; }
  let done=false;
  const load=()=>{ if(done) return; done=true; tryVideo(cta,'/assets/cta_loop.mp4'); };
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
    navigator.serviceWorker.register('/sw.js').then(reg=>{
      reg.update();
      setInterval(()=>reg.update(), 60*60*1000);   // pick up deploys during long sessions
    }).catch(()=>{});
  });
}

if(/[?&]edit\b/.test(location.search)){var e=document.createElement('script');e.src='edit.js?'+Date.now();document.body.appendChild(e);}
  }, root)
  return () => context.revert()
}
