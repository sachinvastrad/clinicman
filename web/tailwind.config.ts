import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong":   "hsl(var(--border-strong))",
        "border-subtle":   "hsl(var(--border-subtle))",
        "border-hairline": "hsl(var(--border-hairline))",
        input: "hsl(var(--input))",
        ring:  "hsl(var(--ring))",
        background:           "hsl(var(--background))",
        "background-subtle":  "hsl(var(--background-subtle))",
        "background-mesh-1":  "hsl(var(--background-mesh-1))",
        "background-mesh-2":  "hsl(var(--background-mesh-2))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:           "hsl(var(--primary))",
          hover:             "hsl(var(--primary-hover))",
          active:            "hsl(var(--primary-active))",
          soft:              "hsl(var(--primary-soft))",
          "soft-foreground": "hsl(var(--primary-soft-fg))",
          foreground:        "hsl(var(--primary-foreground))",
          glow:              "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          hover:      "hsl(var(--secondary-hover))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:        "hsl(var(--muted))",
          foreground:     "hsl(var(--muted-foreground))",
          "foreground-2": "hsl(var(--muted-foreground-2))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          muted:      "hsl(var(--card-muted))",
          elevated:   "hsl(var(--card-elevated))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        "accent-cyan": {
          DEFAULT:           "hsl(var(--accent-cyan))",
          soft:              "hsl(var(--accent-cyan-soft))",
          "soft-foreground": "hsl(var(--accent-cyan-soft-fg))",
        },
        success: { DEFAULT: "hsl(var(--success))", soft: "hsl(var(--success-soft))" },
        warning: { DEFAULT: "hsl(var(--warning))", soft: "hsl(var(--warning-soft))" },
        danger:  { DEFAULT: "hsl(var(--danger))",  soft: "hsl(var(--danger-soft))" },
        info:    { DEFAULT: "hsl(var(--info))",    soft: "hsl(var(--info-soft))" },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar))",
          foreground:           "hsl(var(--sidebar-foreground))",
          muted:                "hsl(var(--sidebar-muted))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
        },
      },
      borderRadius: {
        xs:    "var(--radius-xs)",
        sm:    "var(--radius-sm)",
        md:    "var(--radius-md)",
        lg:    "var(--radius-lg)",
        xl:    "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        pill:  "var(--radius-pill)",
      },
      boxShadow: {
        xs:             "var(--shadow-xs)",
        sm:             "var(--shadow-sm)",
        md:             "var(--shadow-md)",
        lg:             "var(--shadow-lg)",
        xl:             "var(--shadow-xl)",
        focus:          "var(--shadow-focus)",
        "focus-strong": "var(--shadow-focus-strong)",
        "glow-primary": "var(--shadow-glow-primary)",
      },
      fontSize: {
        // 4px line-height grid, tightening tracking as size grows
        xs:    ["12px", { lineHeight: "16px", letterSpacing: "-0.005em" }],
        sm:    ["13px", { lineHeight: "20px", letterSpacing: "-0.005em" }],
        base:  ["14px", { lineHeight: "20px", letterSpacing: "-0.005em" }],
        md:    ["15px", { lineHeight: "24px", letterSpacing: "-0.01em" }],
        lg:    ["17px", { lineHeight: "24px", letterSpacing: "-0.015em" }],
        xl:    ["20px", { lineHeight: "28px", letterSpacing: "-0.018em" }],
        "2xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em" }],
        "3xl": ["30px", { lineHeight: "36px", letterSpacing: "-0.022em" }],
        "4xl": ["36px", { lineHeight: "40px", letterSpacing: "-0.025em" }],
        "5xl": ["44px", { lineHeight: "48px", letterSpacing: "-0.028em" }],
        "6xl": ["56px", { lineHeight: "60px", letterSpacing: "-0.032em" }],
      },
      spacing: {
        // 4 / 8 grid extensions used by hero spacing
        "4.5": "18px",
        "13":  "52px",
        "15":  "60px",
        "18":  "72px",
        "22":  "88px",
      },
      transitionTimingFunction: {
        out:         "var(--ease-out)",
        smooth:      "var(--ease-in-out)",
        spring:      "var(--ease-spring)",
        emphasized:  "var(--ease-emphasized)",
      },
      transitionDuration: {
        fast:    "120ms",
        DEFAULT: "200ms",
        slow:    "320ms",
        slower:  "480ms",
        slowest: "720ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to:   { backgroundPosition: "-200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.98)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(0.8)", opacity: "0.55" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "mark-in": {
          "0%":   { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0% 0 0)" },
        },
        "caret-blink": { "50%": { opacity: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s var(--ease-out)",
        "accordion-up":   "accordion-up 0.2s var(--ease-out)",
        shimmer:          "shimmer 1.4s linear infinite",
        "fade-in":        "fade-in 200ms var(--ease-out)",
        "scale-in":       "scale-in 200ms var(--ease-out)",
        "gradient-shift": "gradient-shift 6s ease-in-out infinite",
        "pulse-ring":     "pulse-ring 2.4s var(--ease-out) infinite",
        "mark-in":        "mark-in 720ms var(--ease-emphasized) forwards",
        "caret-blink":    "caret-blink 1.1s steps(2) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
