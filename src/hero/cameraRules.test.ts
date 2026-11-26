import assert from "node:assert/strict";
import { test } from "node:test";
import { HERO, aim, band, easeInOut, easeOut, glide, heroScene, sizeFor } from "./cameraRules.ts";

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-4, `${actual} is not ${expected}`);
const still = { width: 1440, height: 900, hero: 0, approach: 0, exit: 0, reduce: false, past: 0, zoneA: 100, zoneB: 200 };

test("band, easeOut, easeInOut and glide match the page engine", () => {
  assert.equal(band(0.5, 0, 1), 0.5);
  assert.equal(band(2, 0, 1), 1);
  assert.equal(band(-1, 0, 1), 0);
  near(easeOut(0.5), 0.875);
  near(easeInOut(0.25), 0.0625);
  near(glide(0.25), 0.184375);
});

test("sizeFor: under 720 px is a phone", () => {
  assert.equal(sizeFor(719), "phone");
  assert.equal(sizeFor(720), "wide");
});

test("aim: at 0 it is the starting view, at 1 the deep view", () => {
  assert.deepEqual(aim(HERO.wide, 0, 1.6), { dist: 13, elev: 0.055, roll: -0.6, cx: 0.86, cy: 0.25 });
  const deep = aim(HERO.wide, 1, 1.6);
  near(deep.dist, 3.1);
  near(deep.elev, 0.3);
  assert.equal(deep.roll, 0);
  assert.equal(deep.cx, 0);
  assert.equal(deep.cy, 0);
});

test("aim: distance falls on a curve and a wider screen pushes the hole sideways", () => {
  const half = aim(HERO.wide, 0.5, 3.2);
  near(half.dist, 6.34823);
  near(half.elev, 0.1775);
  near(half.roll, -0.3);
  near(half.cx, 0.86);
  near(half.cy, 0.125);
});

test("heroScene: the top of the page shows the hero view, fully lit, with the name", () => {
  const top = heroScene(still);
  near(top.aim.dist, 13);
  assert.equal(top.opacity, 1);
  assert.equal(top.gone, 0);
  assert.equal(top.name, 1);
  assert.equal(top.paused, false);
});

test("heroScene: the end of the fall is the deep view, dark and paused; the name is back", () => {
  const end = heroScene({ ...still, hero: 1 });
  near(end.aim.dist, 3.1);
  assert.equal(end.opacity, 0);
  assert.equal(end.gone, 1);
  assert.equal(end.name, 1);
  assert.equal(end.paused, true);
});

test("heroScene: reduced motion keeps the starting view and fades earlier", () => {
  const mid = heroScene({ ...still, hero: 0.5, reduce: true });
  near(mid.aim.dist, 13);
  near(mid.opacity, 0.5);
});

test("heroScene: a phone starts further away", () => {
  near(heroScene({ ...still, width: 390, height: 844 }).aim.dist, 26);
});

test("heroScene: approaching Contact pulls back out and fades in", () => {
  const back = heroScene({ ...still, hero: 1, approach: 0.5 });
  near(back.opacity, 0.5);
  near(back.aim.roll, 0.317695);
});

test("heroScene: after Contact the name hides while the Contact heading is in the header band", () => {
  const leaving = { ...still, hero: 1, approach: 1, exit: 0.5 };
  near(heroScene({ ...leaving, past: 0 }).name, 0.5);
  near(heroScene({ ...leaving, past: 100 }).name, 0);
  near(heroScene({ ...leaving, past: 250 }).name, 0.5);
});
