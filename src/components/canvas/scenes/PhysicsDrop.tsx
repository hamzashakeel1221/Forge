"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  BallCollider,
  InstancedRigidBodies,
  type InstancedRigidBodyProps,
  type RapierRigidBody,
} from "@react-three/rapier";
import { siteConfig } from "@/config/site.config";
import { isNear, local } from "@/lib/scroll";
import { mainLook } from "../live";

export const PHYSICS_CENTER = new THREE.Vector3(0, 0, -90);
const BOXES = 28;
const ORBS = 18;

/**
 * Scene 5: "fresh drops". Branded boxes and orbs rain onto a glossy stage with real
 * rigid-body physics (Rapier, WASM). A kinematic ball follows the pointer so you can shove them.
 * The simulation only runs while the scene is on screen, and re-drops every time you arrive.
 */
export function PhysicsDrop() {
  const group = useRef<THREE.Group>(null);
  const [active, setActive] = useState(false);
  const [dropId, setDropId] = useState(0);
  const wasActive = useRef(false);

  useFrame(() => {
    const near = isNear("physics", 0.6);
    if (group.current) group.current.visible = isNear("physics", 1.2);
    if (near !== wasActive.current) {
      wasActive.current = near;
      setActive(near);
      if (near) setDropId((d) => d + 1);
    }
  });

  // Physics bodies live in world space (not inside a transformed group) so Rapier stays exact.
  return (
    <group ref={group}>
      <group position={PHYSICS_CENTER}>
        <Stage />
      </group>
      {dropId > 0 && (
        <Physics gravity={[0, -14, 0]} paused={!active} key={dropId} timeStep={1 / 60}>
          <Drops />
          <PointerPusher />
          {/* floor + invisible walls */}
          <RigidBody type="fixed" colliders={false} position={PHYSICS_CENTER.toArray()}>
            <CuboidCollider args={[7, 2, 7]} position={[0, -2, 0]} restitution={0.3} friction={0.8} />
            <CuboidCollider args={[0.5, 6, 7]} position={[-7.5, 5, 0]} />
            <CuboidCollider args={[0.5, 6, 7]} position={[7.5, 5, 0]} />
            <CuboidCollider args={[7, 6, 0.5]} position={[0, 5, -7.5]} />
            <CuboidCollider args={[7, 6, 0.5]} position={[0, 5, 7.5]} />
          </RigidBody>
        </Physics>
      )}
    </group>
  );
}

function Stage() {
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  useFrame((state) => {
    ringMat.color.copy(mainLook.accent).multiplyScalar(2.5 + Math.sin(state.clock.elapsedTime * 3) * 0.6);
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshPhysicalMaterial color="#0a0a10" metalness={0.2} roughness={0.55} clearcoat={0.6} clearcoatRoughness={0.4} envMapIntensity={0.25} />
      </mesh>
      {[2.5, 4.5, 6.5].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={ringMat}>
          <ringGeometry args={[r, r + 0.03, 128]} />
        </mesh>
      ))}
      <gridHelper args={[14, 28, "#2a2a3a", "#16161f"]} position={[0, 0.005, 0]} />
    </group>
  );
}

function Drops() {
  const boxGeo = useMemo(() => new RoundedBoxGeometry(1, 0.7, 1, 4, 0.08), []);
  const orbGeo = useMemo(() => new THREE.SphereGeometry(0.42, 32, 24), []);
  const boxMat = useMemo(() => new THREE.MeshPhysicalMaterial({ roughness: 0.3, metalness: 0.3, clearcoat: 1 }), []);
  const orbMat = useMemo(() => new THREE.MeshPhysicalMaterial({ roughness: 0.08, metalness: 0.9, clearcoat: 1 }), []);
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const orbRef = useRef<THREE.InstancedMesh>(null);

  const boxes = useMemo<InstancedRigidBodyProps[]>(
    () =>
      Array.from({ length: BOXES }, (_, i) => ({
        key: `b${i}`,
        position: [PHYSICS_CENTER.x + (Math.random() - 0.5) * 8, 6 + i * 0.55, PHYSICS_CENTER.z + (Math.random() - 0.5) * 8],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      })),
    [],
  );
  const orbs = useMemo<InstancedRigidBodyProps[]>(
    () =>
      Array.from({ length: ORBS }, (_, i) => ({
        key: `o${i}`,
        position: [PHYSICS_CENTER.x + (Math.random() - 0.5) * 8, 9 + i * 0.7, PHYSICS_CENTER.z + (Math.random() - 0.5) * 8],
      })),
    [],
  );

  useEffect(() => {
    const cws = siteConfig.colorways;
    const c = new THREE.Color();
    for (let i = 0; i < BOXES; i++) boxRef.current?.setColorAt(i, c.set(cws[i % cws.length].primary));
    for (let i = 0; i < ORBS; i++) orbRef.current?.setColorAt(i, c.set(cws[(i + 2) % cws.length].accent));
    if (boxRef.current?.instanceColor) boxRef.current.instanceColor.needsUpdate = true;
    if (orbRef.current?.instanceColor) orbRef.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <>
      <InstancedRigidBodies instances={boxes} colliders="cuboid" restitution={0.35} friction={0.7} ccd>
        <instancedMesh ref={boxRef} args={[boxGeo, boxMat, BOXES]} castShadow receiveShadow frustumCulled={false} />
      </InstancedRigidBodies>
      <InstancedRigidBodies instances={orbs} colliders="ball" restitution={0.6} friction={0.3} ccd>
        <instancedMesh ref={orbRef} args={[orbGeo, orbMat, ORBS]} castShadow receiveShadow frustumCulled={false} />
      </InstancedRigidBodies>
    </>
  );
}

function PointerPusher() {
  const body = useRef<RapierRigidBody>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const tmp = useMemo(
    () => ({ ray: new THREE.Raycaster(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5), hit: new THREE.Vector3() }),
    [],
  );
  useFrame((state) => {
    if (!body.current) return;
    tmp.ray.setFromCamera(state.pointer, state.camera);
    if (tmp.ray.ray.intersectPlane(tmp.plane, tmp.hit)) {
      const x = PHYSICS_CENTER.x + THREE.MathUtils.clamp(tmp.hit.x - PHYSICS_CENTER.x, -6.5, 6.5);
      const z = PHYSICS_CENTER.z + THREE.MathUtils.clamp(tmp.hit.z - PHYSICS_CENTER.z, -6.5, 6.5);
      body.current.setNextKinematicTranslation({ x, y: 0.6, z });
    }
    if (mesh.current) mesh.current.visible = local("physics") > 0.05;
  });
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[PHYSICS_CENTER.x, 0.6, PHYSICS_CENTER.z]}>
      <BallCollider args={[0.7]} />
      <mesh ref={mesh}>
        <sphereGeometry args={[0.7, 32, 24]} />
        <meshPhysicalMaterial color="#ffffff" metalness={1} roughness={0.05} clearcoat={1} envMapIntensity={2} />
      </mesh>
    </RigidBody>
  );
}
