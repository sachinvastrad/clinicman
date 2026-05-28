"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap/setup";

interface SmoothScrollProviderProps {
  children: React.ReactNode;
  /** Force-disable smooth scrolling (e.g. for print pages). */
  disabled?: boolean;
}

const DISABLED_PREFIXES = ["/print"];

export function SmoothScrollProvider({ children, disabled }: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const isPrintRoute = DISABLED_PREFIXES.some((p) => pathname?.startsWith(p));
    if (isPrintRoute) return;

    let lenisInstance: Lenis | null = null;
    let timerId = 0;

    const initializeScroll = () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }

      // Check if we are on a dashboard-like path which uses nested scrolling viewports
      const isDashboardPath = pathname !== "/" && !pathname?.startsWith("/login");
      let scrollContainer: HTMLElement | Window = window;

      if (isDashboardPath) {
        // Query the scrollable canvas viewport inside the dashboard
        const el = document.querySelector(".overflow-y-auto") as HTMLElement;
        if (el) {
          scrollContainer = el;
        }
      }

      const isWindow = scrollContainer === window;

      const lenis = new Lenis({
        wrapper: isWindow ? undefined : (scrollContainer as HTMLElement),
        content: isWindow ? undefined : ((scrollContainer as HTMLElement).firstElementChild as HTMLElement) || undefined,
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.05,
        touchMultiplier: 1.25,
        lerp: 0.08,
      });

      lenisInstance = lenis;
      lenisRef.current = lenis;

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const onRefresh = () => lenis.resize();
      ScrollTrigger.addEventListener("refresh", onRefresh);
      ScrollTrigger.refresh();
    };

    // Delay initialization slightly to let Next.js finish DOM mounts and hydration
    timerId = window.setTimeout(initializeScroll, 120);

    return () => {
      window.clearTimeout(timerId);
      if (lenisInstance) {
        ScrollTrigger.removeEventListener("refresh", () => lenisInstance?.resize());
        gsap.ticker.remove((time: number) => lenisInstance?.raf(time * 1000));
        lenisInstance.destroy();
        lenisRef.current = null;
      }
    };
  }, [pathname, disabled]);

  return <>{children}</>;
}
