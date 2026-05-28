"use client";

import { ElementType, ReactNode } from "react";
import { useParallax, ParallaxOptions } from "@/hooks/animations/useParallax";
import { cn } from "@/lib/utils";

interface ParallaxSectionProps extends ParallaxOptions {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function ParallaxSection({
  as: Tag = "div",
  className,
  children,
  ...options
}: ParallaxSectionProps) {
  const ref = useParallax<HTMLElement>(options);
  return (
    <Tag ref={ref} className={cn(className)} style={{ willChange: "transform" }}>
      {children}
    </Tag>
  );
}
