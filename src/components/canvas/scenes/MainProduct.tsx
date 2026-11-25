"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Product } from "../product/Product";
import { mainLook } from "../live";
import { local, range, smooth, isNear, scrollState } from "@/lib/scroll";

/**
 * The hero product used by scenes 1–3 (assemble, explode, configure),
 * then pulled into the portal at the start of scene 4.
 */
export function MainProduct() {
  const outer = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);

  const explode = () => {
    const e = local("explode");
    return range(e, 0.05, 0.4) * (1 - range(e, 0.82, 1));
  };
  const labels = () => {
    const e = local("explode");
    return range(e, 0.3, 0.6) * (1 - range(e, 0.75, 0.85));
  };
  const opacity = () => range(local("hero"), 0.58, 0.85);

  useFrame((state, dt) => {
    const o = outer.current;
    const sp = spin.current;
    if (!o || !sp) return;
    const visible = scrollState.s < 14 && local("hero") > 0.5 && local("portal") < 0.5;
    o.visible = visible && isNear("portal", 20);
    if (!o.visible) return;

    // scroll-driven spin, plus a slow idle spin
    const h = local("hero");
    const c = local("configure");
    const e = local("explode");
    // stays aligned with the particle swarm while it materialises, then turns to a 3/4 view
    const settle = smooth(range(h, 0.85, 1));
    const targetRotY = settle * -0.6 + e * Math.PI * 0.9 + c * Math.PI * 2;
    sp.rotation.y = THREE.MathUtils.damp(sp.rotation.y, targetRotY, 4, dt);
    const tiltX = settle * (0.18 + Math.sin(state.clock.elapsedTime * 0.4) * 0.05) - c * 0.15;
    sp.rotation.x = THREE.MathUtils.damp(sp.rotation.x, tiltX, 4, dt);

    // portal: shrink + fly into the ring
    const p = smooth(range(local("portal"), 0, 0.3));
    o.position.set(0, -p * 0.2, -p * 9);
    o.scale.setScalar(1 - p * 0.92);
    o.rotation.z = p * Math.PI * 1.5;
  });

  return (
    <group ref={outer}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.35}>
        <group ref={spin}>
          <Product look={mainLook} explode={explode} labels={labels} opacity={opacity} />
        </group>
      </Float>
    </group>
  );
}
