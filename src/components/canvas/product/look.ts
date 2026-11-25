import * as THREE from "three";
import type { Colorway } from "@/config/site.config";

/** A colourway as live THREE values, so materials can be lerped every frame without allocations. */
export type Look = {
  primary: THREE.Color;
  accent: THREE.Color;
  soft: THREE.Color;
  background: THREE.Color;
  metalness: number;
  roughness: number;
};

export function lookFrom(c: Colorway): Look {
  return {
    primary: new THREE.Color(c.primary),
    accent: new THREE.Color(c.accent),
    soft: new THREE.Color(c.soft),
    background: new THREE.Color(c.background),
    metalness: c.metalness,
    roughness: c.roughness,
  };
}

const tmp = { primary: new THREE.Color(), accent: new THREE.Color(), soft: new THREE.Color(), background: new THREE.Color() };

/** Frame-rate independent damp of `look` toward colourway `target` */
export function dampLook(look: Look, target: Colorway, lambda: number, dt: number) {
  const t = 1 - Math.exp(-lambda * dt);
  tmp.primary.set(target.primary);
  tmp.accent.set(target.accent);
  tmp.soft.set(target.soft);
  tmp.background.set(target.background);
  look.primary.lerp(tmp.primary, t);
  look.accent.lerp(tmp.accent, t);
  look.soft.lerp(tmp.soft, t);
  look.background.lerp(tmp.background, t);
  look.metalness += (target.metalness - look.metalness) * t;
  look.roughness += (target.roughness - look.roughness) * t;
}
