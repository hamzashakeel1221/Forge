"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { siteConfig } from "@/config/site.config";
import { useForge } from "@/lib/store";
import { local, range, isNear } from "@/lib/scroll";

/** Scene 3 garnish: glossy colour orbs orbit the product; the active colourway swells and glows. */
export function ConfigureOrbit() {
  const group = useRef<THREE.Group>(null);
  const orbs = useRef<(THREE.Mesh | null)[]>([]);
  const halo = useRef<THREE.Mesh>(null);
  const mats = useMemo(
    () =>
      siteConfig.colorways.map(
        (c) => new THREE.MeshPhysicalMaterial({ color: c.primary, metalness: c.metalness, roughness: 0.1, clearcoat: 1, emissive: new THREE.Color(c.accent), emissiveIntensity: 0.15 }),
      ),
    [],
  );
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true }), []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const c = local("configure");
    const appear = range(c, 0, 0.12) * (1 - range(c, 0.92, 1));
    g.visible = isNear("configure", 0.3) && appear > 0.001;
    if (!g.visible) return;
    const active = useForge.getState().colorIndex;
    const n = mats.length;
    const t = state.clock.elapsedTime;
    g.rotation.y = -c * Math.PI * 2 + t * 0.1;
    orbs.current.forEach((m, i) => {
      if (!m) return;
      const a = (i / n) * Math.PI * 2;
      const r = 2.3;
      m.position.set(Math.cos(a) * r, Math.sin(t + i) * 0.15 - 0.3, Math.sin(a) * r);
      const target = (i === active ? 0.32 : 0.16) * appear;
      const s = THREE.MathUtils.damp(m.scale.x, target, 6, dt);
      m.scale.setScalar(Math.max(0.0001, s));
      mats[i].emissiveIntensity = THREE.MathUtils.damp(mats[i].emissiveIntensity, i === active ? 1.2 : 0.1, 5, dt);
      if (i === active && halo.current) {
        halo.current.position.copy(m.position);
        halo.current.lookAt(state.camera.position);
      }
    });
    if (halo.current) {
      haloMat.color.set(siteConfig.colorways[active].accent).multiplyScalar(4);
      haloMat.opacity = appear;
      halo.current.scale.setScalar(appear * (1 + Math.sin(t * 4) * 0.06));
    }
  });

  return (
    <group ref={group} position={[0, -0.3, 0]}>
      {mats.map((m, i) => (
        <mesh key={i} ref={(el) => void (orbs.current[i] = el)} material={m}>
          <sphereGeometry args={[1, 48, 32]} />
        </mesh>
      ))}
      <mesh ref={halo} material={haloMat}>
        <torusGeometry args={[0.45, 0.012, 8, 64]} />
      </mesh>
      {/* orbit track */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <torusGeometry args={[2.3, 0.004, 8, 200]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.25} toneMapped={false} />
      </mesh>
    </group>
  );
}
