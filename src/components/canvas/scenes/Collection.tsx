"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { siteConfig } from "@/config/site.config";
import { Product } from "../product/Product";
import { GlowFloor } from "./GlowFloor";
import { Motes } from "./Motes";
import { lookFrom } from "../product/look";
import { colorwayById, formatPrice, useForge } from "@/lib/store";
import { local, isNear, range } from "@/lib/scroll";
import { htmlLayer } from "@/lib/htmlLayer";

export const COLLECTION_CENTER = new THREE.Vector3(0, 0, -60);
const RADIUS = 5;

/** Scene 4b: the collection on a scroll-driven 3D carousel. Click a product to add it to the cart. */
export function Collection() {
  const group = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  const items = siteConfig.collection;
  const n = items.length;

  useFrame((_, dt) => {
    const g = group.current;
    if (!g || !wheel.current) return;
    g.visible = isNear("collection", 2) || local("portal") > 0.6;
    if (!g.visible) return;
    const c = local("collection");
    const target = -c * ((n - 1) / n) * Math.PI * 2;
    wheel.current.rotation.y = THREE.MathUtils.damp(wheel.current.rotation.y, target, 5, dt);
  });

  return (
    <group ref={group} position={COLLECTION_CENTER}>
      <group ref={wheel}>
        {items.map((item, i) => (
          <CollectionItem key={item.id} index={i} count={n} item={item} />
        ))}
      </group>
      <GlowFloor radius={14} y={-1.25} strength={0.18} />
      <Motes count={120} scale={[14, 5, 14]} size={2.5} speed={0.3} opacity={0.6} />
    </group>
  );
}

function CollectionItem({ index, count, item }: { index: number; count: number; item: (typeof siteConfig.collection)[number] }) {
  const ref = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const cw = colorwayById(item.colorway);
  const look = useMemo(() => lookFrom(cw), [cw]);
  const addToCart = useForge((s) => s.addToCart);
  const a = (index / count) * Math.PI * 2;
  const pedestalGlow = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(cw.accent).multiplyScalar(3), toneMapped: false }), [cw]);
  const labelRef = useRef<HTMLDivElement>(null);
  const world = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    if (!ref.current || !spin.current) return;
    spin.current.rotation.y += dt * (hovered ? 1.6 : 0.4);
    const s = THREE.MathUtils.damp(ref.current.scale.x, hovered ? 0.68 : 0.55, 8, dt);
    ref.current.scale.setScalar(s);
    // fade labels for items at the back of the wheel
    ref.current.getWorldPosition(world);
    const facing = range(world.z, COLLECTION_CENTER.z + 1.5, COLLECTION_CENTER.z + RADIUS - 0.5) * (isNear("collection", 0.2) ? 1 : 0);
    if (labelRef.current) {
      labelRef.current.style.opacity = String(facing * range(local("collection"), 0, 0.08));
      labelRef.current.style.pointerEvents = facing > 0.6 ? "auto" : "none";
    }
    pedestalGlow.color.set(cw.accent).multiplyScalar(hovered ? 6 : 2.5 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.5);
  });

  const onAdd = () => addToCart({ id: item.id, name: `${item.name} — ${cw.name}`, price: item.price, colorway: cw.id });

  return (
    <group position={[Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS]} rotation={[0, a, 0]}>
      <group
        ref={ref}
        scale={0.55}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.dataset.cursor = "add";
        }}
        onPointerOut={() => {
          setHovered(false);
          delete document.body.dataset.cursor;
        }}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
      >
        <group ref={spin} rotation={[0.15, 0, 0]}>
          <Product look={look} glow={hovered ? 5 : 2.5} />
        </group>
        {/* invisible hit box: easier to click than thin parts */}
        <mesh visible={false}>
          <boxGeometry args={[3, 2.4, 1.6]} />
        </mesh>
      </group>
      <mesh position={[0, -1.15, 0]}>
        <cylinderGeometry args={[1.1, 1.2, 0.12, 64]} />
        <meshStandardMaterial color="#0c0c12" metalness={0.6} roughness={0.45} envMapIntensity={0.3} />
      </mesh>
      <mesh position={[0, -1.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={pedestalGlow}>
        <torusGeometry args={[1.12, 0.015, 8, 96]} />
      </mesh>
      <Html position={[0, -1.75, 0]} center portal={htmlLayer} zIndexRange={[15, 0]}>
        <div ref={labelRef} className="product-chip" style={{ opacity: 0 }}>
          {item.tag && <span className="chip-tag" style={{ background: cw.accent }}>{item.tag}</span>}
          <p className="chip-name">{item.name}</p>
          <p className="chip-meta">
            {cw.name} · {formatPrice(item.price)}
          </p>
          <button className="chip-btn" onClick={onAdd} data-cursor-hover>
            Add to cart
          </button>
        </div>
      </Html>
    </group>
  );
}
