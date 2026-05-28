"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap/setup";
import { cn } from "@/lib/utils";

interface Action {
  href: string;
  label: string;
  description: string;
  icon: string;
}

interface QuickActionsProps {
  actions: Action[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-quick-item]", gridRef.current!);
      if (!items.length) return;
      gsap.set(items, { autoAlpha: 0, y: 16, willChange: "transform, opacity" });
      ScrollTrigger.create({
        trigger: gridRef.current,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(items, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
            onComplete: () => gsap.set(items, { clearProps: "willChange" }),
          });
        },
      });
    }, gridRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          data-quick-item
          className={cn(
            "group relative overflow-hidden rounded-lg border border-border bg-card",
            "px-4 py-3.5 flex items-center gap-3",
            "shadow-xs hover:shadow-md hover:border-border-strong",
            "transition-[box-shadow,border-color,transform] duration-slow ease-out",
            "hover:-translate-y-0.5",
            "focus-visible:outline-none focus-visible:shadow-focus"
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-primary scale-y-0 origin-top group-hover:scale-y-100 transition-transform duration-slow ease-out"
          />
          <span
            className={cn(
              "h-9 w-9 rounded-md bg-secondary text-muted-foreground",
              "flex items-center justify-center shrink-0",
              "transition-colors duration-slow",
              "group-hover:bg-primary-soft group-hover:text-primary-soft-foreground"
            )}
          >
            {(() => {
              const IconComponent = (Icons as any)[action.icon] || Icons.FileText;
              return <IconComponent className="w-4 h-4" />;
            })()}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-foreground truncate">
              {action.label}
            </span>
            <span className="block text-xs text-muted-foreground truncate">
              {action.description}
            </span>
          </span>
          <ArrowRight
            className={cn(
              "w-4 h-4 text-muted-foreground-2 shrink-0",
              "-translate-x-1 opacity-0",
              "group-hover:translate-x-0 group-hover:opacity-100",
              "transition-all duration-slow ease-emphasized"
            )}
          />
        </Link>
      ))}
    </div>
  );
}
