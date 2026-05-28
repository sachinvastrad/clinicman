"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, success, id, placeholder = " ", ...props }, ref) => {
    const uniqueId = React.useId();
    const inputId = id || uniqueId;

    return (
      <div className="relative w-full group flex flex-col gap-1.5">
        <div className="relative flex items-center">
          <input
            type={type}
            id={inputId}
            ref={ref}
            placeholder={placeholder}
            className={cn(
              "peer w-full h-11 px-3.5 pt-4 pb-1 text-sm rounded-lg bg-background-subtle border border-border text-foreground placeholder:text-transparent",
              "transition-[border-color,box-shadow,background-color] duration-fast outline-none",
              "hover:border-border-strong",
              "focus-visible:border-primary/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20",
              error && "border-danger focus-visible:border-danger focus-visible:ring-danger/20",
              success && "border-success focus-visible:border-success focus-visible:ring-success/20",
              className
            )}
            {...props}
          />
          {/* Animated Floating Label */}
          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground-2 select-none pointer-events-none origin-[0_0]",
              "transition-all duration-fast ease-out",
              "peer-focus:-translate-y-[130%] peer-focus:scale-[0.82] peer-focus:text-primary",
              "peer-[:not(:placeholder-shown)]:-translate-y-[130%] peer-[:not(:placeholder-shown)]:scale-[0.82]",
              error && "peer-focus:text-danger",
              success && "peer-focus:text-success"
            )}
          >
            {label}
          </label>

          {/* Spotlight background outline */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-lg pointer-events-none border border-transparent peer-focus:border-primary/30 scale-100 peer-focus:scale-[1.01] transition-all duration-fast opacity-0 peer-focus:opacity-100"
          />
        </div>

        {/* Supporting states alerts */}
        {error && (
          <p className="text-[11px] font-medium text-danger flex items-center gap-1 leading-none pl-1 animate-in fade-in slide-in-from-top-1">
            <span className="inline-block w-1 h-1 rounded-pill bg-danger" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
