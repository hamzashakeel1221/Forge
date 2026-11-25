"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, Preload } from "@react-three/drei";
import { siteConfig } from "@/config/site.config";
import { useForge } from "@/lib/store";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { mainLook } from "./live";
import { dampLook } from "./product/look";
import { Backdrop } from "./scenes/Backdrop";
import { HeroParticles } from "./scenes/HeroParticles";
import { MainProduct } from "./scenes/MainProduct";
import { ConfigureOrbit } from "./scenes/ConfigureOrbit";
import { Portal } from "./scenes/Portal";
import { Collection } from "./scenes/Collection";
import { PhysicsDrop } from "./scenes/PhysicsDrop";
import { Checkout } from "./scenes/Checkout";

/** Damps the shared product look toward the colourway selected in the store. */
function LookController() {
  useFrame((_, dt) => {
    const cw = siteConfig.colorways[useForge.getState().colorIndex];
    dampLook(mainLook, cw, 3.2, Math.min(dt, 0.1));
  });
  return null;
}

function Ready() {
  const setLoaded = useForge((s) => s.setLoaded);
  useEffect(() => {
    // wait two frames so shaders are compiled before we lift the curtain
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setLoaded(true))));
    return () => cancelAnimationFrame(id);
  }, [setLoaded]);
  return null;
}

/** Studio lighting built from light formers: no HDR download needed. */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#050507"]} />
      <Lightformer form="rect" intensity={4} position={[0, 5, -9]} scale={[10, 10, 1]} />
      <Lightformer form="rect" intensity={2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 0.5, 1]} />
      <Lightformer form="rect" intensity={2} position={[5, -1, -1]} rotation-y={-Math.PI / 2} scale={[20, 0.5, 1]} />
      <Lightformer form="ring" color="#a78bfa" intensity={6} position={[10, 5, 10]} scale={4} onUpdate={(self) => self.lookAt(0, 0, 0)} />
      <Lightformer form="circle" color="#ff7ab6" intensity={3} position={[-10, 3, 8]} scale={3} onUpdate={(self) => self.lookAt(0, 0, 0)} />
    </Environment>
  );
}

export default function Experience() {
  const [dpr, setDpr] = useState<number>(1.5);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 768px)").matches;
    setMobile(m);
    setDpr(Math.min(window.devicePixelRatio, m ? 1.25 : 1.75));
  }, []);

  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: "fixed", inset: 0 }}
      dpr={dpr}
      camera={{ fov: mobile ? 55 : 40, near: 0.1, far: 220, position: [0, 1.2, 15] }}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
      onCreated={(state) => {
        if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __forge: unknown }).__forge = state;
      }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(mobile ? 1.25 : 1.75, d + 0.25))}
        onFallback={() => setDpr(1)}
      />
      <Suspense fallback={null}>
        <Studio />
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 8, 5]} intensity={1.6} />
        <pointLight position={[-4, 2, 3]} intensity={18} color="#8b5cf6" distance={14} />
        <pointLight position={[0, 6, -88]} intensity={25} distance={22} />
        <pointLight position={[0, 4, -117]} intensity={12} distance={16} color="#ffffff" />

        <LookController />
        <CameraRig />
        <Backdrop />

        <HeroParticles count={mobile ? 18000 : 42000} />
        <MainProduct />
        <ConfigureOrbit />
        <Portal />
        <Collection />
        <PhysicsDrop />
        <Checkout />

        <Effects quality={mobile ? "low" : "high"} />
        <Preload all />
        <Ready />
      </Suspense>
    </Canvas>
  );
}
