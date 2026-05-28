"use client";

import { ElementType, ReactNode } from "react";
import {
  useSplitTextAnimation,
  SplitTextAnimationOptions,
} from "@/hooks/animations/useSplitTextAnimation";
import { cn } from "@/lib/utils";

interface AnimatedTextProps extends SplitTextAnimationOptions {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function AnimatedText({
  as: Tag = "h2",
  className,
  children,
  ...options
}: AnimatedTextProps) {
  const ref = useSplitTextAnimation<HTMLElement>(options);
  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
