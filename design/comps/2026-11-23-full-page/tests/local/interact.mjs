// Real-mouse checks of the small desktop in hidden Edge: blank start, open, drag, resize, icon move, paint, and the page edits.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
const require = createRequire("C:/devprojects/Aether/node_modules/");
const pw = require("playwright-core");
const engine = process.argv[2] || "edge";
const here = process.env.DEMO_DIR || path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const out = path.join(here, "shots"); fs.mkdirSync(out, { recursive: true });
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { if (ok) pass++; else fail++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + detail)); };
const browser = engine === "edge" ? await pw.chromium.launch({ channel: "msedge", headless: true }) : await pw[engine].launch({ headless: true });
console.log("engine", engine, browser.version());

async function open(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = []; page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(process.env.DEMO_URL || pathToFileURL(path.join(here, "out", "test.html")).href);
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector("#crt").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(600);
  return { page, errors };
}
const box = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, sel);
const count = (page, sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel);
async function dragBy(page, from, dx, dy) {
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(from.x + dx * i / 8, from.y + dy * i / 8);
  await page.mouse.up(); await page.waitForTimeout(120);
}
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t;

{
  const { page, errors } = await open(1440, 900);
  check("blank desktop at load: no window, no task", (await count(page, ".xp-win")) === 0 && (await count(page, ".xp-task")) === 0);
  check("five icons", (await count(page, ".xp-icon")) === 5);
  check("heatmap is gone", (await count(page, "#activity, .grid-days, .year")) === 0);
  check("Discord handle is ogexr. with the dot", (await page.textContent("#discord-handle")) === "ogexr.");
  check("About lists the interests and no numbers", (await page.evaluate(() => [...document.querySelectorAll(".interests li")].map((l) => l.textContent).join(","))) === "Minecraft,Roblox" && (await count(page, ".stats, #stat-contrib")) === 0);
  if (process.env.EYE === "hidden") {
    check("no Enigma eye and no video dialog while the video does not exist", (await count(page, "#eye-open, #eye-reel, #eye-note")) === 0);
    await page.evaluate(() => document.querySelector("#about").scrollIntoView({ block: "center" }));
    await page.screenshot({ path: path.join(out, engine + "-int-about.png") });
  } else {
    await page.evaluate(() => document.querySelector("#eye-open").scrollIntoView({ block: "center" }));
    await page.click("#eye-open");
    await page.waitForTimeout(700);
    const reel = await page.evaluate(() => ({ open: document.querySelector("#eye-reel").open, note: !document.querySelector("#eye-note").hidden, video: !document.querySelector("#eye-video").hidden }));
    check("the Enigma eye opens the video dialog; with no file yet it says so", reel.open && reel.note !== reel.video, JSON.stringify(reel));
    await page.screenshot({ path: path.join(out, engine + "-int-reel.png") });
    await page.click("#eye-close");
    check("Close shuts the dialog", !(await page.evaluate(() => document.querySelector("#eye-reel").open)));
  }
  await page.evaluate(() => document.querySelector("#crt").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(400);
  const em = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".xp")).fontSize));
  check("desktop type is a whole number of px, 13 to 18", Number.isInteger(em) && em >= 13 && em <= 18, String(em));

  const tIcon = await box(page, '.xp-icon:nth-child(4)');
  await page.mouse.click(tIcon.x + tIcon.w / 2, tIcon.y + 12);
  check("a click on the Terminal icon opens it", (await count(page, '.xp-win[aria-label="Terminal"]')) === 1);
  const W = '.xp-win[aria-label="Terminal"]';
  let b0 = await box(page, W);
  const title = await box(page, W + " .xp-name");
  await dragBy(page, { x: title.x + 40, y: title.y + 6 }, -60, 40);
  let b1 = await box(page, W);
  check("title drag moves the window by -60, 40", near(b1.x - b0.x, -60) && near(b1.y - b0.y, 40) && near(b1.w, b0.w), JSON.stringify([b0, b1]));
  await dragBy(page, { x: b1.x + b1.w - 3, y: b1.y + b1.h - 3 }, -80, 30);
  let b2 = await box(page, W);
  check("lower right corner resizes by -80, 30", near(b2.w - b1.w, -80) && near(b2.h - b1.h, 30) && near(b2.x, b1.x), JSON.stringify([b1, b2]));
  await dragBy(page, { x: b2.x, y: b2.y + b2.h / 2 }, -30, 0);
  let b3 = await box(page, W);
  check("left edge resizes: x moves 30 left, width grows 30, right edge stays", near(b2.x - b3.x, 30) && near(b3.w - b2.w, 30), JSON.stringify([b2, b3]));
  await dragBy(page, { x: b3.x + b3.w / 2, y: b3.y }, 0, 25);
  let b4 = await box(page, W);
  check("top edge resizes: y moves 25 down, height shrinks 25", near(b4.y - b3.y, 25) && near(b3.h - b4.h, 25), JSON.stringify([b3, b4]));
  await dragBy(page, { x: b4.x + b4.w - 3, y: b4.y + b4.h - 3 }, -2000, -2000);
  let b5 = await box(page, W);
  check("resize stops at the minimum size (12 by 7 em)", near(b5.w, 12 * em, 2) && near(b5.h, 7 * em, 2), JSON.stringify(b5) + " em " + em);
  await dragBy(page, { x: b5.x + b5.w - 3, y: b5.y + b5.h - 3 }, 3000, 3000);
  let b6 = await box(page, W), layer = await box(page, ".xp-wins");
  check("resize stops at the desktop edge", b6.x + b6.w <= layer.x + layer.w + 1 && b6.y + b6.h <= layer.y + layer.h + 1, JSON.stringify([b6, layer]));
  await page.screenshot({ path: path.join(out, engine + "-int-resized.png") });
  await page.keyboard.press("Escape");
  check("Esc closes the focused window", (await count(page, ".xp-win")) === 0);

  const pIcon = await box(page, '.xp-icon:nth-child(5)');
  await dragBy(page, { x: pIcon.x + pIcon.w / 2, y: pIcon.y + 14 }, 220, -90);
  const pMoved = await box(page, '.xp-icon:nth-child(5)');
  check("an icon drag moves the icon and opens nothing", near(pMoved.x - pIcon.x, 220) && near(pMoved.y - pIcon.y, -90) && (await count(page, ".xp-win")) === 0, JSON.stringify([pIcon, pMoved]));
  await dragBy(page, { x: pMoved.x + pMoved.w / 2, y: pMoved.y + 14 }, 5000, 5000);
  const pEdge = await box(page, '.xp-icon:nth-child(5)'), desk = await box(page, ".xp-desk");
  check("an icon cannot leave the desktop", pEdge.x + pEdge.w <= desk.x + desk.w + 1 && pEdge.y + pEdge.h <= desk.y + desk.h + 1, JSON.stringify([pEdge, desk]));
  await page.mouse.click(pEdge.x + pEdge.w / 2, pEdge.y + 14);
  check("a click on the moved icon opens Paint", (await count(page, '.xp-win[aria-label="Paint"]')) === 1);
  const cv = await box(page, ".app-canvas");
  const inked = () => page.evaluate(() => { const c = document.querySelector(".app-canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 100) n++; return n; });
  const before = await inked();
  await dragBy(page, { x: cv.x + cv.w * 0.3, y: cv.y + cv.h * 0.3 }, cv.w * 0.4, cv.h * 0.4);
  const after = await inked();
  check("a drag on the Paint page draws a line", before === 0 && after >= 10, `${before} -> ${after}`);
  await page.click(".app-wipe");
  check("Clear empties the page", (await inked()) === 0);
  await dragBy(page, { x: cv.x + cv.w * 0.2, y: cv.y + cv.h * 0.6 }, cv.w * 0.5, -cv.h * 0.3);
  const fIcon = await box(page, '.xp-icon:nth-child(1)');
  await page.mouse.click(fIcon.x + fIcon.w / 2, fIcon.y + 12);
  await page.waitForTimeout(500);
  const film = await box(page, '.xp-win[aria-label="Reveal film"]'), lay2 = await box(page, ".xp-wins");
  check("the film window fits inside the desktop", film && film.y + film.h <= lay2.y + lay2.h + 1 && film.x + film.w <= lay2.x + lay2.w + 1, JSON.stringify([film, lay2]));
  const fit = await page.evaluate(() => { const v = document.querySelector(".app-video").getBoundingClientRect(), b = document.querySelector(".app-film").getBoundingClientRect(); return [v.width, b.width, v.height, b.height]; });
  check("the film fills its window body", near(fit[0], fit[1], 1) && near(fit[2], fit[3], 1), JSON.stringify(fit));
  await page.screenshot({ path: path.join(out, engine + "-int-paint-film.png") });
  check("no page errors at 1440", errors.length === 0, errors.join(" | "));
  await page.close();
}
for (const [w, h] of [[390, 844], [820, 1180], [1024, 768], [1280, 720]]) {
  const { page, errors } = await open(w, h);
  const m = await page.evaluate(() => { const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }; const x = document.querySelector(".xp"); return { crt: r("#crt"), screen: r("#os"), grid: document.querySelector("#crt").getAttribute("data-grid"), narrow: x.classList.contains("is-narrow"), font: getComputedStyle(x).fontSize, over: document.documentElement.scrollWidth - innerWidth, wins: document.querySelectorAll(".xp-win").length }; });
  console.log(w + "x" + h, JSON.stringify(m));
  check(`${w}: blank start, no sideways overflow, no errors`, m.wins === 0 && m.over <= 0 && errors.length === 0, JSON.stringify(m) + errors.join("|"));
  check(`${w}: the computer is at most about one screen tall`, m.crt[1] <= h * 1.03, JSON.stringify(m.crt));
  await page.evaluate(() => { const o = document.querySelector("#os").OS; o.open("notes", false); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, `${engine}-int-${w}.png`) });
  await page.close();
}
console.log(`PASS ${pass}, FAIL ${fail}`);
await browser.close();
