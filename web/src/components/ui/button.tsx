"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import * as Icons from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/motion/Magnetic";

const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium " +
    "transition-[background-color,box-shadow,transform,color,border-color] duration-fast ease-out " +
    "disabled:opacity-50 disabled:pointer-events-none " +
    "focus-visible:outline-none focus-visible:shadow-focus " +
    "active:scale-[0.98] select-none group relative overflow-hidden",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-border",
        ghost: "text-foreground hover:bg-secondary",
        outline:
          "border border-border bg-card hover:border-border-strong hover:bg-background-subtle text-foreground",
        soft: "bg-primary-soft text-primary-soft-foreground hover:bg-primary/15",
        danger: "bg-danger text-white hover:bg-danger/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-sm",
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-9 px-3.5 text-sm rounded-md",
        lg: "h-10 px-4 text-sm rounded-md",
        xl: "h-11 px-5 text-base rounded-lg",
        icon: "h-9 w-9 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
  loading?: boolean;
  magnetic?: boolean;
  leadingIcon?: React.ReactNode | string;
  trailingIcon?: React.ReactNode | string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild, loading, magnetic = false, leadingIcon, trailingIcon, children, disabled, onMouseMove, ...props },
    ref
  ) => {
    const localRef = React.useRef<HTMLButtonElement | null>(null);

    // Combine external ref with local ref
    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        localRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }
      },
      [ref]
    );

    const handleLocalMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = localRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--btn-x", `${x}px`);
      el.style.setProperty("--btn-y", `${y}px`);

      if (onMouseMove) onMouseMove(e);
    };

    const renderIcon = (iconNameOrNode: React.ReactNode | string) => {
      if (typeof iconNameOrNode === "string") {
        const IconComponent = (Icons as any)[iconNameOrNode];
        if (IconComponent) {
          return <IconComponent className="w-4 h-4" />;
        }
        return null;
      }
      return iconNameOrNode;
    };

    const inner = (
      <>
        {/* Dynamic coordinate tracked cursor spotlight glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
          style={{
            background: `radial-gradient(circle 80px at var(--btn-x, -200px) var(--btn-y, -200px), ${
              variant === "primary" ? "rgba(255,255,255,0.18)" : "hsl(var(--primary) / 0.12)"
            } 0%, transparent 80%)`,
          }}
        />
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : renderIcon(leadingIcon)}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        {renderIcon(trailingIcon)}
      </>
    );

    const renderButton = () => {
      if (asChild && React.isValidElement(children)) {
        const child = children as React.ReactElement<{ children?: React.ReactNode; className?: string }>;
        return (
          <Slot ref={setRefs} className={cn(button({ variant, size }), className)} {...props}>
            {React.cloneElement(
              child,
              undefined,
              <>
                {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : renderIcon(leadingIcon)}
                <span className="relative z-10 flex items-center gap-2">{child.props.children}</span>
                {renderIcon(trailingIcon)}
              </>
            )}
          </Slot>
        );
      }

      return (
        <button
          ref={setRefs}
          onMouseMove={handleLocalMouseMove}
          className={cn(button({ variant, size }), className)}
          disabled={disabled || loading}
          {...props}
        >
          {inner}
        </button>
      );
    };

    if (magnetic && !disabled && !loading) {
      return (
        <Magnetic strength={0.16} className="inline-block">
          {renderButton()}
        </Magnetic>
      );
    }

    return renderButton();
  }
);
Button.displayName = "Button";

export { button as buttonVariants };
