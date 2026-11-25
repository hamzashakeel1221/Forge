"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Product } from "../product/Product";
import { GlowFloor } from "./GlowFloor";
import { Motes } from "./Motes";
import { mainLook } from "../live";
import { isNear, local, range, smooth } from "@/lib/scroll";

export const CHECKOUT_CENTER = new THREE.Vector3(0, 0, -120);

/** Scene 6: hero pedestal with the colourway the visitor picked, halo rings and heavy bloom. */
export function Checkout() {
  const group = useRef<THREE.Group>(null);
  const prod = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const softGlow = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.6 }), []);
  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uColor: { value: new THREE.Color() }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uTime; varying vec2 vUv;
          void main(){ float a = pow(1.0 - vUv.y, 2.2) * smoothstep(0.0, 0.3, vUv.y) * (0.6 + 0.4 * sin(vUv.x * 40.0 + uTime * 2.0));
          gl_FragColor = vec4(uColor * a * 0.55, a * 0.18); }`,
      }),
    [],
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    g.visible = isNear("checkout", 1.5);
    if (!g.visible) return;
    const t = state.clock.elapsedTime;
    const c = local("checkout");
    const rise = smooth(range(c, 0, 0.35));
    glowMat.color.copy(mainLook.accent).multiplyScalar(4 + Math.sin(t * 2) * 1);
    softGlow.color.copy(mainLook.accent).multiplyScalar(1.5);
    beamMat.uniforms.uColor.value.copy(mainLook.accent);
    beamMat.uniforms.uTime.value = t;
    rings.current.forEach((r, i) => {
      if (!r) return;
      r.rotation.x = Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.4 * (1 - rise * 0.6);
      r.rotation.y = t * (0.2 + i * 0.12) * (i % 2 ? -1 : 1);
      r.scale.setScalar(0.6 + rise * 0.4 + i * 0.0);
    });
    if (prod.current) {
      prod.current.position.y = -0.6 + rise * 1.2;
      prod.current.rotation.y += dt * 0.5;
    }
  });

  return (
    <group ref={group} position={CHECKOUT_CENTER}>
      <group ref={prod}>
        <Float speed={2} floatIntensity={0.4} rotationIntensity={0.2}>
          <Product look={mainLook} glow={5} scale={0.85} />
        </Float>
      </group>
      {/* halo rings */}
      {[1.9, 2.25, 2.7].map((r, i) => (
        <mesh key={r} ref={(el) => void (rings.current[i] = el)} position={[0, 0.6, 0]} material={i === 1 ? glowMat : softGlow}>
          <torusGeometry args={[r, i === 1 ? 0.025 : 0.008, 12, 200]} />
        </mesh>
      ))}
      {/* pedestal */}
      <mesh position={[0, -1.35, 0]}>
        <cylinderGeometry args={[1.5, 1.7, 0.3, 96]} />
        <meshPhysicalMaterial color="#0c0c12" metalness={0.8} roughness={0.4} clearcoat={0.4} envMapIntensity={0.12} />
      </mesh>
      <mesh position={[0, -1.19, 0]} rotation={[Math.PI / 2, 0, 0]} material={glowMat}>
        <torusGeometry args={[1.52, 0.02, 8, 160]} />
      </mesh>
      {/* light beam */}
      <mesh position={[0, 0.8, 0]} material={beamMat}>
        <cylinderGeometry args={[1.45, 1.45, 4, 64, 1, true]} />
      </mesh>
      <GlowFloor radius={14} y={-1.5} />
      <Motes count={160} scale={[10, 6, 10]} size={3} speed={0.4} opacity={0.8} color="#ffffff" />
    </group>
  );
}
