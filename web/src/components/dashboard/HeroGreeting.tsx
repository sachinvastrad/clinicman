"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap/setup";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { HighlightText } from "@/components/motion/HighlightText";

interface HeroGreetingProps {
  firstName: string;
  todayLabel: string;
  todayAppointments: number;
  pendingFollowups: number;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function HeroGreeting({
  firstName,
  todayLabel,
  todayAppointments,
  pendingFollowups,
}: HeroGreetingProps) {
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);

  useLayoutEffect(() => {
    if (!eyebrowRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(eyebrowRef.current, {
        opacity: 0,
        y: 8,
        duration: 0.6,
        ease: "power3.out",
      });
    }, eyebrowRef);
    return () => ctx.revert();
  }, []);

  const hasAppointments = todayAppointments > 0;
  const hasOverdue = pendingFollowups > 0;

  return (
    <div className="max-w-2xl">
      <p
        ref={eyebrowRef}
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-[0.12em]"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-pill bg-primary/40 animate-pulse-ring" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-pill bg-primary" />
        </span>
        {todayLabel}
      </p>

      <AnimatedText
        as="h2"
        split="words"
        flavor="mask"
        className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]"
      >
        Good {greeting()}, {firstName}.
      </AnimatedText>

      <p className="mt-4 text-md text-muted-foreground leading-relaxed">
        {hasAppointments ? (
          <>
            You have{" "}
            <HighlightText delay={0.4}>
              {todayAppointments} appointment{todayAppointments === 1 ? "" : "s"}
            </HighlightText>{" "}
            today
            {hasOverdue && (
              <>
                {" "}and{" "}
                <HighlightText delay={0.7} className="text-warning">
                  {pendingFollowups} overdue follow-up
                  {pendingFollowups === 1 ? "" : "s"}
                </HighlightText>
              </>
            )}
            .
          </>
        ) : (
          <>No appointments scheduled today — a good moment to catch up on case notes.</>
        )}
      </p>
    </div>
  );
}
