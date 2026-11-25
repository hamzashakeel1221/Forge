"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, sectionRanges, totalLength, local } from "@/lib/scroll";
import { siteConfig } from "@/config/site.config";
import { useForge } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;
export const getLenis = () => lenisInstance;

/** Scroll to a position measured in viewport heights */
export function scrollToS(s: number, duration = 1.6) {
  const y = s * window.innerHeight;
  if (lenisInstance) lenisInstance.scrollTo(y, { duration, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis share one clock.
 * Writes the shared `scrollState` that every 3D scene reads per frame.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({ lerp: reduce ? 1 : 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, autoRaf: false });
    lenisInstance = lenis;
    lenis.stop(); // released by the loader

    const n = siteConfig.colorways.length;
    const update = () => {
      const vh = window.innerHeight;
      scrollState.s = lenis.scroll / vh;
      scrollState.progress = lenis.limit > 0 ? lenis.scroll / lenis.limit : 0;
      scrollState.velocity = lenis.velocity;

      const st = useForge.getState();
      // active section
      let active = sectionRanges[0].id as string;
      for (const r of sectionRanges) if (scrollState.s >= r.start - 0.5) active = r.id;
      if (active !== st.activeSection) st.setActiveSection(active);
      // scrolling through the configurator morphs colourways
      if (active === "configure") {
        const idx = Math.min(n - 1, Math.floor(local("configure") * n * 0.9999));
        if (idx !== st.colorIndex) st.setColorIndex(idx);
      }
      document.documentElement.style.setProperty("--scroll-progress", String(scrollState.progress));
    };
    lenis.on("scroll", () => {
      update();
      ScrollTrigger.update();
    });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onPointer = (e: PointerEvent) => {
      scrollState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // relax velocity to 0 when idle
    const decay = () => {
      scrollState.velocity *= 0.9;
    };
    gsap.ticker.add(decay);
    update();

    const unsub = useForge.subscribe((s, prev) => {
      if (s.loaded && !prev.loaded) {
        lenis.start();
      }
    });
    if (useForge.getState().loaded) lenis.start();

    return () => {
      unsub();
      gsap.ticker.remove(tick);
      gsap.ticker.remove(decay);
      window.removeEventListener("pointermove", onPointer);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return <div aria-hidden style={{ height: 0 }} data-total-length={totalLength} />;
}
