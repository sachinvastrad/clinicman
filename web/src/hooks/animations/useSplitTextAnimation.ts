"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap/setup";
import { DUR, EASE, STAGGER } from "@/lib/gsap/constants";

type SplitMode = "lines" | "words" | "chars" | "lines,words";
type RevealFlavor = "up" | "blur" | "mask" | "stagger";

export interface SplitTextAnimationOptions {
  split?: SplitMode;
  flavor?: RevealFlavor;
  start?: string;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
  once?: boolean;
}

export function useSplitTextAnimation<T extends HTMLElement = HTMLHeadingElement>(
  options: SplitTextAnimationOptions = {},
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const split = options.split ?? "lines";
    const flavor = options.flavor ?? "up";
    let splitter: SplitText | null = null;
    let st: ScrollTrigger | null = null;

    const build = () => {
      splitter?.revert();
      splitter = new SplitText(el, {
        type: split,
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        mask: flavor === "mask" ? "lines" : undefined,
      });

      const targets =
        split.includes("chars") ? splitter.chars :
        split.includes("words") ? splitter.words :
        splitter.lines;

      const from: gsap.TweenVars = (() => {
        switch (flavor) {
          case "blur":    return { autoAlpha: 0, filter: "blur(12px)", y: 20 };
          case "mask":    return { yPercent: 110 };
          case "stagger": return { autoAlpha: 0, y: 18 };
          default:        return { autoAlpha: 0, yPercent: 110 };
        }
      })();

      gsap.set(targets, { ...from, willChange: "transform, opacity" });

      const tween = gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        yPercent: 0,
        filter: "blur(0px)",
        duration: options.duration ?? DUR.slow,
        ease: options.ease ?? EASE.out,
        stagger: options.stagger ?? STAGGER.base,
        delay: options.delay ?? 0,
        scrollTrigger: {
          trigger: el,
          start: options.start ?? "top 85%",
          once: options.once ?? true,
        },
        onComplete: () => gsap.set(targets, { clearProps: "willChange" }),
      });
      st = tween.scrollTrigger ?? null;
    };

    const ctx = gsap.context(() => {
      if (document.fonts?.status === "loaded") build();
      else document.fonts?.ready.then(build);
    }, el);

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        st?.kill();
        build();
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(resizeRaf);
      splitter?.revert();
      ctx.revert();
    };
  }, [
    options.split, options.flavor, options.start, options.duration,
    options.stagger, options.delay, options.ease, options.once,
  ]);

  return ref;
}
