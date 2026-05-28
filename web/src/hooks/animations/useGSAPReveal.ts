"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap/setup";
import { DUR, EASE, REVEAL_OFFSET } from "@/lib/gsap/constants";

export interface GSAPRevealOptions {
  y?: number;
  opacity?: number;
  scale?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  delay?: number;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  once?: boolean;
  stagger?: number;
  childSelector?: string;
}

export function useGSAPReveal<T extends HTMLElement = HTMLDivElement>(
  options: GSAPRevealOptions = {},
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      const targets = options.childSelector
        ? gsap.utils.toArray<HTMLElement>(options.childSelector, el)
        : [el];
      if (!targets.length) return;

      gsap.set(targets, {
        autoAlpha: options.opacity ?? 0,
        y: options.y ?? REVEAL_OFFSET,
        scale: options.scale ?? 1,
        filter: options.blur ? `blur(${options.blur}px)` : "none",
        willChange: "transform, opacity",
      });

      gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: options.duration ?? DUR.slow,
        ease: options.ease ?? EASE.out,
        delay: options.delay ?? 0,
        stagger: options.stagger ?? 0,
        scrollTrigger: {
          trigger: el,
          start: options.start ?? "top 85%",
          end: options.end ?? "bottom 60%",
          scrub: options.scrub ?? false,
          toggleActions: options.once === false
            ? "play reverse play reverse"
            : "play none none none",
          once: options.once ?? true,
        },
        onComplete: () => gsap.set(targets, { clearProps: "willChange" }),
      });
    }, el);

    return () => ctx.revert();
  }, [
    options.y, options.opacity, options.scale, options.blur,
    options.duration, options.ease, options.delay,
    options.start, options.end, options.scrub, options.once,
    options.stagger, options.childSelector,
  ]);

  return ref;
}
