import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

export const DIR = '/workspace/page-test';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

export function serve(port) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(DIR, p === '/' ? 'index.html' : p);
    if (f.startsWith(DIR) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    } else { res.writeHead(404); res.end('nf'); }
  });
  return new Promise((r) => srv.listen(port, '127.0.0.1', () => r(srv)));
}

export async function launch(port, extra = []) {
  const chrome = spawn('/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl',
    '--remote-debugging-port=' + port, '--remote-allow-origins=*', '--user-data-dir=' + DIR + '/profile' + port,
    '--window-size=1440,900', '--hide-scrollbars', ...extra, 'about:blank'], { stdio: 'ignore' });
  let list;
  for (let i = 0; i < 80; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.find((t) => t.type === 'page')) break; } catch (e) { /* wait */ }
    await sleep(250);
  }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map(), waiters = [];
  const errors = [], failed = [];
  const reqUrl = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ': ' + m.error.message)) : p.res(m.result); return; }
    if (!m.method) return;
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].name === m.method) { waiters[i].res(m.params); waiters.splice(i, 1); }
    const P = m.params;
    if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (P.exceptionDetails.exception?.description || P.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && (P.type === 'error' || P.type === 'warning')) errors.push('console.' + P.type + ': ' + P.args.map((a) => a.value || a.description).join(' '));
    if (m.method === 'Log.entryAdded' && P.entry.level === 'error') errors.push('log: ' + P.entry.text + ' ' + (P.entry.url || ''));
    if (m.method === 'Network.requestWillBeSent') reqUrl.set(P.requestId, P.request.url);
    if (m.method === 'Network.loadingFailed') failed.push('FAILED ' + (reqUrl.get(P.requestId) || '?') + ' ' + P.errorText);
    if (m.method === 'Network.responseReceived' && P.response.status >= 400) failed.push(P.response.status + ' ' + P.response.url);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej, method }); ws.send(JSON.stringify({ id: i, method, params })); });
  const waitEvent = (name) => new Promise((res) => waiters.push({ name, res }));
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const shot = async (file) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
  };
  const load = async (url) => {
    const w = waitEvent('Page.loadEventFired');
    await send('Page.navigate', { url });
    await w;
    await ev('document.fonts.ready.then(()=>true)');
  };
  return { chrome, send, ev, shot, load, errors, failed, close: () => { try { ws.close(); } catch (e) {} chrome.kill('SIGKILL'); } };
}

export const STATE = `(() => {
  const op = (s) => { const e = document.querySelector(s); return e ? +getComputedStyle(e).opacity : null; };
  const nav = [...document.querySelectorAll('.navpill a')].filter(a => a.getAttribute('aria-current') === 'true').map(a => a.textContent);
  const st = document.getElementById('stage');
  return { y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight, nav: nav.join(',') || '-',
    heroCopy: op('#hero-copy'), name: op('#wordname'), stage: +(st.style.opacity || 1), nogl: st.classList.contains('nogl'),
    sw: document.documentElement.scrollWidth, iw: innerWidth, bw: document.body.scrollWidth,
    tr: Object.fromEntries(Object.entries(Page.tracks).map(([k, t]) => [k, +t.p.toFixed(2)])) };
})()`;
