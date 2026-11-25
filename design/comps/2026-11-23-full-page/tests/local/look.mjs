// Screenshots of the demo in hidden Edge. Usage: node look.mjs <tag> <width> <height> [steps...]
// A step is "name=selector" (scroll the selector to the top, shoot the viewport) or "name@js" (run js in the page first, then shoot the rig).
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
const require = createRequire("C:/devprojects/Aether/node_modules/");
const { chromium } = require("playwright-core");
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const [tag, w, h, ...args] = process.argv.slice(2);
const steps = args.flatMap((a) => a.startsWith("file:") ? fs.readFileSync(a.slice(5), "utf8").split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean) : [a]);
const out = path.join(here, "shots"); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(pathToFileURL(path.join(here, "out", "test.html")).href);
await page.waitForTimeout(1500);
for (const step of steps) {
  const at = step.indexOf("@"), eq = step.indexOf("=");
  if (at > 0 && (eq < 0 || at < eq)) {
    const name = step.slice(0, at);
    const res = await page.evaluate(step.slice(at + 1));
    if (res !== undefined) console.log(name, JSON.stringify(res));
    await page.waitForTimeout(400);
    if (name.startsWith("os")) { await page.waitForTimeout(1200); await page.locator("#os").screenshot({ path: path.join(out, `${tag}-${name}.png`) }); }
    else { await page.locator("#crt").scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(out, `${tag}-${name}.png`) }); }
  } else {
    const name = step.slice(0, eq), sel = step.slice(eq + 1);
    await page.evaluate((s) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 0); }, sel);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, `${tag}-${name}.png`) });
  }
}
const m = await page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
  return { crt: r("#crt"), screen: r("#os"), font: getComputedStyle(document.querySelector(".xp")).fontSize, overflowX: document.documentElement.scrollWidth - innerWidth };
});
console.log(tag, JSON.stringify(m), errors.length ? "ERRORS " + errors.join(" | ") : "no page errors");
await browser.close();
