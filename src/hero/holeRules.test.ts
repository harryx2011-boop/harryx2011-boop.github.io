import assert from "node:assert/strict";
import { test } from "node:test";
import { atlasFont, gridFor, isActive, sceneTime, sceneView, settle, stepMs } from "./holeRules.ts";

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-4, `${actual} is not ${expected}`);

test("gridFor: a wide frame uses 8 by 15 pixel cells", () => {
  assert.deepEqual(gridFor(1440, 900, 1), { cw: 8, ch: 15, cols: 180, rows: 60, dpr: 1 });
});

test("gridFor: a frame under 560 px uses 6 by 11 cells, and the pixel ratio stops at 2", () => {
  assert.deepEqual(gridFor(390, 844, 3), { cw: 12, ch: 22, cols: 65, rows: 77, dpr: 2 });
});

test("gridFor: never fewer than 8 columns and 6 rows", () => {
  assert.deepEqual(gridFor(20, 20, 1), { cw: 6, ch: 11, cols: 8, rows: 6, dpr: 1 });
});

test("gridFor: a frame with no size has no grid", () => {
  assert.equal(gridFor(0, 100, 1), null);
  assert.equal(gridFor(100, 0, 1), null);
});

test("stepMs: the first frame takes no time and a long gap counts as 64 ms", () => {
  assert.equal(stepMs(1000, 0), 0);
  assert.equal(stepMs(1000, 990), 10);
  assert.equal(stepMs(1000, 100), 64);
});

test("settle: moves toward the target by 1 - e^(-dt/160)", () => {
  near(settle(0, 1, 160), 0.63212);
  near(settle(0, 1, 64), 0.32968);
  assert.equal(settle(0.4, 0.4, 16), 0.4);
});

test("sceneView: the pointer shifts the centre, the elevation and the roll; elevation stops at 0.02", () => {
  const view = sceneView({ elev: 0.055, dist: 13, roll: -0.6, cx: 0.86, cy: 0.25, spin: -1 }, 1, -1);
  near(view.centerX, 0.895);
  near(view.centerY, 0.27);
  near(view.elev, 0.02);
  near(view.roll, -0.57);
});

test("sceneTime: seconds, or a fixed 12 with reduced motion", () => {
  assert.equal(sceneTime(5000, false), 5);
  assert.equal(sceneTime(5000, true), 12);
});

test("atlasFont: the glyph size follows the cell width", () => {
  assert.equal(atlasFont(8, "Mono"), "500 13px Mono");
});

test("isActive: draws while dirty, or while visible without reduced motion, never while paused", () => {
  assert.equal(isActive({ paused: false, dirty: true, visible: false, reduce: true }), true);
  assert.equal(isActive({ paused: false, dirty: false, visible: true, reduce: false }), true);
  assert.equal(isActive({ paused: false, dirty: false, visible: true, reduce: true }), false);
  assert.equal(isActive({ paused: true, dirty: true, visible: true, reduce: false }), false);
});
