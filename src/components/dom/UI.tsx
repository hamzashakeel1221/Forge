"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { siteConfig } from "@/config/site.config";
import { colorwayById, formatPrice, useForge } from "@/lib/store";
import { sectionRanges } from "@/lib/scroll";
import { scrollToS } from "./SmoothScroll";

const ease = [0.16, 1, 0.3, 1] as const;

export function Nav() {
  const cart = useForge((s) => s.cart);
  const setCartOpen = useForge((s) => s.setCartOpen);
  const active = useForge((s) => s.activeSection);
  const loaded = useForge((s) => s.loaded);
  const count = cart.reduce((a, c) => a + c.qty, 0);
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={loaded ? { y: 0, opacity: 1 } : {}}
      transition={{ delay: 0.6, duration: 1, ease }}
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-10"
    >
      <button onClick={() => scrollToS(0, 2.5)} className="logo" data-cursor-hover>
        {siteConfig.brand.name}
      </button>
      <nav className="hidden items-center gap-1 md:flex">
        {siteConfig.sections.map((s, i) => (
          <button
            key={s.id}
            data-cursor-hover
            onClick={() => scrollToS(sectionRanges[i].start + (i === 0 ? 0 : 0.35), 2)}
            className={`nav-link ${active === s.id ? "nav-link-active" : ""}`}
          >
            {s.eyebrow.split("/").pop()?.trim()}
          </button>
        ))}
      </nav>
      <button onClick={() => setCartOpen(true)} className="cart-btn" data-cursor-hover>
        Cart
        <motion.span key={count} initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 12 }} className="cart-count">
          {count}
        </motion.span>
      </button>
      <div className="progress-bar" />
    </motion.header>
  );
}

export function CartDrawer() {
  const open = useForge((s) => s.cartOpen);
  const setOpen = useForge((s) => s.setCartOpen);
  const cart = useForge((s) => s.cart);
  const remove = useForge((s) => s.removeFromCart);
  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b0b12]/90 p-8 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease }}
            data-lenis-prevent
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold tracking-tight">Your cart</h3>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white" data-cursor-hover>
                Close
              </button>
            </div>
            <div className="mt-8 flex-1 space-y-3 overflow-y-auto">
              {cart.length === 0 && <p className="text-white/50">Nothing here yet. Click a product in the collection to add it.</p>}
              <AnimatePresence initial={false}>
                {cart.map((c) => {
                  const cw = colorwayById(c.colorway);
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <span className="h-12 w-12 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${cw.primary}, ${cw.accent})` }} />
                      <div className="flex-1">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-white/50">
                          {c.qty} × {formatPrice(c.price)}
                        </p>
                      </div>
                      <button onClick={() => remove(c.id)} className="text-sm text-white/40 hover:text-white" data-cursor-hover>
                        Remove
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="border-t border-white/10 pt-6">
              <div className="flex justify-between text-lg">
                <span>Total</span>
                <span className="font-semibold">{formatPrice(total)}</span>
              </div>
              <button className="cta mt-6 w-full" style={{ background: "#ffffff", color: "#000" }} data-cursor-hover>
                Checkout
              </button>
              <p className="mt-3 text-center text-xs text-white/40">Demo store: hook this button to Shopify, Stripe or your backend.</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const last = useForge((s) => s.lastAdded);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!last) return;
    setShow(true);
    const id = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(id);
  }, [last]);
  return (
    <AnimatePresence>
      {show && last && (
        <motion.div
          key={last.t}
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.5, ease }}
          className="toast"
        >
          Added <strong>{last.name}</strong>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.documentElement.classList.add("has-cursor");
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { ...pos };
    let raf = 0;
    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const t = e.target as HTMLElement;
      const hover = !!t.closest?.("button, a, [data-cursor-hover]") || document.body.dataset.cursor === "add";
      ring.current?.classList.toggle("cursor-hover", hover);
    };
    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.16;
      ringPos.y += (pos.y - ringPos.y) * 0.16;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      if (document.body.dataset.cursor === "add") ring.current?.classList.add("cursor-hover");
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);
  return (
    <>
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </>
  );
}

export function Loader() {
  const loaded = useForge((s) => s.loaded);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const t = (performance.now() - start) / 1000;
      setPct((p) => (loaded ? Math.min(100, p + 9) : Math.min(90, Math.max(p, 90 * (1 - Math.exp(-t * 1.6))))));
    }, 40);
    return () => clearInterval(id);
  }, [loaded]);
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => setDone(true), 650);
    return () => clearTimeout(id);
  }, [loaded]);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="loader" exit={{ clipPath: "inset(0 0 100% 0)" }} transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}>
          <p className="loader-brand">{siteConfig.brand.name}</p>
          <div className="loader-bar">
            <span style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
          <p className="loader-pct">{Math.round(pct)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
