"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { buildHeadphoneParts, type PartRole } from "./parts";
import type { Look } from "./look";
import { siteConfig } from "@/config/site.config";
import { htmlLayer } from "@/lib/htmlLayer";
import { smooth } from "@/lib/scroll";

export type ProductProps = {
  look: Look;
  /** Returns 0..1 explode amount each frame */
  explode?: () => number;
  /** Returns 0..1 opacity each frame */
  opacity?: () => number;
  /** Returns 0..1 visibility of feature labels each frame */
  labels?: () => number;
  /** Extra glow multiplier for LEDs */
  glow?: number;
} & ThreeElements["group"];

const LABEL_OFFSET = new THREE.Vector3(0, 0.38, 0);

function makeMaterials() {
  const primary = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 0.25,
    iridescenceIOR: 1.6,
    envMapIntensity: 1.4,
  });
  const soft = new THREE.MeshPhysicalMaterial({ roughness: 0.85, metalness: 0, sheen: 1, sheenRoughness: 0.5 });
  const metal = new THREE.MeshStandardMaterial({ color: "#d9dde6", metalness: 1, roughness: 0.18, envMapIntensity: 1.6 });
  const accent = new THREE.MeshPhysicalMaterial({ metalness: 0.9, roughness: 0.25, clearcoat: 0.6 });
  const glow = new THREE.MeshBasicMaterial({ toneMapped: false });
  const driver = new THREE.MeshStandardMaterial({ color: "#0b0b10", metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide });
  return { primary, soft, metal, accent, glow, driver } satisfies Record<PartRole, THREE.Material>;
}

export function ProductModel({ look, explode, opacity, labels, glow = 3, ...group }: ProductProps) {
  const parts = useMemo(() => buildHeadphoneParts(), []);
  const mats = useMemo(() => makeMaterials(), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelGroups = useRef<(THREE.Group | null)[]>([]);
  const lastTransparent = useRef(false);

  const featureParts = useMemo(
    () =>
      siteConfig.features
        .map((f) => ({ f, idx: parts.findIndex((p) => p.name === f.part) }))
        .filter((x) => x.idx >= 0),
    [parts],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // colours
    mats.primary.color.copy(look.primary);
    mats.primary.metalness = look.metalness;
    mats.primary.roughness = look.roughness;
    mats.soft.color.copy(look.soft);
    mats.soft.sheenColor.copy(look.accent);
    mats.accent.color.copy(look.primary).lerp(look.accent, 0.35);
    const pulse = 0.75 + Math.sin(t * 2.4) * 0.25;
    mats.glow.color.copy(look.accent).multiplyScalar(glow * pulse);

    // explode
    const e = explode ? explode() : 0;
    parts.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      const k = smooth((e - p.delay * 0.5) / 0.6);
      m.position.set(
        p.position[0] + p.explode[0] * k,
        p.position[1] + p.explode[1] * k + Math.sin(t * 1.3 + i) * 0.03 * k,
        p.position[2] + p.explode[2] * k,
      );
      m.rotation.set(p.rotation[0] + k * Math.sin(i) * 0.4, p.rotation[1] + k * Math.cos(i) * 0.3, p.rotation[2]);
    });

    // opacity
    const o = opacity ? opacity() : 1;
    const transparent = o < 0.999;
    Object.values(mats).forEach((mat) => {
      mat.opacity = o;
      if (transparent !== lastTransparent.current) {
        mat.transparent = transparent;
        mat.needsUpdate = true;
      }
    });
    lastTransparent.current = transparent;

    // labels
    const lv = labels ? labels() : 0;
    featureParts.forEach((fp, i) => {
      const el = labelRefs.current[i];
      if (!el) return;
      const v = smooth((lv - i * 0.08) / 0.4);
      el.style.opacity = String(v);
      el.style.transform = `translate3d(0, ${(1 - v) * 16}px, 0)`;
      el.style.pointerEvents = v > 0.5 ? "auto" : "none";
      const g = labelGroups.current[i];
      const m = refs.current[fp.idx];
      if (g && m) g.position.copy(m.position).add(LABEL_OFFSET);
    });
  });

  return (
    <group {...group}>
      {parts.map((p, i) => (
        <mesh
          key={p.name}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={p.geometry}
          material={mats[p.role]}
          position={p.position}
          rotation={p.rotation}
          castShadow
          receiveShadow
        />
      ))}
      {labels &&
        featureParts.map((fp, li) => (
          <group
            key={fp.f.title}
            ref={(g) => {
              labelGroups.current[li] = g;
            }}
          >
            <Html center portal={htmlLayer} zIndexRange={[20, 0]}>
              <div
                ref={(el) => {
                  labelRefs.current[li] = el;
                }}
                className="feature-label"
                style={{ opacity: 0 }}
              >
                <span className="feature-dot" />
                <div>
                  <p className="feature-title">{fp.f.title}</p>
                  <p className="feature-body">{fp.f.body}</p>
                </div>
              </div>
            </Html>
          </group>
        ))}
    </group>
  );
}
