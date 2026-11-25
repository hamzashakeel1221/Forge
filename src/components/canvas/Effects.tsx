"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode, type ChromaticAberrationEffect } from "postprocessing";
import { useControls } from "leva";
import { local, scrollState } from "@/lib/scroll";

/** Post-processing: bloom for every emissive part, scroll-reactive chromatic aberration, film grain. */
export function Effects({ quality = "high" }: { quality?: "high" | "low" }) {
  const ca = useRef<ChromaticAberrationEffect>(null);
  const { bloom, threshold, aberration, grain } = useControls("Post FX", {
    bloom: { value: 1.25, min: 0, max: 4, step: 0.05 },
    threshold: { value: 0.9, min: 0, max: 2, step: 0.05 },
    aberration: { value: 1, min: 0, max: 4, step: 0.1 },
    grain: { value: 0.045, min: 0, max: 0.3, step: 0.005 },
  });

  useFrame(() => {
    if (!ca.current) return;
    const p = local("portal");
    const tunnel = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);
    const v = Math.min(1, Math.abs(scrollState.velocity) * 0.015);
    const amt = (0.0006 + v * 0.004 + tunnel * 0.004) * aberration;
    ca.current.offset.set(amt, amt * 0.6);
  });

  return (
    <EffectComposer multisampling={quality === "high" ? 4 : 0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={bloom} luminanceThreshold={threshold} luminanceSmoothing={0.2} radius={0.75} />
      <ChromaticAberration
        ref={ca}
        offset={new THREE.Vector2(0.0006, 0.0004)}
        radialModulation
        modulationOffset={0.25}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
      <Noise opacity={grain} premultiply blendFunction={BlendFunction.SCREEN} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  );
}
