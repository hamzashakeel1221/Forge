import * as THREE from "three";

export type PartRole = "primary" | "soft" | "metal" | "accent" | "glow" | "driver";

export type PartDef = {
  name: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  role: PartRole;
  /** Offset applied when fully exploded */
  explode: [number, number, number];
  /** 0..1, when in the explode timeline this part starts moving */
  delay: number;
};

const X_AXIS: [number, number, number] = [0, 0, Math.PI / 2];

/**
 * Procedural "Forge One" headphones, built from primitives so the template ships with
 * zero binary assets. Every piece is a separate part so it can be exploded and labelled.
 */
export function buildHeadphoneParts(): PartDef[] {
  const parts: PartDef[] = [];
  const add = (p: PartDef) => parts.push(p);

  add({
    name: "band",
    geometry: new THREE.TorusGeometry(1.18, 0.075, 24, 128, Math.PI),
    position: [0, 0.12, 0],
    rotation: [0, 0, 0],
    role: "primary",
    explode: [0, 1.5, -0.3],
    delay: 0,
  });
  add({
    name: "bandCushion",
    geometry: new THREE.TorusGeometry(1.08, 0.065, 16, 96, Math.PI * 0.62),
    position: [0, 0.12, 0],
    rotation: [0, 0, Math.PI * 0.19],
    role: "soft",
    explode: [0, 0.85, 0.9],
    delay: 0.1,
  });

  for (const side of [-1, 1] as const) {
    const S = side < 0 ? "L" : "R";
    const x = 1.2 * side;
    add({
      name: `slider${S}`,
      geometry: new THREE.CylinderGeometry(0.035, 0.035, 0.42, 16),
      position: [1.18 * side, -0.02, 0],
      rotation: [0, 0, 0],
      role: "metal",
      explode: [0.7 * side, 0.6, 0],
      delay: 0.05,
    });
    add({
      name: `yoke${S}`,
      geometry: new THREE.TorusGeometry(0.56, 0.03, 12, 64, Math.PI),
      position: [x, -0.58, 0],
      rotation: [0, Math.PI / 2, 0],
      role: "metal",
      explode: [1.0 * side, 0.35, 0],
      delay: 0.15,
    });
    add({
      name: `cup${S}`,
      geometry: new THREE.CylinderGeometry(0.52, 0.5, 0.3, 64, 1),
      position: [x, -0.6, 0],
      rotation: X_AXIS,
      role: "primary",
      explode: [1.55 * side, -0.25, 0],
      delay: 0.2,
    });
    add({
      name: `plate${S}`,
      geometry: new THREE.CylinderGeometry(0.42, 0.42, 0.05, 64),
      position: [x + 0.17 * side, -0.6, 0],
      rotation: X_AXIS,
      role: "accent",
      explode: [2.6 * side, -0.2, 0.2],
      delay: 0.3,
    });
    add({
      name: `ring${S}`,
      geometry: new THREE.TorusGeometry(0.46, 0.018, 12, 96),
      position: [x + 0.16 * side, -0.6, 0],
      rotation: [0, Math.PI / 2, 0],
      role: "glow",
      explode: [3.0 * side, -0.2, 0.2],
      delay: 0.35,
    });
    add({
      name: `cushion${S}`,
      geometry: new THREE.TorusGeometry(0.36, 0.14, 24, 64),
      position: [x - 0.2 * side, -0.6, 0],
      rotation: [0, Math.PI / 2, 0],
      role: "soft",
      explode: [-0.15 * side, -0.35, 1.6],
      delay: 0.25,
    });
    add({
      name: `driver${S}`,
      geometry: new THREE.CylinderGeometry(0.1, 0.32, 0.12, 48, 1, true),
      position: [x - 0.08 * side, -0.6, 0],
      rotation: [0, 0, (-Math.PI / 2) * side],
      role: "driver",
      explode: [0.2 * side, 0.1, -1.7],
      delay: 0.3,
    });
    add({
      name: `cap${S}`,
      geometry: new THREE.SphereGeometry(0.1, 24, 16),
      position: [x - 0.12 * side, -0.6, 0],
      rotation: [0, 0, 0],
      role: "glow",
      explode: [0.2 * side, 0.1, -2.1],
      delay: 0.35,
    });
  }
  return parts;
}

/** Bakes all parts into world-space geometry for surface sampling */
export function partsToMeshes(parts: PartDef[]) {
  return parts.map((p) => {
    const m = new THREE.Mesh(p.geometry);
    m.position.set(...p.position);
    m.rotation.set(...p.rotation);
    m.updateMatrix();
    return { geometry: p.geometry, matrix: m.matrix.clone() };
  });
}
