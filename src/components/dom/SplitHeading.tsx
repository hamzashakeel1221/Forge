"use client";

import { useRef } from "react";
import SplitType from "split-type";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  /** Element that triggers the reveal; defaults to the heading itself */
  trigger?: React.RefObject<HTMLElement | null>;
  /** "scroll" scrubs with scroll, "load" plays once (for the hero) */
  mode?: "scroll" | "load";
  play?: boolean;
};

/** Heading split into characters with SplitType, revealed by GSAP with a 3D flip. */
export function SplitHeading({ text, as: Tag = "h2", className, trigger, mode = "scroll", play = true }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const split = new SplitType(ref.current, { types: "words,chars" });
      const chars = split.chars ?? [];
      gsap.set(ref.current, { perspective: 600 });
      if (mode === "load") {
        if (!play) {
          gsap.set(chars, { yPercent: 120, rotateX: -90, opacity: 0 });
          return () => split.revert();
        }
        gsap.fromTo(
          chars,
          { yPercent: 120, rotateX: -90, opacity: 0 },
          { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.4, ease: "expo.out", stagger: 0.045, delay: 0.25 },
        );
      } else {
        gsap.fromTo(
          chars,
          { yPercent: 120, rotateX: -90, opacity: 0, transformOrigin: "50% 100%" },
          {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            ease: "power3.out",
            stagger: 0.03,
            scrollTrigger: { trigger: trigger?.current ?? ref.current, start: "top 85%", end: "top 25%", scrub: 0.8 },
          },
        );
      }
      return () => split.revert();
    },
    { dependencies: [text, mode, play], scope: ref },
  );

  return (
    <Tag ref={ref} className={className} style={{ fontKerning: "none" }}>
      {text}
    </Tag>
  );
}
