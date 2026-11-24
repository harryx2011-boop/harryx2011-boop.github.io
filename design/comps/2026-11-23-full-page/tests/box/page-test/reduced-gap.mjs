import { serve, launch, sleep } from './lib.mjs';
const srv = await serve(8410);
const c = await launch(9490);
for (const [vw, vh, ph] of [[1440, 900, false], [390, 844, true]]) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 1, mobile: ph });
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await c.load('http://127.0.0.1:8410/');
  await sleep(2500);
  const r = await c.ev(`(async () => {
    const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const max = document.documentElement.scrollHeight - innerHeight;
    const stage = document.getElementById('stage'), lock = document.querySelector('.lockup');
    let zeroY = null, lockY = null, fadeStart = null;
    for (let y = 0; y <= Math.min(max, 6000); y += 20) {
      scrollTo({ top: y, behavior: 'instant' }); await raf();
      const so = +(stage.style.opacity || 1);
      if (fadeStart === null && so < 0.999) fadeStart = y;
      if (zeroY === null && y > 100 && so <= 0.001) zeroY = y;
      const b = lock.getBoundingClientRect();
      if (lockY === null && b.top < innerHeight * 0.85 && b.bottom > 0) lockY = y;
    }
    return { max, fadeStart, zeroY, lockY, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, heroH: Math.round(document.querySelector('.hero').getBoundingClientRect().height) };
  })()`);
  const gap = r.lockY - r.zeroY;
  console.log(`${vw}x${vh} reduce=${r.reduce} heroH=${r.heroH} fadeStart=${r.fadeStart} holeZeroY=${r.zeroY} lockupEntersY=${r.lockY} gap=${gap}px = ${(gap / vh * 100).toFixed(1)}% vh max=${r.max}`);
}
await c.close?.(); srv.close?.(); process.exit(0);
