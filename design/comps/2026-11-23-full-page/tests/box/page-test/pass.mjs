import fs from 'node:fs';
import { serve, launch, sleep, STATE, DIR } from './lib.mjs';
const mode = process.argv[2];
const port = { desktop: 9451, phone: 9452, reduced: 9453 }[mode];
const srv = await serve(8200 + port - 9450);
const URL = `http://127.0.0.1:${8200 + port - 9450}/`;
const c = await launch(port, mode === 'phone' ? ['--window-size=390,844'] : []);
const SH = DIR + '/shots/'; fs.mkdirSync(SH, { recursive: true });
const log = [];
const L = (s) => { console.log(s); log.push(s); };
const vw = mode === 'phone' ? 390 : 1440, vh = mode === 'phone' ? 844 : 900;
await c.send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: mode === 'phone' ? 2 : 1, mobile: mode === 'phone' });
if (mode === 'phone') await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
if (mode === 'reduced') await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await c.load(URL);
await sleep(2500);
const gl = await c.ev(`(() => { const cv = document.querySelector('#stage canvas'); return { w: cv.width, h: cv.height, nogl: document.getElementById('stage').classList.contains('nogl'), reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, fontsOK: [...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+' '+f.weight).join('|') }; })()`);
L('INIT ' + JSON.stringify(gl));
const settle = async (ms = 450) => { await sleep(ms); await c.ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))'); await sleep(150); };
let n = 0;
const snap = async (tag, extra = '') => {
  await settle();
  const s = await c.ev(STATE);
  const name = `${mode}-${String(++n).padStart(2, '0')}-${tag}.png`;
  await c.shot(SH + name);
  L(`${name} ${JSON.stringify(s)} ${extra}`);
  return s;
};
const goto = (y) => c.ev(`scrollTo({top:${y},behavior:'instant'})`);
const rectOf = (sel) => c.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),r:Math.round(r.right),b:Math.round(r.bottom)}; })()`);

if (mode !== 'reduced') {
  const first = await snap('top', 'hero h1 ' + JSON.stringify(await rectOf('.say')) + ' btn ' + JSON.stringify(await rectOf('.act .pill')) + ' bar ' + JSON.stringify(await rectOf('#bar')));
  const step = mode === 'phone' ? 400 : 450;
  for (let y = step; y <= first.max + step; y += step) {
    const yy = Math.min(y, first.max);
    await goto(yy);
    await snap('y' + yy);
    if (yy >= first.max) break;
  }
  /* element rects at the end for context */
  L('RECTS ' + JSON.stringify({ hero: await rectOf('.hero'), aether: await rectOf('[data-track=aether]'), work: await rectOf('#work'), crt: await rectOf('#crt'), about: await rectOf('#about'), contact: await rectOf('#contact'), foot: await rectOf('.foot'), activity: await rectOf('#activity'), year: await rectOf('.year'), hands: await rectOf('#hands') }));
  /* Enter Aether from the top */
  await goto(0); await settle(800);
  const b = await rectOf('.act .pill');
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  if (mode === 'phone') {
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
    await sleep(50);
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', buttons: 1, clickCount: 1 });
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', buttons: 0, clickCount: 1 });
  }
  await sleep(1500);
  await snap('after-enter-aether', 'click at ' + Math.round(cx) + ',' + Math.round(cy) + ' hash=' + await c.ev('location.hash') + ' aetherTop=' + JSON.stringify(await rectOf('[data-track=aether]')));

  if (mode === 'phone') {
    const tap = async (x, y) => { await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); await sleep(50); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(500); };
    await goto(0); await settle();
    let m = await rectOf('#menu-open'); await tap(m.x + m.w / 2, m.y + m.h / 2);
    await snap('menu-open', 'drawer open=' + await c.ev('document.getElementById("drawer").open') + ' menuBtn ' + JSON.stringify(m));
    const x = await rectOf('#menu-close'); await tap(x.x + x.w / 2, x.y + x.h / 2);
    await snap('menu-closed', 'drawer open=' + await c.ev('document.getElementById("drawer").open'));
    m = await rectOf('#menu-open'); await tap(m.x + m.w / 2, m.y + m.h / 2);
    const link = await rectOf('.drawer-links a[href="#about"]'); await tap(link.x + link.w / 2, link.y + link.h / 2);
    await sleep(1000);
    await snap('menu-about', 'drawer open=' + await c.ev('document.getElementById("drawer").open') + ' hash=' + await c.ev('location.hash'));
    /* sideways overflow check at every landmark */
    L('OVERFLOW ' + JSON.stringify(await c.ev(`(() => { const out = []; document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > innerWidth + 1 && !e.closest('.year') && getComputedStyle(e).position !== 'fixed' && r.width > 0) out.push(e.tagName + '.' + (e.className.baseVal ?? e.className) + ' right=' + Math.round(r.right)); }); return out.slice(0, 25); })()`)));
  }
} else {
  await snap('hero');
  const aet = await c.ev(`(() => { const t = document.querySelector('[data-track=aether]'); return Math.round(t.getBoundingClientRect().top + scrollY); })()`);
  await goto(aet + 300); await snap('aether-pin');
  await goto(aet + 600); await snap('aether-pin2');
  const wk = await c.ev(`Math.round(document.querySelector('#work').getBoundingClientRect().top + scrollY)`);
  await goto(wk); await snap('work');
  const ct = await c.ev(`(() => { const t = document.querySelector('#contact'); const r = t.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), h: Math.round(r.height) }; })()`);
  await goto(ct.top + (ct.h - vh) / 2); await snap('contact-pin-mid');
  await goto(ct.top + ct.h - vh); await snap('contact-pin-end');
}
L('ERRORS ' + c.errors.length + ' ' + JSON.stringify(c.errors));
L('FAILED ' + JSON.stringify(c.failed));
fs.writeFileSync(DIR + `/results-${mode}.txt`, log.join('\n') + '\n');
c.close(); srv.close(); process.exit(0);
