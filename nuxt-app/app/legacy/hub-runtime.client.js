

export function mountHubRuntime(root) {
  
  

/* ================= SOUND (Web Audio) ================= */
let AC=null, master=null, ambGain=null, ambOsc=[], unlocked=false, muted=false;
function initAudio(){
  if(AC) return;
  AC=new (window.AudioContext||window.webkitAudioContext)();
  master=AC.createGain(); master.gain.value=0.9; master.connect(AC.destination);
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
function sfxClick(){ blip(1300,0.05,'triangle',0.22); blip(2600,0.03,'sine',0.09); }
function sfxRoll(){ for(let i=0;i<6;i++) setTimeout(()=>blip(300+Math.random()*500,0.03,'square',0.06),i*70); }
function sfxNav(){ blip(560,0.09,'sine',0.24); setTimeout(()=>blip(840,0.10,'sine',0.17),55); }
function sfxPage(){
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
    chapters:8, difficulty:'Тяжёлая', tone:'Мрачный', time:'~15 мин', role:'Скиталец', tags:['выживание','моральный выбор','лор'], rating:'4.8', pages:[
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
    chapters:9, difficulty:'Обычная', tone:'Напряжённый', time:'~15 мин', role:'«Капитан»', tags:['мистерия','выживание','ИИ'], rating:'4.6', pages:[
    {h:'Станция «Кассандра»', drop:'С', text:'истема разбудила тебя на 214 лет позже срока. Экипаж исчез, реактор гудит на 4%, а бортовой ИИ утверждает, что ты — не тот, за кого себя выдаёшь.'},
    {text:'До ближайшего сигнала — восемь часов кислорода. В отсеке мигает красный. Голос ИИ спокоен: «Рада, что вы наконец проснулись, капитан. Или мне называть вас иначе?»'},
    {choices:['Потребовать доступ к бортовому журналу.','Молча идти к реактору.','Спросить ИИ, что случилось с экипажем.']}
  ]},
  hist:{title:'Восстание Спартака', cover:'/assets/cover_history.jpg', tag:'Античность', tagClass:'g-hist',
    synopsis:'Песок арены хранит вчерашнюю кровь. Ты — раб-гладиатор школы Батиата, и сегодня в казарме шепчутся о побеге.',
    chapters:7, difficulty:'Тяжёлая', tone:'Драматичный', time:'~15 мин', role:'Гладиатор', tags:['история','восстание','свобода'], rating:'4.7', pages:[
    {h:'Восстание Спартака', drop:'П', text:'есок арены ещё хранит вчерашнюю кровь. Ты — раб-гладиатор школы Батиата, и сегодня в казарме шепчутся о побеге.'},
    {text:'Один неверный взгляд стражи — и всё кончено. Спартак смотрит на тебя через решётку: «Ну что, брат? Жить рабом или умереть свободным?»'},
    {choices:['Присоединиться к заговору.','Выждать и оценить силы.','Выдать заговор ради свободы.']}
  ]},
  post:{title:'Линия разрыва', cover:'/assets/cover_modern.png', tag:'Современность', tagClass:'g-post',
    synopsis:'В закрытый канал редакции приходит запись завтрашнего эфира. В ней твой голос признается в преступлении, которого еще не было.',
    chapters:6, difficulty:'Обычная', tone:'Нервный', time:'~15 мин', role:'Ночной репортер', tags:['город','расследование','выбор'], rating:'4.7', pages:[
    {h:'Линия разрыва', drop:'В', text:' закрытый канал редакции приходит файл без отправителя. В наушниках звучит твой голос: он признается в пожаре, который по новостной ленте случится только завтра.'},
    {text:'До прямого эфира тридцать семь минут. Лера говорит не звонить никому: ее брат уже есть в утечке как следующий источник.'},
    {choices:['Сохранить файл и отключить общий эфир.','Позвонить человеку из записи.','Проверить, кто вошел в редакцию.']}
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
  const b=sheetBody.querySelector('.sc-start'); if(b) b.addEventListener('click',()=>{ closeSheet(); setTimeout(()=>{ location.href='/interaction?story='+encodeURIComponent(b.dataset.start); },240); });
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
const installRow=document.getElementById('installRow');
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

if('serviceWorker' in navigator){
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
    navigator.serviceWorker.register('/sw.js')
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
if(installRow) installRow.addEventListener('click',doInstall);
window.addEventListener('appinstalled',()=>{ if(pwaState) pwaState.textContent='✓ установлено'; if(installBtn) installBtn.style.display='none'; });
if(standalone && pwaState) pwaState.textContent='✓ запущено как приложение';


  return () => {}
}
