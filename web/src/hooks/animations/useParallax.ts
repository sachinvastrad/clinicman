"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap/setup";

export interface ParallaxOptions {
  /** Total travel in viewport-relative percent (yPercent). */
  amount?: number;
  start?: string;
  end?: string;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {},
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const amount = options.amount ?? 12;

    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: options.start ?? "top bottom",
            end: options.end ?? "bottom top",
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [options.amount, options.start, options.end]);

  return ref;
}
