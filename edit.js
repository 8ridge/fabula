/* ФАБУЛА — режим правки прямо в браузере.

   Загружается ТОЛЬКО когда в адресе есть ?edit — на боевом сайте этого файла
   в работе нет, ни одна строчка не выполняется.

   Что умеет:
     • перетаскивать блоки мышкой (секции целиком и карточки внутри сеток)
     • править любой текст по клику
     • прятать блок
     • Ctrl+Z — отменить
     • «Скачать» — отдаёт index.html со всеми изменениями

   Самое важное здесь — clean(). Скрипт самой страницы много чего дорисовывает
   на лету: разбивает заголовки на слова, набивает бегущую строку, сыпет пылинки
   в герой, пишет inline-переменные для наклона и подсветки. Если выгрузить DOM
   как есть, весь этот мусор запечётся в файл навсегда. Поэтому перед выгрузкой
   каждая такая правка откатывается на клоне документа.
*/
(() => {
  'use strict';
  if (window.__fabulaEditor) return;
  window.__fabulaEditor = true;

  const SORTABLE = ['.packs', '.feats', '.tiers', '.steps', '.lore', '.fork-out'];
  const TEXT = 'H1,H2,H3,H4,P,LI,EM,B,U,SPAN,A,DIV';
  const history = [];

  /* ---------- оформление панели и подсветок ---------- */
  const css = document.createElement('style');
  css.className = 'ed-ui';
  css.textContent = `
  .ed-bar{position:fixed;top:0;left:0;right:0;z-index:99999;display:flex;align-items:center;gap:10px;
    padding:9px 16px;background:#16161acc;backdrop-filter:blur(14px);border-bottom:1px solid #ffffff26;
    font:13px/1.2 system-ui,sans-serif;color:#eaeaee}
  .ed-bar b{font-weight:600;letter-spacing:.04em}
  .ed-bar .sp{margin-left:auto;color:#8b8b96;font-size:12px}
  .ed-bar button{font:12px/1 system-ui,sans-serif;color:#eaeaee;background:#ffffff14;cursor:pointer;
    border:1px solid #ffffff2b;border-radius:7px;padding:8px 13px}
  .ed-bar button:hover{background:#ffffff24}
  .ed-bar button.go{background:#eaeaee;color:#111;border-color:#eaeaee;font-weight:600}
  body.ed-on{padding-top:42px}
  body.ed-on a{cursor:default}
  /* подсветка того, что можно взять */
  .ed-h{outline:1px dashed #ffffff40;outline-offset:3px}
  .ed-h.ed-sec{outline-color:#d9a94a80}
  .ed-grip{position:absolute;z-index:9999;display:flex;gap:4px;touch-action:none}
  .ed-grip span{font:11px/1 system-ui,sans-serif;color:#0a0a0c;background:#d9a94a;border-radius:5px;
    padding:6px 10px;cursor:grab;user-select:none;white-space:nowrap;
    box-shadow:0 3px 10px #0009;touch-action:none}
  .ed-grip span:active{cursor:grabbing}
  .ed-grip span.x{background:#e0645a;color:#fff;cursor:pointer}
  .ed-drag{opacity:.35}
  body.ed-dragging{cursor:grabbing!important;user-select:none}
  [contenteditable="true"]{outline:2px solid #54e6d0;outline-offset:2px;border-radius:3px}
  .ed-hidden{display:none!important}`;
  document.head.appendChild(css);

  /* ---------- панель ---------- */
  const bar = document.createElement('div');
  bar.className = 'ed-bar ed-ui';
  bar.innerHTML = `<b>Режим правки</b>
    <button data-a="undo">← Отменить</button>
    <button data-a="show">Вернуть скрытое</button>
    <button data-a="draft" style="display:none">Восстановить черновик</button>
    <span class="sp">Тяни за жёлтую метку · клик по тексту — правка · Ctrl+Z — отменить</span>
    <button data-a="exit">Выйти</button>
    <button class="go" data-a="save">Скачать index.html</button>`;
  document.body.appendChild(bar);
  document.body.classList.add('ed-on');

  /* ---------- снимки для отмены ---------- */
  const snap = () => {
    history.push(document.body.innerHTML);
    if (history.length > 40) history.shift();
    clearTimeout(snap._t);
    snap._t = setTimeout(() => { try { localStorage.setItem('fabula-draft', build()); } catch (_) {} }, 700);
  };
  const undo = () => {
    if (!history.length) return;
    document.body.innerHTML = history.pop();
    // в снимке лежала и сама панель: без этой уборки в странице оказывались две —
    // живая и мёртвая копия без обработчиков, и клики уходили в никуда
    document.body.querySelectorAll('.ed-ui').forEach(n => n.remove());
    document.body.appendChild(bar);
    mark();
  };

  /* ---------- что можно таскать ---------- */
  const units = () => {
    const list = [...document.querySelectorAll('body > section')].map(el => [el, document.body]);
    SORTABLE.forEach(sel => document.querySelectorAll(sel).forEach(box => {
      [...box.children].forEach(ch => list.push([ch, box]));
    }));
    return list;
  };

  let grips = [];
  function mark() {
    grips.forEach(g => g.remove());
    grips = [];
    units().forEach(([el, box]) => {
      el.classList.add('ed-h');
      if (box === document.body) el.classList.add('ed-sec');
      const g = document.createElement('div');
      g.className = 'ed-grip ed-ui';
      /* Стрелки нужны не для красоты: секция выше экрана, и перетащить её мышью
         за пределы собственной высоты нельзя — курсор просто не дотягивается. */
      g.innerHTML = `<span data-grab>⠿ ${box === document.body ? (el.id || 'блок') : 'карточка'}</span>
                     <span data-move="-1" title="Выше">↑</span>
                     <span data-move="1" title="Ниже">↓</span>
                     <span class="x" data-hide>✕</span>`;
      document.body.appendChild(g);
      grips.push(g);
      /* Метка липнет к видимой части блока, а не к его верхнему краю: секции высокие,
         и метка, привязанная к самому верху, почти всегда оказывается за экраном. */
      const place = () => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 60 || r.top > innerHeight - 10) { g.style.display = 'none'; return; }
        g.style.display = 'flex';
        const top = Math.min(Math.max(r.top, 52), Math.max(r.bottom - 34, 52));
        // у секций left=0, поэтому целимся в колонку контента, а не в край страницы
        const inner = el.querySelector(':scope > .wrap');
        const left = inner ? inner.getBoundingClientRect().left : r.left;
        g.style.top = (top + scrollY) + 'px';
        g.style.left = (Math.max(left, 6) + scrollX) + 'px';
      };
      place();
      g._place = place;
      g._el = el;
      g._box = box;
    });
  }
  const reposition = () => grips.forEach(g => g._place && g._place());
  addEventListener('scroll', reposition, { passive: true });
  addEventListener('resize', () => { reposition(); }, { passive: true });

  /* ---------- перетаскивание ---------- */
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const grab = e.target.closest('[data-grab]');
    if (!grab) return;
    const g = grab.closest('.ed-grip');
    e.preventDefault();
    snap();
    drag = { el: g._el, box: g._box };
    drag.el.classList.add('ed-drag');
    document.body.classList.add('ed-dragging');
    try { grab.setPointerCapture(e.pointerId); } catch (_) {}
  });

  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    edge = e.clientY < 110 ? -16 : e.clientY > innerHeight - 80 ? 16 : 0;
    if (edge && !roll) roll = requestAnimationFrame(rollLoop);
    /* В body лежат ещё и шапка, зерно, бегущая строка и липкая кнопка. Зерно —
       это <svg> на весь экран, и по «ближайшему центру» оно выигрывало всегда,
       из-за чего секция улетала не туда. Соседями считаем только такие же секции. */
    const sibs = [...drag.box.children].filter(c =>
      c !== drag.el && !c.classList.contains('ed-ui') &&
      (drag.box !== document.body || c.tagName === 'SECTION') &&
      c.getBoundingClientRect().height > 0);
    if (!sibs.length) return;
    // ближайший сосед по центру, дальше решаем — до него или после
    let best = null, bestD = Infinity;
    sibs.forEach(c => {
      const r = c.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = c; }
    });
    const r = best.getBoundingClientRect();
    // в сетке решает горизонталь, в колонке секций — вертикаль
    const after = drag.box === document.body
      ? e.clientY > r.top + r.height / 2
      : (r.width < drag.box.getBoundingClientRect().width - 4
          ? e.clientX > r.left + r.width / 2
          : e.clientY > r.top + r.height / 2);
    drag.box.insertBefore(drag.el, after ? best.nextSibling : best);
    reposition();
  });

  /* автопрокрутка у краёв экрана — без неё длинные блоки не перетащить */
  let edge = 0, roll = 0;
  const rollLoop = () => {
    if (!drag) { roll = 0; return; }
    if (edge) scrollBy(0, edge);
    roll = requestAnimationFrame(rollLoop);
  };

  const endDrag = () => {
    edge = 0; if (roll) { cancelAnimationFrame(roll); roll = 0; }
    if (!drag) return;
    drag.el.classList.remove('ed-drag');
    document.body.classList.remove('ed-dragging');
    drag = null;
    reposition();
  };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  /* ---------- сдвинуть на позицию вверх/вниз ---------- */
  const peers = (el, box) => [...box.children].filter(c =>
    !c.classList.contains('ed-ui') && !c.classList.contains('ed-hidden') &&
    (box !== document.body || c.tagName === 'SECTION'));

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-move]');
    if (!btn) return;
    e.preventDefault();
    const g = btn.closest('.ed-grip'), el = g._el, box = g._box;
    const list = peers(el, box), i = list.indexOf(el), to = i + (+btn.dataset.move);
    if (i < 0 || to < 0 || to >= list.length) return;
    snap();
    box.insertBefore(el, to > i ? list[to].nextSibling : list[to]);
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(reposition, 450);
  });

  /* ---------- скрыть блок ---------- */
  document.addEventListener('click', (e) => {
    const x = e.target.closest('[data-hide]');
    if (!x) return;
    e.preventDefault();
    snap();
    x.closest('.ed-grip')._el.classList.add('ed-hidden');
    reposition();
  });

  /* ---------- правка текста по клику ---------- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('.ed-ui')) return;
    e.preventDefault();                        // в режиме правки ссылки никуда не ведут
    let el = e.target;
    while (el && el !== document.body && !TEXT.includes(el.tagName)) el = el.parentElement;
    if (!el || el === document.body) return;
    if (el.getAttribute('contenteditable') === 'true') return;
    snap();
    el.setAttribute('contenteditable', 'plaintext-only');
    el.focus();
    el.addEventListener('blur', () => el.removeAttribute('contenteditable'), { once: true });
  });

  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.target.isContentEditable) {
      e.preventDefault(); undo();
    }
  });

  /* ---------- откат всего, что скрипт страницы дорисовал на лету ---------- */
  function clean(root) {
    const q = (s) => [...root.querySelectorAll(s)];

    root.classList.remove('js');                                    // добавляется скриптом
    if (!root.getAttribute('class')) root.removeAttribute('class'); // иначе останется class=""
    q('.rv.in').forEach(el => el.classList.remove('in'));
    q('.spot').forEach(el => el.classList.remove('spot'));
    q('.dock.on').forEach(el => el.classList.remove('on'));
    q('header.nav.scrolled').forEach(el => el.classList.remove('scrolled'));

    const dust = root.querySelector('#dust'); if (dust) dust.innerHTML = '';   // пылинки
    const band = root.querySelector('#bandIn'); if (band) band.innerHTML = ''; // бегущая строка
    const prog = root.querySelector('#prog'); if (prog) prog.removeAttribute('style');
    const hbg = root.querySelector('#heroBg'); if (hbg) hbg.removeAttribute('style');

    // заголовки секций разбиваются на слова в <span class="wsp"><i>…
    q('.sec-head h2').forEach(h => { h.textContent = h.textContent.replace(/\s+/g, ' ').trim(); });

    // цены переписываются переключателем «помесячно / на год»
    q('.tier .price').forEach(p => {
      const m = p.dataset.m;
      p.innerHTML = (m && m !== '0') ? `${m} <small>₽ / мес</small>` : '0 <small>₽</small>';
    });
    q('.pay-sw button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === 'm')));

    // видео получают src уже в браузере, в исходнике его нет
    q('.hero-video,.cta-video').forEach(v => { v.removeAttribute('src'); v.classList.remove('on'); });

    // демо-блоки подсвечивают активную ячейку сами
    q('.demo .sel').forEach(el => el.classList.remove('sel'));
    q('.demo .on').forEach(el => el.classList.remove('on'));
    q('.demo-scene.show,.d-shot.show').forEach(el => el.classList.remove('show'));

    // inline-переменные наклона и подсветки под курсором
    const VARS = ['--mx', '--my', '--rx', '--ry', '--tilt', '--sc', '--ty'];
    q('[style]').forEach(el => {
      VARS.forEach(v => el.style.removeProperty(v));
      if (!el.getAttribute('style')) el.removeAttribute('style');
    });

    /* Чужие наложения от браузерных расширений. Они не наши, но при выгрузке
       попадали в файл и уезжали на боевой сайт — так на страницу приехала
       оранжевая рамка-подсветка, которую потом видели все посетители. */
    q('[id^="claude-agent"],[id^="claude-in-chrome"],[data-extension],[id*="-extension-root"]')
      .forEach(el => el.remove());
    q('body > div,body > style,body > iframe').forEach(el => {
      const st = el.getAttribute('style') || '';
      // фикс-слой во весь экран с запредельным z-index — верный признак оверлея
      if (/position:\s*fixed/i.test(st) && /z-index:\s*(21474|99999)/i.test(st)) el.remove();
    });

    // следы самого редактора
    q('.ed-ui').forEach(el => el.remove());
    q('script[src]').forEach(s => { if (/edit\.js/.test(s.src)) s.remove(); });  // сам себя не тащим
    q('.ed-h,.ed-sec,.ed-drag').forEach(el => el.classList.remove('ed-h', 'ed-sec', 'ed-drag'));
    q('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    q('.ed-hidden').forEach(el => el.remove());          // спрятанное вырезается насовсем
    const body = root.querySelector('body');
    if (body) body.classList.remove('ed-on', 'ed-dragging');
    if (body && !body.getAttribute('class')) body.removeAttribute('class');
    return root;
  }

  function build() {
    const root = clean(document.documentElement.cloneNode(true));
    return '<!DOCTYPE html>\n' + root.outerHTML + '\n';
  }
  window.__exportHTML = build;                            // чтобы можно было проверить извне

  /* Скачивание. Раньше ссылка добавлялась в конец <body>, браузер переводил на неё
     фокус и прокручивал страницу вниз — со стороны это выглядело так, будто кнопка
     только листает. Теперь ссылка в DOM не попадает, а позиция прокрутки на всякий
     случай восстанавливается. */
  function save() {
    const y = scrollY;
    const url = URL.createObjectURL(new Blob([build()], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    link.rel = 'noopener';
    link.click();
    scrollTo(0, y);
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    localStorage.setItem('fabula-saved', '1');
    return 'ok';
  }
  window.__save = save;                                   // запасной путь из консоли

  /* Черновик в localStorage: перезагрузка больше не стирает работу подчистую. */
  const DRAFT = 'fabula-draft';
  const keep = () => { try { localStorage.setItem(DRAFT, build()); } catch (_) {} };
  addEventListener('beforeunload', (e) => {
    if (!history.length) return;
    keep();
    e.preventDefault();
    e.returnValue = '';
  });

  /* ---------- кнопки панели ---------- */
  bar.addEventListener('click', (e) => {
    const a = e.target.dataset.a;
    if (!a) return;
    if (a === 'undo') undo();
    if (a === 'show') { snap(); document.querySelectorAll('.ed-hidden').forEach(el => el.classList.remove('ed-hidden')); reposition(); }
    if (a === 'exit') location.href = location.pathname;
    if (a === 'save') save();
  });

  /* Восстановление черновика: берём из сохранённой копии только <body> и
     подменяем им текущий, чтобы не трогать <head> и стили. */
  const draftBtn = bar.querySelector('[data-a="draft"]');
  if (localStorage.getItem(DRAFT)) draftBtn.style.display = '';
  bar.addEventListener('click', (e) => {
    if (e.target.dataset.a !== 'draft') return;
    const saved = localStorage.getItem(DRAFT);
    if (!saved) return;
    if (!confirm('Заменить текущую страницу сохранённым черновиком?')) return;
    snap();
    const doc = new DOMParser().parseFromString(saved, 'text/html');
    document.body.innerHTML = doc.body.innerHTML;
    document.body.querySelectorAll('.ed-ui').forEach(n => n.remove());
    document.body.appendChild(bar);
    mark();
  });

  // размётка ставится после того, как скрипт страницы закончил свои вставки
  setTimeout(mark, 400);
})();
