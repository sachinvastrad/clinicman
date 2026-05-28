"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import * as Icons from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap/setup";
import { Magnetic } from "@/components/motion/Magnetic";
import { CountUp } from "@/components/motion/CountUp";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: number;
  note: string;
  icon: string;
  href: string;
  warn?: boolean;
  /** 0-based index for stagger delay. */
  index?: number;
}

export function KpiCard({
  label,
  value,
  note,
  icon,
  href,
  warn,
  index = 0,
}: KpiCardProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.set(el, { autoAlpha: 0, y: 24, willChange: "transform, opacity" });
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: () => {
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            delay: index * 0.06,
            ease: "power3.out",
            onComplete: () => gsap.set(el, { clearProps: "willChange" }),
          });
        },
      });
    }, el);

    return () => ctx.revert();
  }, [index]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage offset from center (-1 to 1)
    const tiltX = (y - rect.height / 2) / (rect.height / 2);
    const tiltY = (x - rect.width / 2) / (rect.width / 2);

    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--tilt-x", `${tiltX * 6}deg`); // Max 6deg tilt
    el.style.setProperty("--tilt-y", `${tiltY * -6}deg`); // Max -6deg tilt
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;

    el.style.setProperty("--mx", `-200px`);
    el.style.setProperty("--my", `-200px`);
    el.style.setProperty("--tilt-x", `0deg`);
    el.style.setProperty("--tilt-y", `0deg`);
  };

  return (
    <Magnetic strength={0.15} className="block h-full">
      <Link
        ref={ref}
        href={href}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "group relative block h-full overflow-hidden rounded-xl",
          "bg-card border border-border",
          "shadow-sm hover:shadow-lg",
          "transition-[box-shadow,border-color,background-color] duration-slow ease-out",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:shadow-focus-strong"
        )}
        style={{
          transform: "perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) scale3d(1.01, 1.01, 1.01)",
          transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease-out, border-color 0.2s ease-out",
          willChange: "transform",
        }}
      >
        {/* Dynamic spot gradient tracking inside the card bounds */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
          style={{
            background: `radial-gradient(circle 160px at var(--mx, -200px) var(--my, -200px), ${
              warn ? "hsl(var(--warning) / 0.15)" : "hsl(var(--primary) / 0.15)"
            } 0%, transparent 80%)`,
          }}
        />

        {/* Aurora gradient that swells in on hover */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-14 -right-14 h-48 w-48 rounded-pill blur-3xl",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-slower ease-out",
            warn ? "bg-warning/40" : "bg-primary/45"
          )}
        />
        {/* Secondary cyan accent on bottom-left */}
        {!warn && (
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-pill blur-3xl bg-accent-cyan/20 opacity-0 group-hover:opacity-60 transition-opacity duration-slower ease-out"
          />
        )}

        <div className="relative p-5 flex flex-col gap-5 h-full">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "relative h-10 w-10 rounded-lg flex items-center justify-center",
                "transition-transform duration-slow ease-spring",
                "group-hover:scale-105 group-hover:-rotate-3",
                warn
                  ? "bg-warning-soft text-warning"
                  : "bg-primary-soft text-primary-soft-foreground"
              )}
            >
              {(() => {
                const IconComponent = (Icons as any)[icon] || Icons.FileText;
                return <IconComponent className="w-[18px] h-[18px]" strokeWidth={2.2} />;
              })()}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-slow",
                  warn ? "ring-1 ring-warning/30" : "ring-1 ring-primary/30"
                )}
              />
            </div>
            <ArrowUpRight
              className={cn(
                "w-4 h-4 text-muted-foreground-2",
                "translate-x-[-4px] translate-y-[4px] opacity-0",
                "group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100",
                "transition-all duration-slow ease-emphasized"
              )}
            />
          </div>

          <div>
            <p className="text-4xl font-semibold tracking-tight tabular leading-none">
              <CountUp value={value} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
          </div>

          <div className="mt-auto pt-3 border-t border-border-subtle">
            <Badge
              tone={warn ? "warning" : "neutral"}
              dot
              className="border-0 bg-transparent px-0"
            >
              {note}
            </Badge>
          </div>
        </div>
      </Link>
    </Magnetic>
  );
}
