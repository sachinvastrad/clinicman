"use client";

import { useLayoutEffect, useRef } from "react";

interface AtmosphericShellProps {
  children: React.ReactNode;
}

/**
 * AtmosphericShell intercepts mouse coordinates and updates CSS custom properties
 * inline using throttled requestAnimationFrame calls, driving hardware-accelerated
 * radial background ambient spotlights across the dashboard.
 */
export function AtmosphericShell({ children }: AtmosphericShellProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    const onMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--cursor-x", `${x}px`);
        el.style.setProperty("--cursor-y", `${y}px`);
      });
    };

    el.addEventListener("mousemove", onMouseMove);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main ref={ref} className="flex-1 flex flex-col overflow-hidden bg-atmospheric bg-grain relative">
      {children}
    </main>
  );
}
