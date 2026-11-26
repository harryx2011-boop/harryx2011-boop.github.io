const PHONE_PX = 720;
const GLIDE_EASE = 0.35;
const PAUSE_BELOW = 0.002;
const NAME_FADE_PX = 40;
const FALL = { from: 0.03, to: 0.92 };
const FADE_OUT = { motion: { from: 0.9, to: 0.99 }, reduced: { from: 0.3, to: 0.7 } };
const PULL_BACK = { from: 0.4, to: 0.85 };
const FADE_IN = { from: 0.4, to: 0.6 };
const COPY_GONE = { from: 0.03, to: 0.2 };

export type Start = { elev: number; dist: number; roll: number; cx: number; cy: number; aspect: number };
export type Aim = { dist: number; elev: number; roll: number; cx: number; cy: number };
export type Size = "phone" | "wide";
export type SceneInput = {
  width: number;
  height: number;
  hero: number;
  approach: number;
  exit: number;
  reduce: boolean;
  past: number;
  zoneA: number;
  zoneB: number;
};
export type SceneState = { aim: Aim; opacity: number; gone: number; name: number; paused: boolean };

export const HERO: Record<Size, Start> = {
  wide: { elev: 0.055, dist: 13, roll: -0.6, cx: 0.86, cy: 0.25, aspect: 1.6 },
  phone: { elev: 0.055, dist: 26, roll: -0.5, cx: 0.2, cy: 0.36, aspect: 390 / 844 },
};
export const CONTACT: Record<Size, Start> = {
  wide: { elev: 0.055, dist: 13, roll: 0.6, cx: 0.8, cy: 0.3, aspect: 1.6 },
  phone: { elev: 0.055, dist: 26, roll: 0.5, cx: 0.2, cy: 0.36, aspect: 390 / 844 },
};
export const DEEP = { elev: 0.3, dist: 3.1 };

export function clamp(x: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, x));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function band(p: number, from: number, to: number): number {
  return clamp((p - from) / (to - from));
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function glide(t: number): number {
  return lerp(t, easeInOut(t), GLIDE_EASE);
}

export function sizeFor(width: number): Size {
  return width < PHONE_PX ? "phone" : "wide";
}

export function aim(from: Start, depth: number, viewportAspect: number): Aim {
  const widen = viewportAspect / from.aspect;
  return {
    dist: from.dist * Math.pow(DEEP.dist / from.dist, depth),
    elev: lerp(from.elev, DEEP.elev, depth),
    roll: lerp(from.roll, 0, depth),
    cx: lerp(from.cx * widen, 0, depth),
    cy: lerp(from.cy, 0, depth),
  };
}

export function heroScene(input: SceneInput): SceneState {
  const size = sizeFor(input.width);
  const aspect = input.width / input.height;
  const leaving = input.approach > 0;
  const fade = input.reduce ? FADE_OUT.reduced : FADE_OUT.motion;
  const view = leaving
    ? aim(CONTACT[size], input.reduce ? 0 : 1 - easeOut(band(input.approach, PULL_BACK.from, PULL_BACK.to)), aspect)
    : aim(HERO[size], input.reduce ? 0 : glide(band(input.hero, FALL.from, FALL.to)), aspect);
  const opacity = leaving
    ? band(input.approach, FADE_IN.from, FADE_IN.to) * (1 - input.exit)
    : 1 - band(input.hero, fade.from, fade.to);
  const gone = band(input.hero, COPY_GONE.from, COPY_GONE.to);
  const shown = Math.max(1 - gone, 1 - opacity);
  const inHeaderBand =
    band(input.past, input.zoneA - NAME_FADE_PX, input.zoneA) * (1 - band(input.past, input.zoneB, input.zoneB + NAME_FADE_PX));
  return {
    aim: view,
    opacity,
    gone,
    name: input.exit > 0 ? shown * (1 - inHeaderBand) : shown,
    paused: opacity <= PAUSE_BELOW,
  };
}
