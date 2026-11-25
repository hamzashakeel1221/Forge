"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "motion/react";
import { siteConfig, type SectionConfig } from "@/config/site.config";
import { useForge, formatPrice } from "@/lib/store";
import { sectionStart, sectionLength } from "@/lib/scroll";
import { SplitHeading } from "./SplitHeading";
import { scrollToS } from "./SmoothScroll";

/**
 * The DOM half of the story. Each config section becomes a tall <section>; its copy is
 * pinned with CSS sticky while the 3D scene behind it plays. Lengths come from the config.
 */
export function Sections() {
  return (
    <main className="relative z-10">
      {siteConfig.sections.map((sec) => (
        <Section key={sec.id} sec={sec} />
      ))}
      <Footer />
    </main>
  );
}

function Section({ sec }: { sec: SectionConfig }) {
  const ref = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // fade the panel away as the section scrolls out
  useGSAP(
    () => {
      if (!panel.current || !ref.current || sec.id === "hero" || sec.id === "checkout") return;
      gsap.fromTo(
        panel.current,
        { opacity: 1, y: 0, filter: "blur(0px)" },
        {
          opacity: 0,
          y: -80,
          filter: "blur(8px)",
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "bottom 165%", end: "bottom 105%", scrub: true },
        },
      );
    },
    { scope: ref },
  );

  const align =
    sec.align === "right" ? "items-end text-right md:pr-[8vw]" : sec.align === "center" ? "items-center text-center" : "items-start text-left md:pl-[8vw]";

  return (
    <section ref={ref} id={sec.id} data-section={sec.id} style={{ height: `${Math.max(2, sec.length) * 100}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen w-full overflow-hidden px-6 md:px-0">
        {sec.id === "hero" ? (
          <Hero sec={sec} />
        ) : sec.id === "checkout" ? (
          <div className="flex h-full w-full flex-col items-center justify-between pb-[6vh] pt-[13vh] text-center">
            <div className="panel">
              <p className="eyebrow">{sec.eyebrow}</p>
              <SplitHeading text={sec.title} className="section-title" trigger={ref} />
              {sec.body && <Reveal trigger={ref}>{sec.body}</Reveal>}
            </div>
            <CheckoutCard />
          </div>
        ) : (
          <div ref={panel} className={`flex h-full w-full flex-col justify-center ${align}`}>
            <div className={`panel max-w-xl ${sec.id === "portal" ? "panel-clear" : ""}`}>
              <p className="eyebrow">{sec.eyebrow}</p>
              <SplitHeading text={sec.title} className="section-title" trigger={ref} />
              {sec.body && <Reveal trigger={ref}>{sec.body}</Reveal>}
              {sec.id === "explode" && <Stats trigger={ref} />}
              {sec.id === "configure" && <Swatches />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Reveal({ children, trigger }: { children: React.ReactNode; trigger: React.RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, ease: "power2.out", scrollTrigger: { trigger: trigger.current, start: "top 60%", end: "top 5%", scrub: 0.8 } },
    );
  });
  return (
    <p ref={ref} className="section-body">
      {children}
    </p>
  );
}

function Hero({ sec }: { sec: SectionConfig }) {
  const loaded = useForge((s) => s.loaded);
  const wrap = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!wrap.current) return;
      gsap.to(wrap.current, {
        opacity: 0,
        scale: 0.92,
        y: -60,
        filter: "blur(10px)",
        ease: "none",
        scrollTrigger: { trigger: document.documentElement, start: "top top", end: () => `+=${window.innerHeight * 0.7}`, scrub: true },
      });
    },
    { scope: wrap },
  );
  return (
    <div ref={wrap} className="flex h-full w-full flex-col items-center justify-center text-center">
      <motion.p
        className="eyebrow"
        initial={{ opacity: 0, y: 20 }}
        animate={loaded ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {sec.eyebrow}
      </motion.p>
      <SplitHeading as="h1" text={sec.title} className="hero-title" mode="load" play={loaded} />
      <motion.p
        className="section-body mx-auto max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={loaded ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {sec.body}
      </motion.p>
      <motion.div
        className="scroll-hint"
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ delay: 1.8, duration: 1 }}
      >
        <span>Scroll</span>
        <i />
      </motion.div>
    </div>
  );
}

function Stats({ trigger }: { trigger: React.RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const stats = [
    { v: 52, s: "", l: "Components" },
    { v: 60, s: "h", l: "Battery" },
    { v: 248, s: "g", l: "Weight" },
  ];
  useGSAP(() => {
    if (!ref.current) return;
    ref.current.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const end = Number(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end,
        ease: "power2.out",
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        scrollTrigger: { trigger: trigger.current, start: "top 40%", end: "top -60%", scrub: 0.6 },
      });
    });
  });
  return (
    <div ref={ref} className="mt-8 grid grid-cols-3 gap-6">
      {stats.map((s) => (
        <div key={s.l}>
          <p className="stat-value">
            <span data-count={s.v}>0</span>
            {s.s}
          </p>
          <p className="stat-label">{s.l}</p>
        </div>
      ))}
    </div>
  );
}

function Swatches() {
  const colorIndex = useForge((s) => s.colorIndex);
  const cws = siteConfig.colorways;
  const cw = cws[colorIndex];
  const n = cws.length;
  const pick = (i: number) => {
    // jump to the scroll position that shows this colourway, so scroll and clicks agree
    const s = sectionStart("configure") + ((i + 0.5) / n) * (sectionLength("configure") - 1);
    scrollToS(s, 1.2);
  };
  return (
    <div className="mt-8">
      <motion.p key={cw.id} className="colorway-name" initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.5 }} style={{ color: cw.accent }}>
        {cw.name}
      </motion.p>
      <div className="mt-4 flex gap-3 md:justify-end">
        {cws.map((c, i) => (
          <button
            key={c.id}
            onClick={() => pick(i)}
            aria-label={c.name}
            data-cursor-hover
            className={`swatch ${i === colorIndex ? "swatch-active" : ""}`}
            style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`, boxShadow: i === colorIndex ? `0 0 24px ${c.accent}` : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

function CheckoutCard() {
  const colorIndex = useForge((s) => s.colorIndex);
  const addToCart = useForge((s) => s.addToCart);
  const setCartOpen = useForge((s) => s.setCartOpen);
  const cw = siteConfig.colorways[colorIndex];
  const p = siteConfig.product;
  return (
    <div className="panel flex flex-col items-center gap-4">
      <p className="text-sm uppercase tracking-[0.3em] text-white/60">
        {p.name} · <span style={{ color: cw.accent }}>{cw.name}</span>
      </p>
      <p className="price leading-none">{formatPrice(p.price)}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          data-cursor-hover
          className="cta"
          style={{ background: cw.accent, boxShadow: `0 0 60px ${cw.accent}88` }}
          onClick={() => addToCart({ id: `${siteConfig.product.name}-${cw.id}`, name: `${p.name} — ${cw.name}`, price: p.price, colorway: cw.id })}
        >
          Add to cart
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} data-cursor-hover className="cta-ghost" onClick={() => setCartOpen(true)}>
          View cart
        </motion.button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 flex flex-col items-center gap-2 border-t border-white/10 bg-black/40 px-6 py-10 text-center text-xs text-white/50 backdrop-blur-md">
      <p className="tracking-[0.4em] text-white/80">{siteConfig.brand.name}</p>
      <p>{siteConfig.brand.tagline}</p>
    </footer>
  );
}
