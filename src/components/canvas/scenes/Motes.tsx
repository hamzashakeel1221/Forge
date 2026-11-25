"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Floating, twinkling dust motes. A drop-in for drei's <Sparkles>, whose fragment shader divides
 * by the distance to the point centre and can emit Infinity: with bloom on, a single infinite
 * pixel turns the whole frame to NaN and the canvas flickers blank. This one is bounded.
 */
export function Motes({
  count = 120,
  scale = [10, 5, 10],
  size = 3,
  speed = 0.3,
  opacity = 0.7,
  color = "#ffffff",
}: {
  count?: number;
  scale?: [number, number, number];
  size?: number;
  speed?: number;
  opacity?: number;
  color?: string;
}) {
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * scale[0];
      pos[i * 3 + 1] = (Math.random() - 0.5) * scale[1];
      pos[i * 3 + 2] = (Math.random() - 0.5) * scale[2];
      rnd[i * 2] = Math.random();
      rnd[i * 2 + 1] = 0.4 + Math.random() * 0.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 2));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(...scale));
    return g;
  }, [count, scale[0], scale[1], scale[2]]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uSpeed: { value: speed },
          uOpacity: { value: opacity },
          uPixelRatio: { value: 1 },
          uColor: { value: new THREE.Color(color) },
        },
        vertexShader: /* glsl */ `
          uniform float uTime; uniform float uSize; uniform float uSpeed; uniform float uPixelRatio;
          attribute vec2 aRnd; varying float vTwinkle;
          void main() {
            vec3 p = position;
            float t = uTime * uSpeed;
            p.x += sin(t + aRnd.x * 40.0) * 0.25;
            p.y += sin(t * 0.7 + aRnd.x * 20.0) * 0.35;
            p.z += cos(t * 0.8 + aRnd.x * 30.0) * 0.25;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * 12.0 * aRnd.y * uPixelRatio / max(0.5, -mv.z);
            vTwinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aRnd.x * 60.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; varying float vTwinkle;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = 1.0 - smoothstep(0.0, 0.5, d);
            a = a * a;
            gl_FragColor = vec4(uColor * 1.5, a * uOpacity * vTwinkle);
          }`,
      }),
    [size, speed, opacity, color],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = dpr;
  });

  return <points geometry={geometry} material={material} />;
}
