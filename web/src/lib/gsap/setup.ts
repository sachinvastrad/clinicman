"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({
    ease: "power3.out",
    duration: 0.9,
  });
  gsap.config({
    nullTargetWarn: false,
    autoSleep: 60,
  });
  ScrollTrigger.config({
    ignoreMobileResize: true,
    limitCallbacks: true,
  });
  registered = true;
}

export { gsap, ScrollTrigger, SplitText };
