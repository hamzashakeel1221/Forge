"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { siteConfig } from "@/config/site.config";
import { smooth } from "@/lib/scroll";
import { ProductModel, type ProductProps } from "./ProductModel";
import { buildHeadphoneParts, partsToMeshes } from "./parts";

const MODEL = siteConfig.product.model;
const IS_GLB = MODEL !== "procedural";

/**
 * Renders the configured product: the built-in procedural headphones, or any GLB
 * from /public. Same props either way, so every scene works with both.
 */
export function Product(props: ProductProps) {
  return IS_GLB ? <GlbProduct {...props} url={MODEL} /> : <ProductModel {...props} />;
}

function GlbProduct({ url, look, explode, opacity, glow = 3, labels: _labels, ...group }: ProductProps & { url: string }) {
  const gltf = useGLTF(url);
  const { scene, meshes } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    // normalise to ~2.6 units wide and centre it
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2.6 / Math.max(size.x, size.y, size.z);
    scene.scale.setScalar(s);
    scene.position.copy(center).multiplyScalar(-s);
    const meshes: { mesh: THREE.Mesh; base: THREE.Vector3; dir: THREE.Vector3; role: "primary" | "accent" | "other" }[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = m.receiveShadow = true;
      const mat = (m.material as THREE.MeshStandardMaterial).clone();
      m.material = mat;
      const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()).sub(center);
      const role = siteConfig.product.glbColorMaterials.includes(mat.name)
        ? "primary"
        : siteConfig.product.glbAccentMaterials.includes(mat.name)
          ? "accent"
          : "other";
      meshes.push({ mesh: m, base: m.position.clone(), dir: c.lengthSq() > 1e-6 ? c.normalize() : new THREE.Vector3(0, 1, 0), role });
    });
    return { scene, meshes };
  }, [gltf]);

  useFrame(() => {
    const e = explode ? smooth(explode()) : 0;
    const o = opacity ? opacity() : 1;
    meshes.forEach(({ mesh, base, dir, role }, i) => {
      mesh.position.copy(base).addScaledVector(dir, e * (0.8 + (i % 3) * 0.3) / (scene.scale.x || 1));
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (role === "primary") {
        mat.color.copy(look.primary);
        mat.metalness = look.metalness;
        mat.roughness = look.roughness;
      } else if (role === "accent") {
        mat.color.copy(look.accent);
        mat.emissive?.copy(look.accent).multiplyScalar(glow * 0.2);
      }
      const transparent = o < 0.999;
      if (mat.transparent !== transparent) {
        mat.transparent = transparent;
        mat.needsUpdate = true;
      }
      mat.opacity = o;
    });
  });

  return (
    <group {...group}>
      <primitive object={scene} />
    </group>
  );
}

/** World-space surfaces of the product, used to sample the hero particle swarm */
export function useProductSurfaces(): { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }[] {
  if (IS_GLB) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- MODEL is a build-time constant
    return useGlbSurfaces(MODEL);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => partsToMeshes(buildHeadphoneParts()), []);
}

function useGlbSurfaces(url: string) {
  const gltf = useGLTF(url);
  return useMemo(() => {
    const root = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2.6 / Math.max(size.x, size.y, size.z);
    root.scale.setScalar(s);
    root.position.copy(center).multiplyScalar(-s);
    root.updateMatrixWorld(true);
    const out: { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }[] = [];
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) out.push({ geometry: m.geometry, matrix: m.matrixWorld.clone() });
    });
    return out;
  }, [gltf]);
}

export function useSpin(speed = 0.2) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed;
  });
  return ref;
}
