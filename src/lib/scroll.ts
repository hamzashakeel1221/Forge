import { siteConfig, type SectionId } from "@/config/site.config";

/**
 * Global, mutable scroll state. Written by the Lenis/ScrollTrigger bridge on the DOM side,
 * read every frame by the 3D scenes (no React re-renders on scroll).
 *
 * `s` is the scroll position measured in viewport heights (0 = top of page).
 */
export const scrollState = {
  s: 0,
  progress: 0,
  velocity: 0,
  pointer: { x: 0, y: 0 },
};

export type SectionRange = { id: SectionId; start: number; length: number };

export const sectionRanges: SectionRange[] = (() => {
  let offset = 0;
  return siteConfig.sections.map((sec) => {
    const r = { id: sec.id, start: offset, length: Math.max(2, sec.length) };
    offset += r.length;
    return r;
  });
})();

export const totalLength = sectionRanges.reduce((a, r) => a + r.length, 0);

const rangeById = Object.fromEntries(sectionRanges.map((r) => [r.id, r])) as Record<SectionId, SectionRange>;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** Remap v from [a,b] to [0,1], clamped */
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

/**
 * Local progress of a section, 0 → 1 while its content is pinned on screen.
 * Values are clamped, so they stay at 0 before and 1 after.
 */
export function local(id: SectionId, s = scrollState.s) {
  const r = rangeById[id];
  return clamp01((s - r.start) / (r.length - 1));
}

/** Raw (unclamped) local progress: <0 before the section, >1 after it. */
export function localRaw(id: SectionId, s = scrollState.s) {
  const r = rangeById[id];
  return (s - r.start) / (r.length - 1);
}

/** True while the section (plus a margin in viewport heights) is on screen */
export function isNear(id: SectionId, margin = 1, s = scrollState.s) {
  const r = rangeById[id];
  return s > r.start - margin && s < r.start + r.length + margin;
}

export function sectionStart(id: SectionId) {
  return rangeById[id].start;
}
export function sectionLength(id: SectionId) {
  return rangeById[id].length;
}
