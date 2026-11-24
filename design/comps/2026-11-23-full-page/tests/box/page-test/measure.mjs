import fs from 'node:fs';
import { serve, launch, sleep, DIR } from './lib.mjs';
const mode = process.argv[2], tag = process.argv[3] || 'run';
const ph = mode === 'phone';
const port = ph ? 9481 : 9480;
const srv = await serve(8400 + (ph ? 1 : 0));
const c = await launch(port);
const vw = ph ? 390 : 1440, vh = ph ? 844 : 900;
await c.send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 1, mobile: ph });
if (ph) await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await c.load(`http://127.0.0.1:${8400 + (ph ? 1 : 0)}/`);
await sleep(2500);
const r = await c.ev(`(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const max = document.documentElement.scrollHeight - innerHeight;
  const stage = document.getElementById('stage'), name = document.getElementById('wordname');
  const faces = [...document.querySelectorAll('.gem-tile .face')];
  const head = document.querySelector('.contact-copy .big');
  const links = [...document.querySelectorAll('.navpill a, .to-contact')];
  let zeroY = null, faceY = null, lastNav = null; const nav = [], overlaps = [], samples = [];
  const inter = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  for (let y = 0; y <= max; y += 20) {
    scrollTo({ top: y, behavior: 'instant' }); await raf();
    const so = +(stage.style.opacity || 1);
    if (zeroY === null && y > 300 && so <= 0.001) zeroY = y;
    const fo = Math.max(...faces.map(f => +(f.style.opacity || 0)));
    if (faceY === null && zeroY !== null && fo >= 0.1) faceY = y;
    const cur = links.filter(a => a.getAttribute('aria-current') === 'true').map(a => a.textContent).join(',') || '-';
    if (cur !== lastNav) { nav.push([y, cur]); lastNav = cur; }
    const no = +getComputedStyle(name).opacity;
    const hr = head.getBoundingClientRect(), nr = name.getBoundingClientRect();
    if (no > 0.05 && hr.bottom > 0 && hr.top < innerHeight && inter(hr, nr)) overlaps.push([y, +no.toFixed(2)]);
    if (y > max - 1500) samples.push([y, +no.toFixed(2), Math.round(hr.top), Math.round(hr.bottom)]);
  }
  const t = Page.tracks;
  return { max, zeroY, faceY, nav, overlaps, aetherTop: Math.round(t.aether.top), contactTop: Math.round(t.contact.top), samples: samples.filter((s, i) => i % 5 === 0) };
})()`);
const gap = r.faceY - r.zeroY;
const out = `${tag} ${mode} vh=${vh} max=${r.max} holeZeroY=${r.zeroY} firstFaceY=${r.faceY} gap=${gap}px = ${(gap / vh * 100).toFixed(1)}% vh aetherTrackTop=${r.aetherTop}\nNAV ${JSON.stringify(r.nav)}\nNAME-OVER-CONTACT-HEADING overlaps(${r.overlaps.length}) ${JSON.stringify(r.overlaps)}\nSAMPLES[y,nameOpacity,headTop,headBottom] ${JSON.stringify(r.samples)}\n`;
console.log(out);
fs.appendFileSync(DIR + '/measure-log.txt', out);
c.close(); srv.close(); process.exit(0);
