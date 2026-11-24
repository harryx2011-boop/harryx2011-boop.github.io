import { serve, launch, sleep, STATE } from './lib.mjs';
const mode = process.argv[2]; const ys = process.argv[3].split(',').map(Number);
const srv = await serve(8310); const c = await launch(9470);
const ph = mode === 'phone';
await c.send('Emulation.setDeviceMetricsOverride', { width: ph ? 390 : 1440, height: ph ? 844 : 900, deviceScaleFactor: ph ? 2 : 1, mobile: ph });
if (ph) await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await c.load('http://127.0.0.1:8310/'); await sleep(2500);
for (const y of ys) {
  await c.ev(`scrollTo({top:${y},behavior:'instant'})`); await sleep(600);
  await c.ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))'); await sleep(200);
  const s = await c.ev(STATE);
  const cs = await c.ev(`(()=>{const t=Page.tracks.contact;return {approach:+t.approach.toFixed(3),exit:+t.exit.toFixed(3)}})()`);
  console.log(mode, y, JSON.stringify({ stage: s.stage, name: s.name, ...cs }));
  await c.shot(`/workspace/page-test/shots/x-${mode}-${y}.png`);
}
c.close(); srv.close(); process.exit(0);
