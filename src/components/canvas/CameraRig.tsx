"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { scrollState, sectionStart, sectionLength } from "@/lib/scroll";
import type { SectionId } from "@/config/site.config";

type Key = { at: [SectionId, number]; pos: [number, number, number]; look: [number, number, number] };

/**
 * Camera keyframes. `at` is [section, local progress 0..1], so the path stays in sync
 * with the page no matter how long each section is in the config.
 */
const KEYS: Key[] = [
  { at: ["hero", 0], pos: [0, 1.2, 15], look: [0, 0, 0] },
  { at: ["hero", 0.75], pos: [0, 0.25, 6.4], look: [0, -0.25, 0] },
  { at: ["explode", 0], pos: [0.4, 0.5, 7.2], look: [-0.8, -0.2, 0] },
  { at: ["explode", 0.45], pos: [4.6, 2.4, 9.2], look: [-1.6, -0.2, 0] },
  { at: ["explode", 0.85], pos: [-2.2, 1.4, 9.6], look: [-1.8, -0.3, 0] },
  { at: ["configure", 0], pos: [-0.6, 0.3, 5.6], look: [1.1, -0.3, 0] },
  { at: ["configure", 1], pos: [2.2, -0.5, 5.0], look: [1.2, -0.3, 0] },
  { at: ["portal", 0], pos: [0, 0.4, 6], look: [0, 0, -9] },
  { at: ["portal", 0.45], pos: [0, 0, -14], look: [0, 0, -40] },
  { at: ["portal", 1], pos: [0, 0.2, -42], look: [0, 0, -60] },
  { at: ["collection", 0], pos: [0, 1.4, -47.5], look: [0, 0.1, -60] },
  { at: ["collection", 1], pos: [0, 2.4, -49], look: [0, -0.2, -60] },
  { at: ["physics", 0], pos: [0, 8.5, -79], look: [0, 0, -90] },
  { at: ["physics", 1], pos: [4, 5.5, -80.5], look: [0, 0.4, -90] },
  { at: ["checkout", 0], pos: [-1.6, 1.6, -110.5], look: [0, 0.2, -120] },
  { at: ["checkout", 1], pos: [0, 0.9, -111.8], look: [0, 0.25, -120] },
];

export function CameraRig() {
  const { posCurve, lookCurve, stops } = useMemo(() => {
    const stops = KEYS.map((k) => sectionStart(k.at[0]) + k.at[1] * (sectionLength(k.at[0]) - 1));
    const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal");
    const lookCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.look)), false, "centripetal");
    return { posCurve, lookCurve, stops };
  }, []);

  const tmp = useMemo(
    () => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), curLook: new THREE.Vector3(0, 0, 0), first: true }),
    [],
  );

  useFrame((state, dt) => {
    const s = scrollState.s;
    let i = 0;
    while (i < stops.length - 2 && s > stops[i + 1]) i++;
    const span = stops[i + 1] - stops[i];
    const t = Math.min(1, Math.max(0, (s - stops[i]) / span));
    // ease each segment slightly so the camera "settles" at keyframes
    const te = t * t * (3 - 2 * t) * 0.5 + t * 0.5;
    const u = (i + te) / (stops.length - 1);
    posCurve.getPoint(u, tmp.pos);
    lookCurve.getPoint(u, tmp.look);

    // portrait screens: pull the camera back so wide scenes still fit
    const aspect = state.size.width / state.size.height;
    if (aspect < 1) tmp.pos.sub(tmp.look).multiplyScalar(1 + Math.min(0.5, (1 - aspect) * 0.6)).add(tmp.look);

    // pointer parallax
    const px = scrollState.pointer.x;
    const py = scrollState.pointer.y;
    tmp.pos.x += px * 0.35;
    tmp.pos.y += py * 0.2;

    const cam = state.camera;
    if (tmp.first) {
      cam.position.copy(tmp.pos);
      tmp.curLook.copy(tmp.look);
      tmp.first = false;
    }
    const k = 1 - Math.exp(-4.5 * Math.min(dt, 0.1));
    cam.position.lerp(tmp.pos, k);
    tmp.curLook.lerp(tmp.look, k);
    cam.lookAt(tmp.curLook);
    // subtle roll with scroll velocity
    cam.rotateZ(THREE.MathUtils.clamp(scrollState.velocity * -0.0015, -0.06, 0.06));
  });

  return null;
}
