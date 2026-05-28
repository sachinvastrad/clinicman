export const EASE = {
  out:    "power3.out",
  inOut:  "power2.inOut",
  expo:   "expo.out",
  apple:  "cubic-bezier(0.2, 0.8, 0.2, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const DUR = {
  fast:   0.32,
  base:   0.6,
  slow:   0.9,
  hero:   1.2,
} as const;

export const STAGGER = {
  tight:  0.04,
  base:   0.06,
  loose:  0.1,
} as const;

export const REVEAL_OFFSET = 32;
