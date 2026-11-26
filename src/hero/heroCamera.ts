import { HERO, heroScene } from "./cameraRules";
import { createHole } from "./holeGl";

const SPIN = -1;
const DOPPLER_MIX = 0.3;
const FURNACE_TOKENS = ["--furnace-1", "--furnace-2", "--furnace-3", "--furnace-4"];
const MONO_FACE = '500 16px "IBM Plex Mono"';
const COPY_RISE_PX = 48;

type Track = { top: number; span: number; p: number; approach: number; exit: number };
type LegacyPage = {
  reduce: boolean;
  rgb(name: string): number[];
  token(name: string): string;
  scene(run: (tracks: Record<string, Track>) => void): void;
  everyFrame(run: (now: number) => void): void;
  invalidate(): void;
};

export function startHeroCamera(): void {
  const page = (window as unknown as { Page?: LegacyPage }).Page;
  const stage = document.getElementById("stage");
  const copy = document.getElementById("hero-copy");
  const wordname = document.getElementById("wordname");
  const bar = document.getElementById("bar");
  const contactHead = document.querySelector(".contact-copy .big");
  const contactPin = document.querySelector("#contact .pin");
  if (!page || !stage || !copy || !wordname || !bar || !contactHead || !contactPin) return;

  const preset = { ...HERO.wide, spin: SPIN };
  const zone = { a: 0, b: 0 };
  const measureZone = () => {
    const head = contactHead.getBoundingClientRect();
    const top = contactPin.getBoundingClientRect().top;
    zone.a = head.top - top - bar.offsetHeight;
    zone.b = head.bottom - top;
    page.invalidate();
  };
  measureZone();
  window.addEventListener("resize", measureZone);
  void document.fonts?.ready.then(measureZone);

  const hole = createHole(stage, {
    preset,
    palette: { dop: DOPPLER_MIX, ramp: new Float32Array(FURNACE_TOKENS.flatMap((token) => page.rgb(token))) },
    ink: page.rgb("--ink"),
    voidColor: page.rgb("--void"),
    reduce: page.reduce,
    pointer: matchMedia("(hover: hover) and (pointer: fine)").matches,
    pointerTarget: window,
  });

  page.scene((tracks) => {
    const state = heroScene({
      width: window.innerWidth,
      height: window.innerHeight,
      hero: tracks.hero.p,
      approach: tracks.contact.approach,
      exit: tracks.contact.exit,
      reduce: page.reduce,
      past: window.scrollY - tracks.contact.top - tracks.contact.span,
      zoneA: zone.a,
      zoneB: zone.b,
    });
    Object.assign(preset, state.aim);
    stage.style.opacity = state.opacity.toFixed(3);
    copy.style.opacity = (1 - state.gone).toFixed(3);
    copy.style.transform = page.reduce ? "" : `translate3d(0,${(-COPY_RISE_PX * state.gone).toFixed(1)}px,0)`;
    copy.inert = state.gone >= 1;
    wordname.style.opacity = state.name.toFixed(3);
    wordname.inert = state.name <= 0;
    bar.style.setProperty("--ground", (1 - state.opacity).toFixed(3));
    if (hole) {
      hole.paused = state.paused;
      hole.dirty = true;
    }
  });

  page.everyFrame((now) => {
    if (hole?.active()) hole.draw(now);
  });

  if (hole && document.fonts?.load) {
    document.fonts.load(MONO_FACE).then((faces) => {
      if (faces.length) hole.setFont(page.token("--mono"));
    }).catch(() => {});
  }
}
