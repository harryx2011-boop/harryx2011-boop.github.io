export const RAMP = " .:-=+*#%@";
export const FOCAL = 2.4;
export const FALLBACK_FONT = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

const SMALL_FRAME_PX = 560;
const MAX_PIXEL_RATIO = 2;
const CELL = { small: { w: 6, h: 11 }, wide: { w: 8, h: 15 } };
const MIN_COLS = 8;
const MIN_ROWS = 6;
const MAX_STEP_MS = 64;
const SETTLE_MS = 160;
const STILL_TIME_S = 12;
const GLYPH_ASPECT = 0.6;
const MIN_ELEV = 0.02;
const POINTER = { centerX: 0.035, centerY: 0.02, elev: 0.07, roll: 0.03 };

export type Grid = { cw: number; ch: number; cols: number; rows: number; dpr: number };
export type Preset = { elev: number; dist: number; roll: number; cx: number; cy: number; spin: number };
export type SceneView = { centerX: number; centerY: number; elev: number; roll: number };
export type DrawState = { paused: boolean; dirty: boolean; visible: boolean; reduce: boolean };

export function gridFor(width: number, height: number, pixelRatio: number): Grid | null {
  if (!width || !height) return null;
  const dpr = Math.min(pixelRatio || 1, MAX_PIXEL_RATIO);
  const cell = width < SMALL_FRAME_PX ? CELL.small : CELL.wide;
  const cw = Math.round(cell.w * dpr);
  const ch = Math.round(cell.h * dpr);
  return {
    cw,
    ch,
    cols: Math.max(MIN_COLS, Math.ceil((width * dpr) / cw)),
    rows: Math.max(MIN_ROWS, Math.ceil((height * dpr) / ch)),
    dpr,
  };
}

export function stepMs(now: number, last: number): number {
  return Math.min(MAX_STEP_MS, now - (last || now));
}

export function settle(current: number, target: number, dtMs: number): number {
  return current + (target - current) * (1 - Math.exp(-dtMs / SETTLE_MS));
}

export function sceneView(preset: Preset, pointerX: number, pointerY: number): SceneView {
  return {
    centerX: preset.cx + pointerX * POINTER.centerX,
    centerY: preset.cy - pointerY * POINTER.centerY,
    elev: Math.max(MIN_ELEV, preset.elev + pointerY * POINTER.elev),
    roll: preset.roll + pointerX * POINTER.roll,
  };
}

export function sceneTime(now: number, reduce: boolean): number {
  return reduce ? STILL_TIME_S : now / 1000;
}

export function atlasFont(cellWidth: number, family: string): string {
  return `500 ${Math.round(cellWidth / GLYPH_ASPECT)}px ${family}`;
}

export function isActive(state: DrawState): boolean {
  return !state.paused && (state.dirty || (!state.reduce && state.visible));
}
