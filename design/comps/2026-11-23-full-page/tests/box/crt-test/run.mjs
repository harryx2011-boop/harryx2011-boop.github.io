import { spawn } from 'node:child_process';
import fs from 'node:fs';

const DIR = '/workspace/crt-test', SHOTS = DIR + '/shots', PORT = 9333, URL = 'file://' + DIR + '/index.html';
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
const out = [];
const log = (s) => { console.log(s); out.push(s); };
const R = { pass: 0, fail: 0, notrun: 0 };
function check(name, ok, detail) {
  const tag = ok === 'NR' ? 'NOT RUN' : ok ? 'PASS' : 'FAIL';
  if (ok === 'NR') R.notrun++; else if (ok) R.pass++; else R.fail++;
  log(`${tag}  ${name} :: ${detail}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = JSON.stringify;

const chrome = spawn('/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*', '--user-data-dir=' + DIR + '/profile', '--window-size=1440,900',
  '--hide-scrollbars', '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });

let ws, id = 0;
const pending = new Map(), waiters = [], pageErrors = [];
function send(method, params = {}) {
  return new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej, method }); ws.send(J({ id: i, method, params })); });
}
const waitEvent = (name) => new Promise((res) => waiters.push({ name, res }));

async function main() {
  let list;
  for (let i = 0; i < 80; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.find((t) => t.type === 'page')) break; } catch (e) { /* not up yet */ }
    await sleep(250);
  }
  const page = list.find((t) => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ': ' + m.error.message)) : p.res(m.result); return; }
    if (m.method) {
      for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].name === m.method) { waiters[i].res(m.params); waiters.splice(i, 1); }
      if (m.method === 'Runtime.exceptionThrown') pageErrors.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') pageErrors.push('console.error: ' + m.params.args.map((a) => a.value || a.description).join(' '));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') pageErrors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
    }
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Accessibility.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: fs.readFileSync(DIR + '/helpers.js', 'utf8') });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.bringToFront');

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) + ' <= ' + expr.slice(0, 120));
    return r.result.value;
  };
  const waitFor = async (expr, ms = 5000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(expr)) return true; await sleep(50); } return false; };
  async function load(url = URL, ready = 'document.querySelectorAll(".xp-icon").length===4') {
    const w = waitEvent('Page.loadEventFired');
    await send('Page.navigate', { url });
    await w;
    await waitFor(ready);
    await sleep(500);
  }
  const leaf = (sel) => ev(`T.leafPixels(T.q(${J(sel)}))`);

  /* ---- trusted input ---- */
  const mouse = (type, x, y, o = {}) => send('Input.dispatchMouseEvent', { type, x, y, button: o.button ?? 'none', buttons: o.buttons ?? 0, clickCount: o.clickCount ?? 0 });
  const move = (x, y) => mouse('mouseMoved', x, y);
  async function click(x, y, n = 1) {
    await move(x, y);
    for (let k = 1; k <= n; k++) {
      await mouse('mousePressed', x, y, { button: 'left', buttons: 1, clickCount: k });
      await mouse('mouseReleased', x, y, { button: 'left', buttons: 0, clickCount: k });
    }
    await sleep(70);
  }
  async function dragMouse(x0, y0, x1, y1, steps = 8, cb) {
    await move(x0, y0);
    await mouse('mousePressed', x0, y0, { button: 'left', buttons: 1, clickCount: 1 });
    for (let i = 1; i <= steps; i++) {
      const x = x0 + (x1 - x0) * i / steps, y = y0 + (y1 - y0) * i / steps;
      await mouse('mouseMoved', x, y, { button: 'left', buttons: 1 });
      if (cb) await cb(i, x, y);
    }
    await mouse('mouseReleased', x1, y1, { button: 'left', buttons: 0, clickCount: 1 });
    await sleep(70);
  }
  const KEYS = { Tab: [9, 'Tab'], Enter: [13, 'Enter', '\r'], ' ': [32, 'Space', ' '], Escape: [27, 'Escape'], ArrowLeft: [37, 'ArrowLeft'], ArrowRight: [39, 'ArrowRight'] };
  async function press(key, { shift = false } = {}) {
    let [vk, code, text] = KEYS[key] || [key.toUpperCase().charCodeAt(0), (/[a-z]/i.test(key) ? 'Key' + key.toUpperCase() : 'Digit0'), key];
    const modifiers = shift ? 8 : 0;
    await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text, unmodifiedText: text, modifiers });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
  }
  async function typeText(s) { for (const ch of s) await press(ch); }
  const touch = (type, x, y) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1, radiusX: 1, radiusY: 1, force: 1 }] });
  async function tap(x, y) { await touch('touchStart', x, y); await sleep(40); await touch('touchEnd', x, y); await sleep(120); }
  async function touchDrag(x0, y0, x1, y1, steps = 8) {
    await touch('touchStart', x0, y0);
    for (let i = 1; i <= steps; i++) await touch('touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps);
    await touch('touchEnd', x1, y1); await sleep(120);
  }
  const C = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
  const q = (sel) => ev(`T.q(${J(sel)})`);
  const must = async (sel) => { const r = await q(sel); if (!r) throw new Error('missing ' + sel); return r; };
  async function clickSel(sel, n = 1) { const r = await must(sel); const c = C(r); await click(c.x, c.y, n); return r; }
  async function clickLabel(sel, label) { const r = await ev(`T.find(${J(sel)},${J(label)})`); if (!r) throw new Error('missing ' + sel + ' ' + label); const c = C(r); await click(c.x, c.y); return r; }
  const icon = (label) => clickLabel('.xp-icon', label);
  const cap = (win, name) => `.xp-win[aria-label=${J(win)}] button[aria-label=${J(name)}]`;
  const WIN = (l) => ev(`T.win(${J(l)})`);
  async function shot(name, sel = '.crt-screen', scale = 1, pad = 0) {
    const r = await q(sel);
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + 2 * pad, height: r.h + 2 * pad, scale } });
    fs.writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(data, 'base64'));
  }
  const inside = (r, L, tol = 0.6) => r.x >= L.x - tol && r.y >= L.y - tol && r.x + r.w <= L.x + L.w + tol && r.y + r.h <= L.y + L.h + tol;
  const f1 = (n) => (Math.round(n * 10) / 10);
  const fmt = (r) => `(${f1(r.x)},${f1(r.y)} ${f1(r.w)}x${f1(r.h)})`;
  const group = async (name, fn) => { log(`\n=== ${name}`); try { await fn(); } catch (e) { check(`${name} crashed`, false, String(e.stack || e).split('\n').slice(0, 3).join(' | ')); } };

  /* ================= a. first view ================= */
  await group('a. first view', async () => {
    await load();
    await shot('a-first-view');
    const a = await ev(`(function(){var s=T.screen();return {s:s,wins:T.wins(),tasks:T.tasks(),layer:T.layer(),bar:T.q('.xp-bar'),clock:(document.querySelector('.xp-clock')||{}).textContent,vw:innerWidth,vh:innerHeight,
      narrow:document.querySelector('.xp').classList.contains('is-narrow'),active:T.active(),
      icons:[].slice.call(document.querySelectorAll('.xp-icon')).map(function(b){var r=T.r(b);var n=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);return {label:T.label(b),r:r,topmost:b.contains(n)};})};})()`);
    log(`info viewport ${a.vw}x${a.vh}, screen ${fmt(a.s)}, narrow=${a.narrow}, activeElement=${a.active}`);
    const w = a.wins[0];
    check('a1 exactly one window, Reveal film, shown, active', a.wins.length === 1 && w.label === 'Reveal film' && !w.hidden && !w.inert && w.active, `windows=${a.wins.map((x) => x.label)} hidden=${w.hidden} inert=${w.inert} active=${w.active}`);
    check('a2 window inside the desktop area', inside(w.r, a.layer), `win ${fmt(w.r)} layer ${fmt(a.layer)}`);
    const iconRight = Math.max(...a.icons.map((i) => i.r.x + i.r.w));
    check('a3 window clear of the icon column', w.r.x >= iconRight - 0.5, `win left ${f1(w.r.x)} icon column right ${f1(iconRight)}`);
    check('a4 four icons visible, topmost, inside screen', a.icons.length === 4 && a.icons.every((i) => i.topmost && inside(i.r, a.s)), a.icons.map((i) => `${i.label}:${i.topmost ? 'top' : 'COVERED'} ${fmt(i.r)}`).join('; '));
    check('a5 taskbar visible with one pressed task and a clock', a.tasks.length === 1 && a.tasks[0].pressed === 'true' && Math.abs(a.bar.y + a.bar.h - (a.s.y + a.s.h)) < 1 && !!a.clock, `bar ${fmt(a.bar)} tasks=${J(a.tasks.map((t) => [t.name, t.pressed]))} clock=${J(a.clock)}`);
  });

  /* ================= w. wide canvas pixels ================= */
  await group('w. wide canvas pixels (1440 px viewport)', async () => {
    await load();
    const h = await ev(`(function(){function hash(cv){var d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,a=2166136261,b=5381;for(var i=0;i<d.length;i++){a=Math.imul(a^d[i],16777619)>>>0;b=(Math.imul(b,33)+d[i])>>>0;}return cv.width+'x'+cv.height+':'+a.toString(16)+b.toString(16);}
      return {back:hash(document.querySelector('.crt-back')),front:hash(document.querySelector('.crt-front')),st:document.querySelector('.crt').style.getPropertyValue('--st'),grid:document.querySelector('.crt').getAttribute('data-grid')};})()`);
    const f = DIR + '/wide-hash.json';
    if (!fs.existsSync(f)) { fs.writeFileSync(f, J(h)); check('w1 wide canvas hashes recorded as the baseline (before any change)', true, J(h)); }
    else { const b = JSON.parse(fs.readFileSync(f, 'utf8')); check('w1 wide back and front canvas pixels (and --st) are identical to the baseline', J(b) === J(h), `baseline ${J(b)}; now ${J(h)}`); }
  });

  /* ================= b. drag ================= */
  await group('b. drag', async () => {
    await load();
    const FILM = 'Reveal film', nameSel = `.xp-win[aria-label=${J(FILM)}] .xp-name`;
    const L = await ev('T.layer()');
    let w0 = (await WIN(FILM)).r;
    const freeR = L.x + L.w - (w0.x + w0.w), freeB = L.y + L.h - (w0.y + w0.h);
    const expX = Math.min(120, freeR), expY = Math.min(60, freeB);
    let c = C(await must(nameSel)), mid = null;
    await dragMouse(c.x, c.y, c.x + 120, c.y + 60, 8, async (i) => {
      if (i === 4) mid = await ev(`(function(){var t=document.querySelector('.xp-win[aria-label=${FILM}] .xp-title');var w=T.win(${J(FILM)});return {dragging:w.dragging,transform:w.transform,capture:t.hasPointerCapture(1),r:w.r};})()`.replace('[aria-label=Reveal film]', '[aria-label="Reveal film"]'));
    });
    let w1 = (await WIN(FILM)).r;
    log(`info initial window ${fmt(w0)}, free right ${f1(freeR)} free below ${f1(freeB)}`);
    check('b1 drag 120,60 from first-view position (clamp-aware)', Math.abs((w1.x - w0.x) - expX) <= 1.5 && Math.abs((w1.y - w0.y) - expY) <= 1.5, `moved (${f1(w1.x - w0.x)},${f1(w1.y - w0.y)}) expected (${f1(expX)},${f1(expY)}) [wanted 120,60 but only ${f1(freeR)} free to the right]`);
    check('b1b mid-drag: is-drag, transform set, pointer capture held', mid && mid.dragging && /translate/.test(mid.transform) && mid.capture, J(mid));
    const after = await WIN(FILM);
    check('b1c after release: no is-drag, no transform left', !after.dragging && after.transform === '', `dragging=${after.dragging} transform=${J(after.transform)}`);
    /* to the top-left corner: left and top edge */
    c = C(await must(nameSel));
    await dragMouse(c.x, c.y, 2, 2, 10);
    let w2 = (await WIN(FILM)).r;
    check('b2 drag far past top and left edges stays clamped', Math.abs(w2.x - L.x) < 0.6 && Math.abs(w2.y - L.y) < 0.6, `window ${fmt(w2)} layer origin (${f1(L.x)},${f1(L.y)}); pointer released at (2,2)`);
    const scr = await ev('T.screen()'), stv = await ev(`getComputedStyle(document.querySelector('.xp')).getPropertyValue('--st')`);
    const overPx = scr.h * parseFloat(stv) / 100;
    check('b2b top safe inset: the desktop starts below the plants (layer top = screen top + overhang)', stv !== '' && overPx > 5 && Math.abs((L.y - scr.y) - overPx) < 1, `--st=${stv} -> ${f1(overPx)} px; layer top is ${f1(L.y - scr.y)} px below the glass top`);
    const lp = await leaf(`.xp-win[aria-label=${J(FILM)}] .xp-title`);
    check('b2c title bar dragged to the very top has no leaf pixel over it', lp === 0, `${lp} opaque front-canvas pixels under the title bar`);
    /* clean 120,60 from the corner */
    c = C(await must(nameSel));
    await dragMouse(c.x, c.y, c.x + 120, c.y + 60, 8);
    let w3 = (await WIN(FILM)).r;
    check('b3 drag 120 right, 60 down from the corner (room on both sides)', Math.abs((w3.x - w2.x) - 120) <= 1.5 && Math.abs((w3.y - w2.y) - 60) <= 1.5, `moved (${f1(w3.x - w2.x)},${f1(w3.y - w2.y)})`);
    /* three more edges, with the rect sampled on every step */
    const targets = [['bottom-right', 1439, 899, (r) => Math.abs(r.x + r.w - (L.x + L.w)) < 0.6 && Math.abs(r.y + r.h - (L.y + L.h)) < 0.6],
      ['top-right', 1439, 0, (r) => Math.abs(r.x + r.w - (L.x + L.w)) < 0.6 && Math.abs(r.y - L.y) < 0.6],
      ['bottom-left', 0, 899, (r) => Math.abs(r.x - L.x) < 0.6 && Math.abs(r.y + r.h - (L.y + L.h)) < 0.6]];
    for (const [name, tx, ty, ok] of targets) {
      c = C(await must(nameSel));
      let allIn = true, worst = '';
      await dragMouse(c.x, c.y, tx, ty, 12, async () => { const r = (await WIN(FILM)).r; if (!inside(r, L)) { allIn = false; worst = fmt(r); } });
      const r = (await WIN(FILM)).r;
      check(`b4 drag to the ${name} corner: flush with the edges, inside on every step`, ok(r) && allIn, `final ${fmt(r)} layer ${fmt(L)}${allIn ? '' : ' outside at step ' + worst}`);
    }
    await shot('b-after-drag-corner');
    /* a drag that starts on a title-bar button */
    await load();
    const before = await WIN(FILM);
    const mb = C(await must(cap(FILM, 'Maximize')));
    await dragMouse(mb.x, mb.y, mb.x + 120, mb.y + 60, 8);
    const after2 = await WIN(FILM);
    check('b5 drag starting on the Maximize button moves nothing and does not maximize', Math.abs(after2.r.x - before.r.x) < 0.6 && Math.abs(after2.r.y - before.r.y) < 0.6 && !after2.max && !after2.hidden, `before ${fmt(before.r)} after ${fmt(after2.r)} max=${after2.max} hidden=${after2.hidden}`);
    /* a drag that starts in the window body */
    const body = await must(`.xp-win[aria-label=${J(FILM)}] .xp-body`);
    const bc = C(body);
    await dragMouse(bc.x, bc.y - 40, bc.x + 100, bc.y + 20, 6);
    const after3 = await WIN(FILM);
    check('b6 drag starting in the window body moves nothing', Math.abs(after3.r.x - before.r.x) < 0.6 && Math.abs(after3.r.y - before.r.y) < 0.6, `before ${fmt(before.r)} after ${fmt(after3.r)}`);
    /* release outside the browser viewport: pointer capture must still deliver pointerup */
    const cc = C(await must(nameSel));
    await dragMouse(cc.x, cc.y, -60, -60, 8);
    const after4 = await WIN(FILM);
    check('b7 releasing the pointer outside the viewport still ends the drag (capture)', !after4.dragging && after4.transform === '' && Math.abs(after4.r.x - L.x) < 0.6 && Math.abs(after4.r.y - L.y) < 0.6, `dragging=${after4.dragging} transform=${J(after4.transform)} window ${fmt(after4.r)}`);
    /* right button on the title must not start a drag */
    await load();
    const rc = C(await must(nameSel)), rb = (await WIN(FILM)).r;
    await move(rc.x, rc.y);
    await mouse('mousePressed', rc.x, rc.y, { button: 'right', buttons: 2, clickCount: 1 });
    await mouse('mouseMoved', rc.x + 60, rc.y + 40, { button: 'right', buttons: 2 });
    await mouse('mouseReleased', rc.x + 60, rc.y + 40, { button: 'right', buttons: 0, clickCount: 1 });
    const ra = (await WIN(FILM)).r;
    check('b8 right-button press on the title bar does not drag', Math.abs(ra.x - rb.x) < 0.6 && Math.abs(ra.y - rb.y) < 0.6, `before ${fmt(rb)} after ${fmt(ra)}`);
  });

  /* ================= c. focus and z-order ================= */
  await group('c. focus and z-order', async () => {
    await load();
    await icon('Terminal');
    await shot('c-two-windows');
    let film = await WIN('Reveal film'), term = await WIN('Terminal');
    check('c1 opening Terminal: it is active, above Film, input focused', term.active && !film.active && term.z > film.z && (await ev('T.active()')).startsWith('input.app-input'), `z film=${film.z} term=${term.z}, activeElement=${await ev('T.active()')}`);
    /* click a part of Film that Terminal does not cover: title bar, then body */
    const pointOn = (label, part) => ev(`(function(){var w=document.querySelector('.xp-win[aria-label=${J(label)}] ${part}');var r=w.getBoundingClientRect();
      for(var y=r.top+2;y<r.bottom-2;y+=3)for(var x=r.left+2;x<r.right-2;x+=3){var n=document.elementFromPoint(x,y);if(n&&n.closest('.xp-win')&&n.closest('.xp-win').getAttribute('aria-label')===${J(label)}&&!n.closest('button'))return {x:x,y:y,el:T.desc(n)};}return null;})()`);
    const p1 = await pointOn('Reveal film', '.xp-title');
    if (!p1) check('c2 click on Film title bar raises Film', 'NR', 'no uncovered title point found'); else {
      await click(p1.x, p1.y);
      film = await WIN('Reveal film'); term = await WIN('Terminal');
      const tasks = await ev('T.tasks()');
      check('c2 click on Film title bar raises and activates Film', film.active && !term.active && film.z > term.z, `z film=${film.z} term=${term.z} click at (${f1(p1.x)},${f1(p1.y)}) on ${p1.el}; pressed=${J(tasks.map((t) => [t.name, t.pressed]))}; activeElement=${await ev('T.active()')}`);
    }
    await icon('Terminal');   /* terminal back on top */
    const p2 = await pointOn('Reveal film', '.xp-body');
    if (!p2) check('c3 click on Film body raises Film', 'NR', 'no uncovered body point found'); else {
      await click(p2.x, p2.y);
      film = await WIN('Reveal film'); term = await WIN('Terminal');
      check('c3 click on Film body raises and activates Film', film.active && !term.active && film.z > term.z, `z film=${film.z} term=${term.z} click at (${f1(p2.x)},${f1(p2.y)}) on ${p2.el}; activeElement=${await ev('T.active()')}`);
    }
    await shot('c-film-raised');
    /* the taskbar button of a background window focuses it */
    await clickLabel('.xp-task', 'Terminal');
    film = await WIN('Reveal film'); term = await WIN('Terminal');
    check('c4 taskbar button of the background window focuses and raises it', term.active && term.z > film.z && !term.hidden, `term active=${term.active} z=${term.z} film z=${film.z}`);
    /* only one window is active */
    /* drag the background window by its visible title bar */
    await load(); await icon('Terminal');
    const pf = await pointOn('Reveal film', '.xp-title');
    const fb = (await WIN('Reveal film')).r;
    if (!pf) check('c6 drag a background window by its title bar', 'NR', 'no uncovered title point'); else {
      await dragMouse(pf.x, pf.y, pf.x - 40, pf.y + 30, 6);
      const f2 = await WIN('Reveal film'), t2 = await WIN('Terminal');
      check('c6 dragging a background window by its title bar moves it and raises it in one gesture', Math.abs((f2.r.x - fb.x) - (-40)) <= 1.5 && f2.active && f2.z > t2.z, `film moved (${f1(f2.r.x - fb.x)},${f1(f2.r.y - fb.y)}) active=${f2.active} z film=${f2.z} term=${t2.z}`);
    }
    check('c5 exactly one window carries is-active', (await ev('document.querySelectorAll(".xp-win.is-active").length')) === 1, `count=${await ev('document.querySelectorAll(".xp-win.is-active").length')}`);
  });

  /* ================= d. minimize / restore / taskbar toggle ================= */
  await group('d. minimize, restore, taskbar toggle', async () => {
    await load();
    await icon('Terminal');
    await clickSel(cap('Terminal', 'Minimize'));
    let film = await WIN('Reveal film'), term = await WIN('Terminal');
    const tasks = await ev('T.tasks()');
    check('d1 Minimize hides and makes inert; Film becomes active; both tasks remain', term.hidden && term.inert && term.display === 'none' && film.active && tasks.length === 2 && tasks.find((t) => t.name === 'Terminal').pressed === 'false', `term hidden=${term.hidden} inert=${term.inert} display=${term.display}; film active=${film.active}; tasks=${J(tasks.map((t) => [t.name, t.pressed]))}`);
    check('d2 after Minimize focus moves to that window\'s taskbar button', (await ev('T.active()')).includes('xp-task') && (await ev('T.active()')).includes('Terminal'), `activeElement=${await ev('T.active()')}`);
    await shot('d-minimized');
    const tc = term.r; const covered = await ev(`(function(){var n=document.elementFromPoint(${tc.x + 20},${tc.y + 20});return n&&n.closest('.xp-win')?n.closest('.xp-win').getAttribute('aria-label'):null;})()`);
    check('d3 minimized window area does not receive pointer hits', covered !== 'Terminal', `topmost window at its old position: ${covered}`);
    await clickLabel('.xp-task', 'Terminal');
    term = await WIN('Terminal'); film = await WIN('Reveal film');
    check('d4 taskbar click restores the minimized window, active and on top', !term.hidden && !term.inert && term.active && term.z > film.z, `hidden=${term.hidden} inert=${term.inert} active=${term.active} z term=${term.z} film=${film.z}; activeElement=${await ev('T.active()')}`);
    await clickLabel('.xp-task', 'Terminal');
    term = await WIN('Terminal');
    check('d5 taskbar click on the focused window minimizes it', term.hidden && term.inert, `hidden=${term.hidden} inert=${term.inert}`);
    await clickLabel('.xp-task', 'Terminal');
    await clickLabel('.xp-task', 'Reveal film');
    film = await WIN('Reveal film'); term = await WIN('Terminal');
    check('d6 taskbar click on an unfocused visible window focuses it (does not minimize)', film.active && !film.hidden && film.z > term.z, `film active=${film.active} hidden=${film.hidden}`);
    await clickLabel('.xp-task', 'Reveal film');
    film = await WIN('Reveal film'); term = await WIN('Terminal');
    check('d7a minimizing the focused Film hands focus to the visible Terminal', film.hidden && !term.hidden && term.active, `film hidden=${film.hidden} term hidden=${term.hidden} term active=${term.active}`);
    await clickLabel('.xp-task', 'Terminal');
    const bothMin = await ev('T.wins().every(function(w){return w.hidden&&w.inert})');
    await clickLabel('.xp-task', 'Reveal film');
    film = await WIN('Reveal film'); term = await WIN('Terminal');
    check('d7b minimize both, restore one: the other stays minimized', bothMin && !film.hidden && term.hidden && film.active, `both minimized=${bothMin}; film hidden=${film.hidden} active=${film.active}; term hidden=${term.hidden}`);
  });

  /* ================= e. maximize / restore ================= */
  await group('e. maximize and restore', async () => {
    await load();
    const FILM = 'Reveal film';
    const L = await ev('T.layer()'), w0 = await WIN(FILM);
    await clickSel(cap(FILM, 'Maximize'));
    let w1 = await WIN(FILM);
    const lab1 = await ev(`document.querySelector('.xp-win .xp-cap[data-act=max]').getAttribute('aria-label')`);
    check('e1 Maximize fills the desktop area, label becomes Restore', w1.max && Math.abs(w1.r.x - L.x) < 0.6 && Math.abs(w1.r.y - L.y) < 0.6 && Math.abs(w1.r.w - L.w) < 0.6 && Math.abs(w1.r.h - L.h) < 0.6 && lab1 === 'Restore', `window ${fmt(w1.r)} layer ${fmt(L)} label=${lab1}`);
    await shot('e-maximized');
    const lpm = await leaf(`.xp-win[aria-label=${J(FILM)}] .xp-title`), tm = await must(`.xp-win[aria-label=${J(FILM)}] .xp-title`), scr2 = await ev('T.screen()');
    check('e1b maximized title bar clears the leaves (no opaque leaf pixel under it) and sits below the overhang', lpm === 0 && tm.y > scr2.y + 5, `${lpm} leaf pixels under the title bar; title top ${f1(tm.y - scr2.y)} px below the glass top`);
    const nm = C(await must(`.xp-win[aria-label=${J(FILM)}] .xp-name`));
    await dragMouse(nm.x, nm.y, nm.x + 80, nm.y + 50, 6);
    const w1b = await WIN(FILM);
    check('e2 a maximized window cannot be dragged', Math.abs(w1b.r.x - w1.r.x) < 0.6 && Math.abs(w1b.r.y - w1.r.y) < 0.6 && w1b.max, `before ${fmt(w1.r)} after ${fmt(w1b.r)}`);
    await clickSel(cap(FILM, 'Restore'));
    let w2 = await WIN(FILM);
    check('e3 Restore returns to the previous box', !w2.max && Math.abs(w2.r.x - w0.r.x) < 0.6 && Math.abs(w2.r.y - w0.r.y) < 0.6 && Math.abs(w2.r.w - w0.r.w) < 0.6 && Math.abs(w2.r.h - w0.r.h) < 0.6, `before ${fmt(w0.r)} after ${fmt(w2.r)}`);
    const nm2 = C(await must(`.xp-win[aria-label=${J(FILM)}] .xp-name`));
    await click(nm2.x, nm2.y, 2);
    let w3 = await WIN(FILM);
    check('e4 double-click on the title bar maximizes', w3.max, `max=${w3.max} window ${fmt(w3.r)}`);
    const nm3 = C(await must(`.xp-win[aria-label=${J(FILM)}] .xp-name`));
    await click(nm3.x, nm3.y, 2);
    let w4 = await WIN(FILM);
    check('e5 second double-click restores', !w4.max && Math.abs(w4.r.x - w0.r.x) < 0.6 && Math.abs(w4.r.w - w0.r.w) < 0.6, `max=${w4.max} window ${fmt(w4.r)} (original ${fmt(w0.r)})`);
    /* maximize then minimize then restore from taskbar keeps maximized */
    await clickSel(cap(FILM, 'Maximize')); await clickSel(cap(FILM, 'Minimize')); await clickLabel('.xp-task', FILM);
    const w5 = await WIN(FILM);
    check('e6 maximized + minimized + restored from taskbar stays maximized and visible', w5.max && !w5.hidden && Math.abs(w5.r.w - L.w) < 0.6, `max=${w5.max} hidden=${w5.hidden} ${fmt(w5.r)}`);
  });

  /* ================= f. close ================= */
  await group('f. close with the button and with Esc', async () => {
    await load();
    await icon('Terminal');
    await clickSel(cap('Terminal', 'Close'));
    let wins = await ev('T.wins()'), tasks = await ev('T.tasks()');
    check('f1 Close button removes the window and its taskbar button, Film becomes active', !wins.find((w) => w.label === 'Terminal') && !tasks.find((t) => t.name === 'Terminal') && wins.find((w) => w.label === 'Reveal film').active, `windows=${wins.map((w) => w.label)} tasks=${tasks.map((t) => t.name)}`);
    check('f2 after Close focus returns to that app\'s desktop icon', (await ev('T.active()')).includes('xp-icon') && (await ev('T.active()')).includes('Terminal'), `activeElement=${await ev('T.active()')}`);
    /* Esc with focus inside the window */
    await icon('Terminal');
    await press('Escape'); await sleep(80);
    wins = await ev('T.wins()');
    check('f3 Esc closes the focused window (focus in Terminal input)', !wins.find((w) => w.label === 'Terminal') && wins.length === 1, `windows=${wins.map((w) => w.label)}; activeElement=${await ev('T.active()')}`);
    /* Esc after clicking the Film title bar */
    const nm = C(await must(`.xp-win[aria-label="Reveal film"] .xp-name`));
    await click(nm.x, nm.y);
    await press('Escape'); await sleep(80);
    wins = await ev('T.wins()');
    check('f4 Esc closes the focused window (focus on the window frame after a title click)', wins.length === 0, `windows=${wins.map((w) => w.label)}; activeElement=${await ev('T.active()')}`);
    /* Esc with two windows: closes only the focused one */
    await load(); await icon('Night Market');
    await press('Escape'); await sleep(80);
    wins = await ev('T.wins()');
    check('f5 Esc with two windows closes only the focused (top) one', wins.length === 1 && wins[0].label === 'Reveal film' && wins[0].active, `windows=${wins.map((w) => w.label + (w.active ? '*' : ''))}`);
    /* Esc when focus is outside the screen */
    await ev('document.activeElement && document.activeElement.blur()');
    await press('Escape'); await sleep(80);
    wins = await ev('T.wins()');
    log(`info Esc with no focus inside the desktop: windows=${wins.map((w) => w.label)} (expected: nothing happens, root listener only)`);
  });

  /* ================= g. keyboard only ================= */
  let sweepStops = [];
  async function sweep(tag, max, shotN) {
    const stops = [];
    for (let i = 0; i < max; i++) {
      await press('Tab'); await sleep(50);
      const info = await ev('T.ring()');
      if (!info) { stops.push({ i: i + 1, el: 'body (focus left the page content)' }); break; }
      info.i = i + 1; stops.push(info);
      if (i < shotN) await shot(`${tag}-tab${String(i + 1).padStart(2, '0')}`, '.crt-screen', 1, 10);
    }
    return stops;
  }
  await group('g. keyboard only', async () => {
    await load();
    const stops = await sweep('g-tab', 40, 12);
    sweepStops = stops;
    log('Tab order (fresh load, film window only):');
    stops.forEach((s) => log(`  ${s.i}. ${s.el}${s.ringOn === undefined ? '' : ` ring=${s.ringOn ? 'yes' : 'NO'} fv=${s.fv} outline="${s.outline}" off=${s.offset}${s.clipped.length ? ' CLIPPED ' + s.clipped.join('; ') : ''}`}`));
    const real = stops.filter((s) => s.ringOn !== undefined);
    const noRing = real.filter((s) => !s.ringOn);
    check('g1 every Tab stop shows a visible focus indicator (computed outline)', noRing.length === 0 && real.length > 0, `${real.length} stops, without ring: ${noRing.map((s) => s.el).join(', ') || 'none'}`);
    const clipped = real.filter((s) => s.clipped.length);
    check('g2 no focus ring is clipped by an overflow:hidden ancestor', clipped.length === 0, clipped.length ? clipped.map((s) => s.el + ' -> ' + s.clipped.join('; ')).join(' || ') : 'none clipped');
    const last = stops[stops.length - 1];
    check('g3 Tab order ends (focus leaves the desktop) instead of trapping', last.el.startsWith('body'), `last stop: ${last.el}, ${stops.length} presses`);
    const expectOrder = ['Reveal film', 'Night Market', 'about.txt', 'Terminal', 'Minimize', 'Maximize', 'Close', 'the film', 'Reveal film'];
    const names = real.map((s) => s.el);
    check('g4 order is icons, then the window controls (Min, Max, Close), its content, then the taskbar', expectOrder.every((n, k) => names[k] && names[k].includes(n)), names.join(' > '));
    /* shift-tab back */
    await press('Tab', { shift: true }); await sleep(60);
    const back = await ev('T.active()');
    log(`info Shift+Tab from the end lands on: ${back}`);
    /* Enter on the 2nd icon */
    await load();
    await press('Tab'); await press('Tab'); await sleep(50);
    const on2 = await ev('T.active()');
    await press('Enter'); await sleep(120);
    let wins = await ev('T.wins()');
    check('g5 Enter on the Night Market icon opens it, focus moves into it', on2.includes('Night Market') && wins.find((w) => w.label === 'Night Market') && (await ev('T.active()')).includes('app-market'), `on icon=${on2}; windows=${wins.map((w) => w.label)}; activeElement=${await ev('T.active()')}`);
    await shot('g-enter-market', '.crt-screen', 1, 10);
    await load();
    for (let i = 0; i < 4; i++) await press('Tab');
    const on4 = await ev('T.active()');
    await press(' '); await sleep(120);
    wins = await ev('T.wins()');
    check('g6 Space on the Terminal icon opens it, focus moves into the input', on4.includes('Terminal') && wins.find((w) => w.label === 'Terminal') && (await ev('T.active()')).startsWith('input.app-input'), `on icon=${on4}; windows=${wins.map((w) => w.label)}; activeElement=${await ev('T.active()')}`);
    await shot('g-space-terminal', '.crt-screen', 1, 10);
    /* Enter on a window button: Close via keyboard */
    await load();
    for (let i = 0; i < 7; i++) await press('Tab');
    const on7 = await ev('T.active()');
    await press('Enter'); await sleep(100);
    wins = await ev('T.wins()');
    check('g7 Enter on the Close button (7th Tab stop) closes the window', on7.includes('Close') && wins.length === 0, `7th stop=${on7}; windows left=${wins.length}; activeElement=${await ev('T.active()')}`);
  });

  /* full sweep with four windows, one minimized, one closed-and-reopened */
  await group('g-full. Tab sweep with all four windows open and Terminal minimized', async () => {
    await load();
    await ev(`(function(){var o=document.querySelector('.crt-screen').OS;o.open('market',false);o.open('notes',false);o.open('terminal',false);})()`);
    await clickSel(cap('Terminal', 'Minimize'));
    await click(5, 5);   /* real click on empty page: sets the Tab starting point before the desktop */
    const stops = await sweep('gfull-tab', 60, 30);
    log(`Tab stops: ${stops.length}`);
    stops.forEach((s) => log(`  ${s.i}. ${s.el}${s.win ? ` [win ${s.win.label}${s.win.hidden || s.win.inert ? ' HIDDEN/INERT' : ''}]` : ''}${s.ringOn === undefined ? '' : ' ring=' + (s.ringOn ? 'yes' : 'NO')}${s.clipped && s.clipped.length ? ' CLIPPED ' + s.clipped.join('; ') : ''}`));
    const real = stops.filter((s) => s.ringOn !== undefined);
    check('g8 no Tab stop inside a minimized (hidden/inert) window', real.every((s) => !(s.win && (s.win.hidden || s.win.inert))), `stops in hidden windows: ${real.filter((s) => s.win && (s.win.hidden || s.win.inert)).map((s) => s.el).join(', ') || 'none'}`);
    const noRing = real.filter((s) => !s.ringOn);
    check('g9 every Tab stop (all apps) shows a visible focus indicator', noRing.length === 0 && real.length > 0, `${real.length} stops, without ring: ${noRing.map((s) => s.el).join(', ') || 'none'}`);
    const clipped = real.filter((s) => s.clipped.length);
    check('g10 no focus ring clipped (all apps)', clipped.length === 0, clipped.length ? clipped.map((s) => s.el + ' -> ' + s.clipped.join('; ')).join(' || ') : 'none');
    /* tab stops that never lead to Market thumbs etc: list Market and Notes stops */
    log('info Market stops: ' + real.filter((s) => s.win && s.win.label === 'Night Market').map((s) => s.el).join(' > '));
  });

  /* ================= h. Night Market ================= */
  await group('h. Night Market', async () => {
    await load();
    await icon('Night Market');
    const st = () => ev(`(function(){var i=document.querySelector('.app-shot');var th=[].slice.call(document.querySelectorAll('.app-thumb'));var cur=th.map(function(t,k){return t.getAttribute('aria-current')==='true'?k:-1}).filter(function(k){return k>=0});return {alt:i.alt,cur:cur,active:T.active()};})()`);
    const ALTS = ['A lantern-lit market street at dusk', 'A plaza under a cherry tree at dusk', 'A red bridge over a river in afternoon light', 'A shrine gate at night with lanterns'];
    let s = await st();
    check('h1 opens on render 1 with the Night Market body focused', s.cur[0] === 0 && s.alt === ALTS[0] && s.active.includes('app-market'), J(s));
    const seq = [];
    for (let k = 0; k < 4; k++) { await press('ArrowRight'); seq.push((await st()).cur[0]); }
    check('h2 ArrowRight x4 goes 1,2,3,0 (wraps at the end)', J(seq) === '[1,2,3,0]', `index sequence ${J(seq)}`);
    const seq2 = [];
    for (let k = 0; k < 2; k++) { await press('ArrowLeft'); seq2.push((await st()).cur[0]); }
    check('h3 ArrowLeft from the first goes 3,2 (wraps at the start)', J(seq2) === '[3,2]', `index sequence ${J(seq2)}`);
    s = await st();
    check('h4 the shown image alt matches the current thumbnail', s.alt === ALTS[2], `alt=${J(s.alt)}`);
    await clickSel('.app-next'); s = await st();
    const afterNext = s.cur[0];
    await clickSel('.app-prev'); await clickSel('.app-prev'); s = await st();
    check('h5 Next button advances (2 to 3), Previous x2 goes back (3 to 1)', afterNext === 3 && s.cur[0] === 1, `after Next=${afterNext}, after Prev,Prev=${s.cur[0]}; activeElement=${s.active}`);
    await clickSel('.app-prev'); await clickSel('.app-prev'); s = await st();
    check('h6 Previous at the first render wraps to the last', s.cur[0] === 3, `index=${s.cur[0]}`);
    const th = await ev(`T.r(document.querySelectorAll('.app-thumb')[1])`);
    await click(C(th).x, C(th).y); s = await st();
    check('h7 clicking thumbnail 2 shows render 2', s.cur[0] === 1 && s.alt === ALTS[1], J(s));
    await press('ArrowRight'); s = await st();
    check('h8 arrow keys work while a thumbnail button holds focus (event bubbles)', s.cur[0] === 2, `active=${s.active} index=${s.cur[0]}`);
    await shot('h-market');
  });

  /* ================= i. Terminal ================= */
  await group('i. Terminal', async () => {
    await load();
    await icon('Terminal');
    const lines = () => ev(`[].slice.call(document.querySelectorAll('.app-line')).map(function(l){return l.textContent})`);
    const first = await lines();
    const EXP = ['> whoami', 'Harry Xie, also Elixir', '> role', 'Founder of Aether', '> github', '12 public repositories, 569 contributions in the last year', '> discord', '@ogexr'];
    check('i1 four fact lines are printed at once (8 rows)', J(first) === J(EXP), J(first));
    check('i2 the input is focused on open', (await ev('T.active()')).startsWith('input.app-input'), await ev('T.active()'));
    await shot('i-terminal-open');
    const cases = [['help', ['> help', 'help, whoami, work, contact, clear']], ['whoami', ['> whoami', 'Harry Xie, also Elixir']], ['work', ['> work', 'Reveal film, Night Market, about.txt']],
      ['contact', ['> contact', 'Discord: @ogexr']], ['foo', ['> foo', 'Unknown command. Type help.']], ['HeLp ', ['> help', 'help, whoami, work, contact, clear']],
      ['toString', ['> tostring', 'Unknown command. Type help.']], ['__proto__', ['> __proto__', 'Unknown command. Type help.']]];
    for (const [cmd, exp] of cases) {
      const n0 = (await lines()).length;
      await typeText(cmd); await press('Enter'); await sleep(40);
      const got = (await lines()).slice(n0);
      const inputVal = await ev(`document.querySelector('.app-input').value`);
      check(`i3 command ${J(cmd)}`, J(got) === J(exp) && inputVal === '', `got ${J(got)} input afterwards=${J(inputVal)}`);
    }
    const n1 = (await lines()).length; await press('Enter'); await sleep(40);
    check('i4 empty Enter prints nothing', (await lines()).length === n1, `rows before ${n1} after ${(await lines()).length}`);
    await shot('i-terminal-commands');
    await typeText('clear'); await press('Enter'); await sleep(40);
    check('i5 clear empties the output', (await lines()).length === 0, `rows=${(await lines()).length}`);
    await typeText('help'); await press('Enter'); await sleep(40);
    check('i6 still accepts a command after clear', J(await lines()) === J(['> help', 'help, whoami, work, contact, clear']), J(await lines()));
    const rings = await ev(`(function(){var i=document.querySelector('.app-input'),p=document.querySelector('.app-prompt');var a=getComputedStyle(i),b=getComputedStyle(p);return {input:a.outlineStyle+' '+a.outlineWidth,prompt:b.outlineStyle+' '+b.outlineWidth};})()`);
    check('i9 one focus ring around the prompt (not two nested rings)', !(rings.input.startsWith('solid') && rings.prompt.startsWith('solid')), `input outline "${rings.input}", prompt (label) outline "${rings.prompt}"`);
    check('i7 input keeps focus throughout', (await ev('T.active()')).startsWith('input.app-input'), await ev('T.active()'));
    const tr = await ev(`(function(){var o=document.querySelector('.app-out');return {sh:o.scrollHeight,ch:o.clientHeight,top:o.scrollTop};})()`);
    for (let k = 0; k < 12; k++) { await typeText('help'); await press('Enter'); }
    const tr2 = await ev(`(function(){var o=document.querySelector('.app-out');return {sh:o.scrollHeight,ch:o.clientHeight,top:o.scrollTop};})()`);
    check('i8 output scrolls to the newest line after many commands', tr2.sh <= tr2.ch + 1 || Math.abs(tr2.top - (tr2.sh - tr2.ch)) <= 1, `scrollHeight=${tr2.sh} clientHeight=${tr2.ch} scrollTop=${f1(tr2.top)}`);
    await shot('i-terminal-scrolled');
  });

  /* ================= k. inert and names ================= */
  await group('k. inert states and accessible names', async () => {
    await load();
    await icon('Night Market'); await icon('about.txt'); await icon('Terminal');
    await clickSel(cap('Night Market', 'Minimize'));
    await clickSel(cap('about.txt', 'Close'));
    const wins = await ev('T.wins()');
    log('window states: ' + wins.map((w) => `${w.label}{hidden:${w.hidden},inert:${w.inert},display:${w.display}}`).join(' '));
    check('k1 minimized window is hidden and inert', wins.find((w) => w.label === 'Night Market').hidden && wins.find((w) => w.label === 'Night Market').inert, J(wins.find((w) => w.label === 'Night Market')));
    check('k2 closed window is removed from the DOM', !wins.find((w) => w.label === 'about.txt'), `windows=${wins.map((w) => w.label)}`);
    check('k3 visible windows are not inert', wins.filter((w) => !w.hidden).every((w) => !w.inert), 'ok');
    const dom = await ev(`[].slice.call(document.querySelectorAll('.xp button, .xp input, .xp [tabindex], .xp video, .xp img')).map(function(e){var n=e.getAttribute('aria-label')||(e.tagName==='IMG'?e.getAttribute('alt'):'')||(e.textContent||'').trim();return {el:T.desc(e),name:n,tag:e.tagName,tab:e.getAttribute('tabindex')};})`);
    const unnamed = dom.filter((d) => (d.tag === 'BUTTON' || d.tag === 'INPUT' || d.tag === 'VIDEO') && !d.name);
    check('k4 every button, input, video has aria-label or text (DOM check)', unnamed.length === 0, `${dom.filter((d) => d.tag === 'BUTTON').length} buttons checked, unnamed: ${unnamed.map((u) => u.el).join(', ') || 'none'}`);
    const ax = await send('Accessibility.getFullAXTree');
    const rows = ax.nodes.filter((n) => !n.ignored && ['button', 'textbox', 'dialog', 'video'].includes(n.role?.value));
    const axUnnamed = rows.filter((n) => !(n.name && n.name.value && n.name.value.trim()));
    log('AX tree named controls: ' + rows.map((n) => `${n.role.value}:"${n.name?.value || ''}"`).join(' | '));
    check('k5 every button / textbox / dialog in the accessibility tree has a name', axUnnamed.length === 0 && rows.length > 0, `${rows.length} nodes, unnamed: ${axUnnamed.map((n) => n.role.value).join(', ') || 'none'}`);
    const hiddenInAx = ax.nodes.filter((n) => !n.ignored && n.name && /Night Market/.test(n.name.value || '') && ['dialog'].includes(n.role?.value));
    check('k6 the minimized Night Market dialog is absent from the accessibility tree', hiddenInAx.length === 0, `dialog nodes named Night Market in AX: ${hiddenInAx.length}`);
  });

  /* ================= m. colour, labels, inset ================= */
  await group('m. hover colour, caret, icon labels', async () => {
    await load();
    const FILM = 'Reveal film';
    const bg = async (name) => { const r = C(await must(cap(FILM, name))); await move(r.x, r.y); await sleep(250); return ev(`getComputedStyle(document.querySelector(${J(cap(FILM, name))})).backgroundColor`); };
    const mq = await ev(`matchMedia('(hover: hover) and (pointer: fine)').matches`);
    const bMin = await bg('Minimize'), bMax = await bg('Maximize'), bX = await bg('Close');
    check('m1 Close hover uses the same ice hover as Minimize and Maximize (no furnace colour)', mq && bX === bMin && bMin === bMax && bX === 'rgb(238, 248, 250)', `(hover: hover) and (pointer: fine) matches=${mq}; hover backgrounds: Minimize ${bMin}, Maximize ${bMax}, Close ${bX}`);
    await icon('Terminal');
    const caret = await ev(`getComputedStyle(document.querySelector('.app-input')).caretColor`);
    check('m2 Terminal caret is aether ice', caret === 'rgb(238, 248, 250)', `caret-color=${caret}`);
    const ts = await ev(`getComputedStyle(document.querySelector('.xp-icon')).textShadow`);
    const navy = (ts.match(/rgb\(10, 25, 48\)/g) || []).length, offs = ts.match(/-?\d+px -?\d+px 0px/g) || [];
    check('m3 icon label has a four-side 1 px navy outline (text-shadow)', navy === 4 && J(offs.sort()) === J(['-1px 0px 0px', '0px -1px 0px', '0px 1px 0px', '1px 0px 0px'].sort()) && !/rgb\(154, 44, 18\)/.test(ts), `text-shadow: ${ts}`);
    const furn = await ev(`[].slice.call(document.styleSheets).filter(function(s){return /crt-os/.test(s.href||'')}).map(function(s){return [].slice.call(s.cssRules).map(function(r){return r.cssText}).join('')}).join('').match(/furnace/g)`);
    check('m4 no furnace colour is used anywhere in the desktop stylesheet', !furn, `furnace mentions in crt-os.css: ${furn ? furn.length : 0}`);
  });

  /* ================= j. narrow screen ================= */
  await group('j. narrow screen 390x844 mobile', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await load();
    await shot('j-narrow-first', '.crt-screen', 2, 0);
    await shot('j-narrow-computer', '.crt', 2, 0);
    const info = await ev(`(function(){var x=document.querySelector('.xp');return {narrow:x.classList.contains('is-narrow'),rootW:x.clientWidth,vw:innerWidth,wins:T.wins(),layer:T.layer(),screen:T.screen(),desk:T.q('.xp-desk'),bar:T.q('.xp-bar'),
      icons:[].slice.call(document.querySelectorAll('.xp-icon')).map(function(b){var r=T.r(b);var n=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);return {label:T.label(b),r:r,topmost:b.contains(n),leaf:T.leafPixels(r)};}),
      tasks:T.tasks().length,mq:matchMedia('(hover: hover)').matches};})()`);
    log(`info innerWidth=${info.vw}, screen element ${fmt(info.screen)}, root clientWidth=${info.rootW}, hover:hover=${info.mq}, desktop ${fmt(info.desk)}, taskbar ${fmt(info.bar)}`);
    check('j1 screen is under 420 px wide and the desktop is in narrow mode', info.rootW < 420 && info.narrow, `root width ${info.rootW}px is-narrow=${info.narrow}`);
    check('j1b screen is at least 320 px wide and 4:3 at a 390 px viewport', info.screen.w >= 320 && Math.abs(info.screen.w / info.screen.h - 4 / 3) < 0.02, `screen ${fmt(info.screen)} ratio ${f1(info.screen.w / info.screen.h * 100) / 100}; canvas data-grid ${await ev(`document.querySelector('.crt').getAttribute('data-grid')`)}`);
    const sw = await ev(`(function(){var c=T.q('.crt');return {crt:c,docSw:document.documentElement.scrollWidth,vw:innerWidth,st:document.querySelector('.crt').style.getPropertyValue('--st'),desk:T.q('.xp-wins')};})()`);
    check('j1c page does not scroll sideways (scrollWidth equals the viewport) and the canvas is full bleed', sw.docSw === sw.vw && Math.abs(sw.crt.x) < 0.6 && Math.abs(sw.crt.w - sw.vw) < 0.6, `scrollWidth ${sw.docSw} viewport ${sw.vw}; canvas ${fmt(sw.crt)}`);
    check('j2 first view is the desktop: no window open, no taskbar button, four icons visible and topmost', info.wins.length === 0 && info.tasks === 0 && info.icons.length === 4 && info.icons.every((i) => i.topmost && inside(i.r, info.screen)), `windows=${info.wins.length} tasks=${info.tasks} icons=${info.icons.map((i) => i.label + (i.topmost ? ':top' : ':COVERED') + ' ' + fmt(i.r)).join('; ')}`);
    check('j2b no icon lies under a leaf', info.icons.every((i) => i.leaf === 0), `leaf pixels under icons: ${info.icons.map((i) => i.label + '=' + i.leaf).join(', ')}`);
    const measures = [];
    const take = async (label, sel) => { const m = await ev(`T.measure(${J(sel)})`); m.forEach((x) => measures.push({ group: label, ...x })); return m; };
    await take('desktop icons', '.xp-icon');
    const apps = ['Reveal film', 'Night Market', 'Terminal', 'about.txt'];
    for (let k = 0; k < apps.length; k++) {
      const label = apps[k];
      const ic = C(await ev(`T.find('.xp-icon',${J(label)})`));
      await tap(ic.x, ic.y);
      const wv = await WIN(label), lay = await ev('T.layer()');
      check(`j3 tap on the ${label} icon opens it maximized and active`, !!wv && !wv.hidden && wv.active && Math.abs(wv.r.w - lay.w) < 0.6 && Math.abs(wv.r.h - lay.h) < 0.6 && Math.abs(wv.r.y - lay.y) < 0.6, wv ? `window ${fmt(wv.r)} layer ${fmt(lay)}` : 'not opened');
      const lpn = await leaf(`.xp-win[aria-label=${J(label)}] .xp-title`);
      check(`j3b ${label}: title bar has no leaf pixel over it`, lpn === 0, `${lpn} leaf pixels`);
      await shot(`j-narrow-${label.replace(/\W/g, '')}`, '.crt-screen', 2, 0);
      await take(`${label} controls`, `.xp-win[aria-label=${J(label)}] button, .xp-win[aria-label=${J(label)}] .app-prompt`);
      if (label === 'Terminal') {
        const tb = await ev(`(function(){return {body:T.q('.xp-win[aria-label="Terminal"] .xp-body'),out:T.q('.app-out'),prompt:T.q('.app-prompt'),layer:T.layer()};})()`);
        log(`info NARROW Terminal: window area ${f1(tb.layer.w)}x${f1(tb.layer.h)}, body ${f1(tb.body.w)}x${f1(tb.body.h)}, output ${f1(tb.out.h)} high, prompt ${f1(tb.prompt.h)} high`);
      }
      if (k === 0) {
        const maxDisp = await ev(`getComputedStyle(document.querySelector('[data-act=max]')).display`);
        check('j4 the Maximize button is hidden in narrow mode', maxDisp === 'none', `display=${maxDisp}`);
        const nm = C(await must(`.xp-win[aria-label="Reveal film"] .xp-name`)), w0 = (await WIN(label)).r;
        await touchDrag(nm.x, nm.y, nm.x + 60, nm.y + 40);
        const w2 = await WIN(label);
        await dragMouse(nm.x, nm.y, nm.x + 60, nm.y + 40, 6);
        const w3 = await WIN(label);
        check('j5 a drag attempt (touch, then mouse) on the title bar moves nothing', Math.abs(w2.r.x - w0.x) < 0.6 && Math.abs(w2.r.y - w0.y) < 0.6 && Math.abs(w3.r.x - w0.x) < 0.6 && Math.abs(w3.r.y - w0.y) < 0.6 && !w3.dragging, `start ${fmt(w0)} after touch ${fmt(w2.r)} after mouse ${fmt(w3.r)}`);
      }
      if (k < apps.length - 1) {
        const m2 = C(await must(cap(label, 'Minimize'))); await tap(m2.x, m2.y);
        check(`j6 tap on Minimize hides ${label} and shows the icons again`, (await WIN(label)).hidden, 'hidden');
      }
    }
    await take('taskbar (4 tasks)', '.xp-task');
    log('measured controls (box = element border box; pseudo = ::before box if any; hit = elementFromPoint extent through the centre, 0.5 px steps, capped at 80 px per side):');
    measures.forEach((m) => log(`  [${m.group}] ${m.name} box ${m.box.w}x${m.box.h} pseudo ${m.pseudo ? m.pseudo.w + 'x' + m.pseudo.h : 'none'} hit ${m.hit.w}x${m.hit.h} (L${m.L} R${m.R} U${m.U} D${m.D})`));
    const ctl = measures.filter((m) => !m.name.startsWith('label.app-prompt'));
    const minHit = ctl.reduce((a, b) => (Math.min(b.hit.w, b.hit.h) < Math.min(a.hit.w, a.hit.h) ? b : a));
    log(`info smallest measured hit area: ${minHit.name} ${minHit.hit.w}x${minHit.hit.h} (box ${minHit.box.w}x${minHit.box.h})`);
    for (const g of [...new Set(measures.map((m) => m.group))]) {
      const gm = measures.filter((m) => m.group === g);
      const bad = gm.filter((m) => m.hit.w < 43 || m.hit.h < 43);
      check(`j7 hit area >= 44 px both ways (1 px probe tolerance): ${g}`, bad.length === 0, bad.length ? bad.map((m) => `${m.name} ${m.hit.w}x${m.hit.h}`).join('; ') : `${gm.length} controls, smallest ${Math.min(...gm.map((m) => Math.min(m.hit.w, m.hit.h)))}`);
    }
    const leafy = measures.filter((m) => m.leaf > 0);
    check('j7c no leaf pixel lies over any measured control (caps, taskbar buttons, icons, app buttons, thumbs, prompt)', leafy.length === 0, leafy.length ? leafy.map((m) => `${m.group} ${m.name}=${m.leaf}`).join('; ') : `${measures.length} controls checked`);
    const barLeaf = await ev(`T.leafPixels(T.q('.xp-bar'))`);
    check('j7d no leaf pixel over the taskbar or the clock', barLeaf === 0, `${barLeaf} pixels`);
    const tk = await ev(`(function(){var b=T.q('.xp-bar'),c=T.q('.xp-clock'),t=T.tasks();return {bar:b,clock:c,tasks:t.map(function(x){return x.r;})};})()`);
    check('j7b four taskbar buttons and the clock fit inside the bar', tk.tasks.length === 4 && tk.tasks.every((r) => r.x >= tk.bar.x - 0.5 && r.x + r.w <= tk.clock.x + 1) && tk.clock.x + tk.clock.w <= tk.bar.x + tk.bar.w + 0.5, `bar ${fmt(tk.bar)} clock ${fmt(tk.clock)} tasks ${tk.tasks.map(fmt).join(' ')}`);
    const inputFs = await ev(`getComputedStyle(document.querySelector('.app-input')).fontSize`);
    check('j8 Terminal input font-size is 16px (no iOS zoom)', inputFs === '16px', `font-size=${inputFs}`);
    await shot('j-narrow-end', '.crt-screen', 2, 0);
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  });

  /* ================= p. page fixes ================= */
  await group('p. page fixes (page2.html: the real chapters, About grid, ui.js, chapters.js, github.js)', async () => {
    const before = pageErrors.length;
    const PAGE2 = 'file://' + DIR + '/page2.html', READY = 'document.querySelectorAll("#activity span").length>0 && document.querySelectorAll(".xp-icon").length===4';
    await load(PAGE2, READY);
    const errs = pageErrors.slice(before).filter((e) => !/media\/|Failed to load resource|net::ERR_FILE|#tile-bg|#gem|#logo/.test(e));
    check('p1 page scripts (ui.js with fewer .split, chapters.js, github.js, OS) run with no JavaScript error', errs.length === 0, errs.slice(0, 3).join(' | ') || 'no errors');
    const d = await ev(`(function(){
      function lines(el){var tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),out={},n;while((n=tw.nextNode())){var re=/\\S+/g,m;while((m=re.exec(n.nodeValue))){var r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);var t=Math.round(r.getClientRects()[0].top);(out[t]=out[t]||[]).push(m[0]);}}return Object.keys(out).sort(function(a,b){return a-b}).map(function(k){return out[k].join(' ')});}
      var work=document.querySelector('#work h2'),about=document.querySelector('#about h2'),say=document.querySelector('.say');
      var cs=getComputedStyle,name=document.querySelector('.name'),grid=document.querySelector('.about-grid'),por=T.q('.portrait'),who=T.q('.who'),year=document.querySelector('.year'),g=document.getElementById('activity');
      return {split:document.querySelectorAll('.split').length,splitSpans:document.querySelectorAll('.split span').length,
        workSpans:work.children.length,aboutSpans:about.children.length,workOp:cs(work).opacity,aboutOp:cs(about).opacity,workR:T.r(work),aboutR:T.r(about),
        wrap:(cs(say).textWrapStyle || cs(say).textWrap),lines:lines(say),pills:document.querySelectorAll('#about .pill').length,
        nameFs:cs(name).fontSize,nameW:cs(name).fontWeight,nameFam:cs(name).fontFamily,nameLs:cs(name).letterSpacing,
        gridR:T.r(grid),por:por,who:who,yearR:T.r(year),yearOv:cs(year).overflowX,yearSw:year.scrollWidth,yearCw:year.clientWidth,
        cells:g.querySelectorAll('span').length,weeks:window.CONTRIB.weeks.length,gfs:cs(g).fontSize,docSw:document.documentElement.scrollWidth,vw:innerWidth,
        gcs:parseFloat(cs(grid).paddingLeft)};
    })()`);
    log(`info about grid ${fmt(d.gridR)} portrait ${fmt(d.por)} who ${fmt(d.who)} year ${fmt(d.yearR)} grid-days font ${d.gfs}, weeks in data ${d.weeks}, cells ${d.cells}`);
    check('p2 only the Contact heading splits into letters (one .split)', d.split === 1 && d.splitSpans === 7 && d.workSpans === 0 && d.aboutSpans === 0, `.split elements=${d.split}, letters=${d.splitSpans}, Work child spans=${d.workSpans}, About child spans=${d.aboutSpans}`);
    check('p3 Work and About headings are visible at rest', d.workOp === '1' && d.aboutOp === '1' && d.workR.h > 20 && d.aboutR.h > 20, `opacity Work ${d.workOp} About ${d.aboutOp}; boxes ${fmt(d.workR)} ${fmt(d.aboutR)}`);
    check('p4 hero sentence uses text-wrap: balance and the last line is not one word', d.wrap === 'balance' && d.lines[d.lines.length - 1].split(' ').length >= 2, `text-wrap-style=${d.wrap}; lines=${J(d.lines)}`);
    check('p5 About has no "Follow on GitHub" pill', d.pills === 0, `pills in #about: ${d.pills}`);
    check('p6 name "Elixir" is at the title size: 400 28px Newsreader', d.nameFs === '28px' && d.nameW === '400' && /Newsreader/.test(d.nameFam), `font-size ${d.nameFs}, weight ${d.nameW}, family ${d.nameFam}, letter-spacing ${d.nameLs}`);
    check('p7 row one: portrait left, name and counts on its right; row two: the year below, full content width', d.who.x >= d.por.x + d.por.w && d.who.y < d.por.y + d.por.h && d.yearR.y >= d.por.y + d.por.h - 1 && d.yearR.y >= d.who.y + d.who.h - 1 && Math.abs(d.yearR.w - d.gridR.w + d.gcs * 2) < 2, `portrait ${fmt(d.por)} who ${fmt(d.who)} year ${fmt(d.yearR)} grid ${fmt(d.gridR)}`);
    check('p8 the grid draws every week the data holds (53 weeks x 7 cells)', d.weeks === 53 && d.cells === d.weeks * 7, `data weeks=${d.weeks}, cells=${d.cells}`);
    check('p9 grid font-size is clamp(9px, 1.15vw, 18px) = 16.56px at 1440 and the year fits without scrolling', Math.abs(parseFloat(d.gfs) - 16.56) < 0.05 && d.yearSw <= d.yearCw + 1, `font-size ${d.gfs}; scrollWidth ${d.yearSw} clientWidth ${d.yearCw}`);
    await shot('p-about-1440', '#about', 1, 0).catch(() => {});

    /* chapters.js: no layout-forcing reads while scrolling */
    await ev(`(function(){window.__reads={chapters:0,all:0};var og=window.getComputedStyle;window.getComputedStyle=function(){window.__reads.all++;if(/chapters\\.js/.test(new Error().stack))window.__reads.chapters++;return og.apply(this,arguments);};
      var d=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetWidth'),og2=d.get;Object.defineProperty(HTMLElement.prototype,'offsetWidth',{configurable:true,get:function(){window.__reads.all++;if(/chapters\\.js/.test(new Error().stack))window.__reads.chapters++;return og2.call(this);}});})()`);
    await ev('getComputedStyle(document.body).display');
    const sane = await ev('window.__reads.all');
    await move(700, 400);
    for (let i = 0; i < 12; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 700, y: 400, deltaX: 0, deltaY: 400 }); await sleep(120); }
    await sleep(300);
    const rd = await ev('window.__reads'), sy = await ev('scrollY');
    check('p10 chapters.js reads no layout (offsetWidth / getComputedStyle) while scrolling the Aether scene', sane >= 1 && rd.chapters === 0, `instrument sanity (my own read counted)=${sane}; reads from chapters.js during ${sy}px of wheel scrolling: ${rd.chapters}`);
    const lk = await ev(`(function(){var l=document.querySelector('.lockup'),w=document.getElementById('wordmark');return {t:l.style.transform,tile:document.getElementById('gem-bg').style.opacity,clip:w.style.clipPath,top:window.Page.tracks.aether.top,span:window.Page.tracks.aether.span,p:window.Page.tracks.aether.p};})()`);
    log(`info after scrolling ${sy}px: aether progress ${f1(lk.p * 100) / 100}, lockup ${lk.t}, tile opacity ${lk.tile}, wordmark clip ${lk.clip}`);
    check('p11 the Aether animation still runs from the cached measure', lk.p > 0.5 && /translate3d\(/.test(lk.t) && lk.tile !== '' && lk.clip !== '', `progress ${lk.p}, lockup ${lk.t}`);
    await ev('window.scrollTo(0,0)');
    await sleep(400);
    const lk0 = await ev(`(function(){var l=document.querySelector('.lockup'),w=document.getElementById('wordmark');var x=parseFloat((l.style.transform.match(/translate3d\\(([-\\d.]+)px/)||[])[1]);return {x:x,expected:(w.offsetWidth+parseFloat(getComputedStyle(l).columnGap))/2,t:l.style.transform};})()`);
    check('p12 at scroll 0 the lockup offset equals the freshly measured half wordmark plus half gap', Math.abs(lk0.x - lk0.expected) <= 1, `applied ${lk0.x}px, fresh measure ${f1(lk0.expected)}px`);

    /* narrow: the year scrolls in its own box, starting at the newest week */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await load(PAGE2, READY);
    await sleep(300);
    const n = await ev(`(function(){var y=document.querySelector('.year'),g=document.getElementById('activity');return {ov:getComputedStyle(y).overflowX,sw:y.scrollWidth,cw:y.clientWidth,sl:y.scrollLeft,fs:getComputedStyle(g).fontSize,docSw:document.documentElement.scrollWidth,vw:innerWidth,yr:T.r(y),who:T.q('.who'),por:T.q('.portrait'),crt:T.q('.crt'),workH2:T.q('#work h2'),screen:T.screen(),grid:document.querySelector('.crt').getAttribute('data-grid')};})()`);
    check('p16 phone: the Work canvas is full bleed (edge to edge), the Work heading keeps its gutter', Math.abs(n.crt.x) < 0.6 && Math.abs(n.crt.w - n.vw) < 0.6 && Math.abs(n.workH2.x - 16) < 0.6, `canvas ${fmt(n.crt)}, heading left ${f1(n.workH2.x)}`);
    check('p17 phone: the page does not scroll sideways (scrollWidth equals the viewport) and the screen is at least 320 px wide, 4:3', n.docSw === n.vw && n.screen.w >= 320 && Math.abs(n.screen.w / n.screen.h - 4 / 3) < 0.02, `scrollWidth ${n.docSw} viewport ${n.vw}; screen ${fmt(n.screen)} grid ${n.grid}`);
    check('p13 under 720 px the year is its own overflow-x:auto box, wider than the screen, page itself does not scroll sideways', n.ov === 'auto' && n.sw > n.cw + 50 && n.docSw <= n.vw + 1, `overflow-x ${n.ov}; scrollWidth ${n.sw} clientWidth ${n.cw}; font ${n.fs}; document scrollWidth ${n.docSw} vs viewport ${n.vw}`);
    check('p14 the year starts scrolled to the newest week', Math.abs(n.sl + n.cw - n.sw) <= 2 && n.sl > 0, `scrollLeft ${f1(n.sl)} (max ${f1(n.sw - n.cw)})`);
    check('p15 phone layout is one column: portrait, then name and counts, then the year', n.who.y >= n.por.y + n.por.h - 1 && n.yr.y >= n.who.y + n.who.h - 1, `portrait ${fmt(n.por)} who ${fmt(n.who)} year ${fmt(n.yr)}`);
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  });

  /* ================= l. live resize wide -> narrow -> wide ================= */
  await group('l. live resize 1440 -> 390 -> 1440 with windows open', async () => {
    await load();
    await icon('Terminal');
    const c0 = C(await must(`.xp-win[aria-label="Reveal film"] .xp-name`));
    await dragMouse(c0.x, c0.y, c0.x - 50, c0.y + 40, 6);
    const w0 = (await WIN('Reveal film')).r, t0 = (await WIN('Terminal')).r;
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(500);
    const mid = await ev(`(function(){var x=document.querySelector('.xp');return {narrow:x.classList.contains('is-narrow'),w:x.clientWidth,wins:T.wins(),layer:T.layer()};})()`);
    const allMax = mid.wins.every((w) => Math.abs(w.r.w - mid.layer.w) < 0.6 && Math.abs(w.r.h - mid.layer.h) < 0.6);
    check('l1 shrinking the viewport switches to narrow mode and maximizes every window', mid.narrow && allMax, `root width ${mid.w}px narrow=${mid.narrow}; windows ${mid.wins.map((w) => w.label + ' ' + fmt(w.r)).join('; ')}`);
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    const w1 = (await WIN('Reveal film')).r, t1 = (await WIN('Terminal')).r, nar = await ev(`document.querySelector('.xp').classList.contains('is-narrow')`);
    check('l2 growing back restores the wide layout and the original window sizes', !nar && Math.abs(w1.w - w0.w) < 1 && Math.abs(w1.h - w0.h) < 1 && Math.abs(t1.w - t0.w) < 1, `narrow=${nar}; Film before ${fmt(w0)} after ${fmt(w1)}; Terminal before ${fmt(t0)} after ${fmt(t1)}`);
    await shot('l-after-resize-back');
  });

  log('\n=== page errors (excluding missing media)');
  const errs = pageErrors.filter((e) => !/media\/|Failed to load resource|net::ERR_FILE_NOT_FOUND|ERR_FILE/.test(e));
  log(errs.length ? errs.join('\n') : 'none (' + (pageErrors.length - errs.length) + ' missing-media errors ignored)');
  check('z page has no JavaScript errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
}

let code = 0;
try { await main(); } catch (e) { log('FATAL ' + (e.stack || e)); code = 1; }
log(`\nSUMMARY PASS=${R.pass} FAIL=${R.fail} NOT_RUN=${R.notrun}`);
fs.writeFileSync(DIR + '/results.txt', out.join('\n') + '\n');
try { ws && ws.close(); } catch (e) { /* ignore */ }
chrome.kill('SIGKILL');
await sleep(300);
fs.rmSync(DIR + '/profile', { recursive: true, force: true });
process.exit(code);
