"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap/setup";

export type TimelineBuilder = (args: {
  tl: gsap.core.Timeline;
  el: HTMLElement;
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
}) => void;

export interface ScrollTimelineOptions {
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
  anticipatePin?: number;
}

export function useScrollTriggerTimeline<T extends HTMLElement = HTMLDivElement>(
  build: TimelineBuilder,
  options: ScrollTimelineOptions = {},
  deps: React.DependencyList = [],
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: options.start ?? "top top",
          end: options.end ?? "+=100%",
          scrub: options.scrub ?? 1,
          pin: options.pin ?? false,
          anticipatePin: options.anticipatePin ?? 1,
          markers: options.markers ?? false,
        },
      });
      build({ tl, el, gsap, ScrollTrigger });
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
