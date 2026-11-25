"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { particlesVertex, particlesFragment } from "@/shaders/particles";
import { useProductSurfaces } from "../product/Product";
import { mainLook } from "../live";
import { local, range, isNear } from "@/lib/scroll";

/**
 * Scene 1: a spiral galaxy of GPU particles that collapses into the product's surface
 * as you scroll. Positions are computed in the vertex shader; JS only updates uniforms.
 */
export function HeroParticles({ count = 42000 }: { count?: number }) {
  const surfaces = useProductSurfaces();
  const dpr = useThree((s) => s.viewport.dpr);
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    // Merge all product surfaces into one position-only geometry and sample it
    const pieces = surfaces.map(({ geometry, matrix }) => {
      let g = geometry.clone().applyMatrix4(matrix);
      if (g.index) g = g.toNonIndexed();
      const onlyPos = new THREE.BufferGeometry();
      onlyPos.setAttribute("position", g.getAttribute("position"));
      return onlyPos;
    });
    const merged = mergeGeometries(pieces, false)!;
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();

    const galaxy = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    const v = new THREE.Vector3();
    const arms = 4;
    for (let i = 0; i < count; i++) {
      // galaxy
      const r = Math.pow(Math.random(), 1.4) * 11 + 0.3;
      const arm = ((i % arms) / arms) * Math.PI * 2;
      const spin = r * 0.55;
      const spread = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.6 * r * 0.35;
      const a = arm + spin;
      galaxy[i * 3] = Math.cos(a) * r + spread;
      galaxy[i * 3 + 1] = (Math.random() - 0.5) * 0.5 * (1.4 - r / 11) + spread * 0.3;
      galaxy[i * 3 + 2] = Math.sin(a) * r + spread;
      // product surface
      sampler.sample(v);
      target[i * 3] = v.x;
      target[i * 3 + 1] = v.y;
      target[i * 3 + 2] = v.z;
      rand[i * 4] = Math.random();
      rand[i * 4 + 1] = Math.random();
      rand[i * 4 + 2] = Math.random();
      // delay: outer stars arrive last, plus noise
      rand[i * 4 + 3] = Math.min(1, (r / 11) * 0.7 + Math.random() * 0.3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(galaxy, 3));
    g.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    pieces.forEach((p) => p.dispose());
    merged.dispose();
    return g;
  }, [surfaces, count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particlesVertex,
        fragmentShader: particlesFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uSize: { value: 55 },
          uPixelRatio: { value: 1 },
          uOpacity: { value: 1 },
          uColorA: { value: new THREE.Color("#ffffff") },
          uColorB: { value: new THREE.Color("#5b3cff") },
          uColorC: { value: new THREE.Color("#7c5cff") },
        },
      }),
    [],
  );

  useFrame((state) => {
    const p = pointsRef.current;
    if (!p) return;
    const h = local("hero");
    p.visible = isNear("hero", 0.5) && h < 0.999;
    if (!p.visible) return;
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uMorph.value = range(h, 0.02, 0.72);
    u.uOpacity.value = 1 - range(h, 0.72, 0.95);
    u.uPixelRatio.value = dpr;
    u.uColorB.value.copy(mainLook.accent).lerp(new THREE.Color("#ff3d81"), 0.25);
    u.uColorC.value.copy(mainLook.accent);
    p.rotation.x = (1 - range(h, 0, 0.6)) * 0.75;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
