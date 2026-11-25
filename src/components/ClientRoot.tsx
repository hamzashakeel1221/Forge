"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { htmlLayer } from "@/lib/htmlLayer";
import { Leva } from "leva";
import { SmoothScroll } from "./dom/SmoothScroll";
import { Sections } from "./dom/Sections";
import { CartDrawer, Cursor, Loader, Nav, Toast } from "./dom/UI";

// WebGL only runs in the browser
const Experience = dynamic(() => import("./canvas/Experience"), { ssr: false });

export default function ClientRoot() {
  const [debug, setDebug] = useState(false);
  useEffect(() => setDebug(new URLSearchParams(window.location.search).has("debug")), []);
  return (
    <>
      <Leva hidden={!debug} collapsed />
      <div
        ref={(el) => {
          if (el) htmlLayer.current = el;
        }}
        className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      />
      <Loader />
      <Experience />
      <SmoothScroll />
      <Nav />
      <Sections />
      <CartDrawer />
      <Toast />
      <Cursor />
    </>
  );
}
