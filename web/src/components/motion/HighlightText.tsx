"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap/setup";
import { cn } from "@/lib/utils";

interface HighlightTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  start?: string;
}

/**
 * Animated underline highlight. The `<mark>` tag gets a soft brand-tinted
 * stroke that draws in from left → right when it scrolls into view.
 * Composes well inside any heading or paragraph.
 */
export function HighlightText({
  children,
  className,
  delay = 0,
  start = "top 80%",
}: HighlightTextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.set(el, { ["--hl-scale" as string]: 0 });
      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        onEnter: () => {
          gsap.to(el, {
            duration: 0.72,
            ease: "cubic-bezier(0.05, 0.7, 0.1, 1.0)",
            delay,
            onUpdate: function () {
              el.style.setProperty("--hl-scale", String(this.progress()));
            },
            onComplete: () => el.setAttribute("data-active", "true"),
          });
        },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, start]);

  return (
    <span
      ref={ref}
      className={cn("hl-mark font-semibold text-foreground", className)}
    >
      {children}
    </span>
  );
}
