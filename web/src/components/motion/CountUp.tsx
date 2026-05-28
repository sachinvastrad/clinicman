"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap/setup";
import { cn } from "@/lib/utils";

interface CountUpProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  format?: (n: number) => string;
  /** Trigger when element enters viewport (default true). */
  scroll?: boolean;
}

/**
 * Counts from 0 → `value` on mount or when scrolled into view.
 * Uses tabular-nums to prevent width jitter during the tween.
 */
export function CountUp({
  value,
  duration = 1.2,
  delay = 0,
  className,
  format = (n) => Math.round(n).toLocaleString(),
  scroll = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obj = { v: 0 };

    const run = () => {
      gsap.to(obj, {
        v: value,
        duration,
        delay,
        ease: "power3.out",
        onUpdate: () => { el.textContent = format(obj.v); },
      });
    };

    if (!scroll) {
      run();
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: run,
      });
    }, el);

    return () => ctx.revert();
  }, [value, duration, delay, format, scroll]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      0
    </span>
  );
}
