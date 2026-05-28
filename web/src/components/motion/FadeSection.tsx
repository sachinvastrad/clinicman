"use client";

import { ElementType, ReactNode } from "react";
import { useGSAPReveal, GSAPRevealOptions } from "@/hooks/animations/useGSAPReveal";
import { cn } from "@/lib/utils";

interface FadeSectionProps extends GSAPRevealOptions {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function FadeSection({
  as: Tag = "section",
  className,
  children,
  ...options
}: FadeSectionProps) {
  const ref = useGSAPReveal<HTMLElement>(options);
  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
