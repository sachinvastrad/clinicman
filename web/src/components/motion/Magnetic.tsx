"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap/setup";
import { cn } from "@/lib/utils";

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** Higher = stronger magnetic pull. Default 0.35. */
  strength?: number;
  /** Disable on touch devices automatically (default true). */
  desktopOnly?: boolean;
  as?: "div" | "span";
}

/**
 * Subtle magnetic-hover wrapper used for cards / CTAs.
 * Element drifts toward the cursor and snaps back smoothly on leave.
 * Respects `prefers-reduced-motion`.
 */
export function Magnetic({
  children,
  className,
  strength = 0.35,
  desktopOnly = true,
  as: Tag = "div",
}: MagneticProps) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (prefersReduced || (desktopOnly && isTouch)) return;

    const el = ref.current;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.6,
        ease: "power3.out",
      });
    };
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength, desktopOnly]);

  const Component = Tag as unknown as React.ComponentType<
    React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
  >;

  return (
    <Component
      ref={ref as React.Ref<HTMLElement>}
      className={cn("will-change-transform", className)}
    >
      {children}
    </Component>
  );
}
