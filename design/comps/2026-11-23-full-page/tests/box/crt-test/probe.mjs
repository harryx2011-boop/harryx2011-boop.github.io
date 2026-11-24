import { spawn } from 'node:child_process';
import fs from 'node:fs';
const DIR = '/workspace/crt-test', PORT = 9344, URL = 'file://' + DIR + '/index.html';
const chrome = spawn('/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + PORT, '--remote-allow-origins=*', '--user-data-dir=' + DIR + '/profile2', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(), waiters = [];
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
try {
  let list;
  for (let i = 0; i < 80; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.find((t) => t.type === 'page')) break; } catch (e) {} await sleep(250); }
  ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id).res(m.result); pending.delete(m.id); } else if (m.method) for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].n === m.method) { waiters[i].r(); waiters.splice(i, 1); } };
  await send('Page.enable');
  const expr = fs.readFileSync(DIR + '/probe-expr.js', 'utf8');
  for (const [w, mobile] of [[1440, false], [390, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile });
    const p = new Promise((r) => waiters.push({ n: 'Page.loadEventFired', r }));
    await send('Page.navigate', { url: URL }); await p; await sleep(600);
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log('viewport', w, JSON.stringify(r.result.value ?? r.exceptionDetails));
  }
} finally { chrome.kill('SIGKILL'); await sleep(200); fs.rmSync(DIR + '/profile2', { recursive: true, force: true }); process.exit(0); }
