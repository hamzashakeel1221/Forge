"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mainLook } from "../live";

/**
 * Cheap, stable stage floor: a radial accent glow with fine concentric rings that fades into
 * the background. Tracks the live colourway.
 */
export function GlowFloor({ radius = 12, y = 0, rings = 18, strength = 0.35 }: { radius?: number; y?: number; rings?: number; strength?: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color() }, uTime: { value: 0 }, uRings: { value: rings }, uStrength: { value: strength } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uTime; uniform float uRings; uniform float uStrength; varying vec2 vUv;
          void main(){
            float r = length(vUv - 0.5) * 2.0;
            float glow = pow(1.0 - clamp(r, 0.0, 1.0), 2.5);
            float ring = (1.0 - smoothstep(0.0, 0.03, abs(fract(r * uRings - uTime * 0.15) - 0.5) - 0.47));
            float sweep = (1.0 - smoothstep(0.0, 0.02, abs(r - fract(uTime * 0.12))));
            vec3 col = uColor * (glow * uStrength + ring * 0.12 * (1.0 - r) + sweep * 0.6 * (1.0 - r));
            float a = (1.0 - smoothstep(0.55, 1.0, r));
            gl_FragColor = vec4(col + vec3(0.012), a);
          }`,
      }),
    [rings, strength],
  );
  useFrame((state) => {
    mat.uniforms.uColor.value.copy(mainLook.accent);
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} material={mat}>
      <circleGeometry args={[radius, 96]} />
    </mesh>
  );
}
