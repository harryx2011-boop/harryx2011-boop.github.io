import { serve, launch, sleep, STATE } from './lib.mjs';
const srv = await serve(8300); const c = await launch(9460);
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.load('http://127.0.0.1:8300/'); await sleep(2500);
await c.ev(`scrollTo({top:1350,behavior:'instant'})`); await sleep(700);
await c.ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))'); await sleep(200);
console.log(JSON.stringify(await c.ev(STATE)));
await c.shot('/workspace/page-test/shots/desktop-04-y1350.png');
c.close(); srv.close(); process.exit(0);
