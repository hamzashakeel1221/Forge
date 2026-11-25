"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { mainLook } from "../live";
import { local, scrollState } from "@/lib/scroll";

/** Background colour, fog and a star field that follows the camera so space never ends. */
export function Backdrop() {
  const stars = useRef<THREE.Group>(null);
  const scene = useThree((s) => s.scene);
  const bg = useRef(new THREE.Color());
  useFrame((state) => {
    // darken inside the tunnel
    const p = local("portal");
    const tunnel = Math.sin(Math.min(1, Math.max(0, (p - 0.2) / 0.7)) * Math.PI);
    bg.current.copy(mainLook.background).multiplyScalar(1 - tunnel * 0.7);
    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color();
    (scene.background as THREE.Color).copy(bg.current);
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(bg.current);
    if (stars.current) {
      stars.current.position.copy(state.camera.position);
      stars.current.rotation.y = scrollState.s * 0.05;
    }
  });
  return (
    <>
      <fog attach="fog" args={["#07060d", 18, 70]} />
      <group ref={stars}>
        <Stars radius={60} depth={40} count={4000} factor={3} saturation={0} fade speed={0.6} />
      </group>
    </>
  );
}
