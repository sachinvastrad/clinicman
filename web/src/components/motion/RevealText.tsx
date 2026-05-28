"use client";

import { AnimatedText } from "./AnimatedText";
import type { ElementType, ReactNode } from "react";

interface RevealTextProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
}

export function RevealText({ as = "h2", className, children, delay }: RevealTextProps) {
  return (
    <AnimatedText
      as={as}
      className={className}
      split="lines"
      flavor="mask"
      delay={delay}
    >
      {children}
    </AnimatedText>
  );
}
