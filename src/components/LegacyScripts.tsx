"use client";

import { useEffect } from "react";
import { startHeroCamera } from "@/hero/heroCamera";

type Step = string | (() => void);

const STEPS: Step[] = [
  "data",
  "engine",
  startHeroCamera,
  "chapters",
  "crt-engine",
  "crt-plants",
  "crt-computer",
  "crt-ground",
  "crt-scenes",
  "crt-scene",
  "os-icons",
  "os-apps",
  "os-paint",
  "os",
  "about",
  "hands",
  "ui",
];
let started = false;

function load(name: string): Promise<void> {
  return new Promise((done) => {
    const script = document.createElement("script");
    script.src = `/legacy/${name}.js`;
    script.onload = () => done();
    script.onerror = () => done();
    document.body.appendChild(script);
  });
}

export function LegacyScripts() {
  useEffect(() => {
    if (started) return;
    started = true;
    void (async () => {
      for (const step of STEPS) {
        if (typeof step === "string") await load(step);
        else step();
      }
    })();
  }, []);
  return null;
}
