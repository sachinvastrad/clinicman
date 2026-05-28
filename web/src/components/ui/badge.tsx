import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-xs font-medium border",
  {
    variants: {
      tone: {
        neutral: "bg-secondary text-secondary-foreground border-border",
        brand: "bg-primary-soft text-primary-soft-foreground border-primary/15",
        success: "bg-success-soft text-success border-success/15",
        warning: "bg-warning-soft text-warning border-warning/20",
        danger: "bg-danger-soft text-danger border-danger/15",
        info: "bg-info-soft text-info border-info/15",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-pill bg-current opacity-80" />}
      {children}
    </span>
  );
}
