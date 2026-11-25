"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { tunnelVertex, tunnelFragment } from "@/shaders/tunnel";
import { mainLook } from "../live";
import { local, isNear, range, scrollState } from "@/lib/scroll";

const TUNNEL_START = -9;
const TUNNEL_LEN = 40;
const STREAKS = 700;

/** Scene 4: a glowing ring, a swirling event-horizon disc, then a warp tunnel with light streaks. */
export function Portal() {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  const tunnelMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: tunnelVertex,
        fragmentShader: tunnelFragment,
        side: THREE.BackSide,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uTravel: { value: 0 },
          uSpeed: { value: 0 },
          uOpacity: { value: 1 },
          uColorA: { value: new THREE.Color() },
          uColorB: { value: new THREE.Color("#ff3d81") },
        },
      }),
    [],
  );

  const discMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color() }, uOpacity: { value: 1 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
          void main(){
            vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
            float swirl = sin(a * 6.0 + r * 14.0 - uTime * 3.0) * 0.5 + 0.5;
            float swirl2 = sin(a * 3.0 - r * 9.0 + uTime * 2.0) * 0.5 + 0.5;
            float core = (1.0 - smoothstep(0.0, 1.0, r));
            float edge = smoothstep(0.75, 1.0, r) * (1.0 - smoothstep(0.95, 1.0, r));
            vec3 col = uColor * (swirl * swirl2 * core * 1.1 + edge * 3.0) + vec3(1.0) * pow(core, 8.0) * 0.5;
            gl_FragColor = vec4(col, (core * 0.75 + edge) * uOpacity * (1.0 - smoothstep(0.98, 1.0, r)));
          }`,
      }),
    [],
  );

  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);

  const streaks = useMemo(() => {
    const pos = new Float32Array(STREAKS * 6);
    const seeds = new Float32Array(STREAKS * 3);
    for (let i = 0; i < STREAKS; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 2.2;
      seeds[i * 3] = Math.cos(a) * r;
      seeds[i * 3 + 1] = Math.sin(a) * r;
      seeds[i * 3 + 2] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { g, seeds, pos };
  }, []);
  const streakMat = useMemo(
    () => new THREE.LineBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.visible = isNear("portal", 1.5) || (isNear("configure", 0) && local("configure") > 0.6);
    if (!g.visible) return;
    const t = state.clock.elapsedTime;
    const p = local("portal");
    const speed = Math.min(1, Math.abs(scrollState.velocity) * 0.02);

    tunnelMat.uniforms.uTime.value = t;
    tunnelMat.uniforms.uTravel.value = p;
    tunnelMat.uniforms.uSpeed.value = speed;
    tunnelMat.uniforms.uColorA.value.copy(mainLook.accent);
    tunnelMat.uniforms.uOpacity.value = range(p, 0.1, 0.3) * (1 - range(p, 0.92, 1)) + 0.0001;

    discMat.uniforms.uTime.value = t;
    discMat.uniforms.uColor.value.copy(mainLook.accent);
    discMat.uniforms.uOpacity.value = 1 - range(p, 0.25, 0.4);

    glowMat.color.copy(mainLook.accent).multiplyScalar(5);
    if (ring.current) ring.current.rotation.z = t * 0.4;
    if (ring2.current) ring2.current.rotation.z = -t * 0.25 + p * 4;

    // warp streaks: lines along -z that rush toward the camera
    const { seeds, pos } = streaks;
    const stretch = 0.6 + speed * 6;
    for (let i = 0; i < STREAKS; i++) {
      const z = TUNNEL_START - TUNNEL_LEN + ((seeds[i * 3 + 2] * TUNNEL_LEN + t * (8 + speed * 40)) % TUNNEL_LEN);
      pos[i * 6] = seeds[i * 3];
      pos[i * 6 + 1] = seeds[i * 3 + 1];
      pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = seeds[i * 3];
      pos[i * 6 + 4] = seeds[i * 3 + 1];
      pos[i * 6 + 5] = Math.min(z + stretch, TUNNEL_START);
    }
    streaks.g.attributes.position.needsUpdate = true;
    streakMat.color.copy(mainLook.accent).lerp(new THREE.Color("#ffffff"), 0.5).multiplyScalar(2.5);
    streakMat.opacity = range(p, 0.15, 0.3) * (1 - range(p, 0.9, 1));
  });

  return (
    <group ref={group}>
      {/* portal ring + disc */}
      <group position={[0, 0, TUNNEL_START]}>
        <mesh ref={ring} material={glowMat}>
          <torusGeometry args={[3.05, 0.05, 16, 160]} />
        </mesh>
        <mesh ref={ring2}>
          <torusGeometry args={[3.4, 0.015, 8, 160, Math.PI * 1.4]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh material={discMat} position={[0, 0, -0.05]}>
          <circleGeometry args={[3, 96]} />
        </mesh>
      </group>
      {/* tunnel */}
      <mesh material={tunnelMat} position={[0, 0, TUNNEL_START - TUNNEL_LEN / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, TUNNEL_LEN, 96, 1, true]} />
      </mesh>
      <lineSegments geometry={streaks.g} material={streakMat} frustumCulled={false} />
    </group>
  );
}
