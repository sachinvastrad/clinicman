# Implementation Plan — Cinematic UI & Deep Interaction Upgrades (Clinicman)

This implementation plan traces the structural path to convert Clinicman from a polished static layout into a **Cinematic Product Experience** (`id="0nby8n"`). It is designed to be executed incrementally, preserving application stability while systematically closing visual, motion, UX, and performance gaps highlighted in the Gap Audit.

---

## 1. Architectural Strategy & Design System Modifiers

Our approach is built on maintaining full system reliability, using native Web APIs (such as hardware-accelerated CSS variables), leveraging Next.js App Router loading states, and utilizing registered GSAP features inside custom hooks.

```
                  [ CORE SYSTEM UPGRADES ]
  
        globals.css ───────────────► Add 6-Layer Ambient Canvas
                                     & Spring Eases (--ease-spring)
             │
             ├──► (dashboard)/layout.tsx ──► Global Coordinate Listener
             │                               & CMD+K Mounting
             │
             └──► Components ──────────────► 3D Tilt Card (KpiCard)
                                             Glow-tracking Button (Button)
                                             Command Palette (cmdk)
```

---

## 2. Phase-by-Phase Technical Walkthrough

### Phase 1: Visual Depth & Micro-Physics (Est: 2-3 Days)
*Focus: Wire the 6-layer atmospheric background system (`id="2rf7g9"`) and add organic 3D cursor interaction to core components.*

#### Step 1.1: Multi-Layer Atmospheric Base
* **File to modify**: `clinicman/web/src/app/globals.css`
* **Changes**: 
  * Declare dynamic CSS custom variables on `:root` to track mouse positions: `--cursor-x: 50%` and `--cursor-y: 50%`.
  * Define animation keyframes for dynamic, slow-flowing mesh gradients.
  * Wire the SVG noise filter overlay and link the radial cursor glows using hardware-accelerated backgrounds.
  ```css
  /* globals.css edits */
  :root {
    --cursor-x: 50vw;
    --cursor-y: 50vh;
  }
  .bg-atmospheric {
    background: 
      radial-gradient(circle 450px at var(--cursor-x) var(--cursor-y), hsl(var(--primary) / 0.12) 0%, transparent 80%),
      radial-gradient(circle 350px at calc(var(--cursor-x) * 0.8) calc(var(--cursor-y) * 0.8), hsl(var(--accent-cyan) / 0.08) 0%, transparent 70%),
      var(--gradient-mesh);
  }
  ```

#### Step 1.2: Global Cursor-Coordinate Dispatcher
* **File to modify**: `clinicman/web/src/app/(dashboard)/layout.tsx`
* **Changes**: 
  * Mount a lightweight `useLayoutEffect` mouse listener to the main workspace layout container.
  * Dynamically update `--cursor-x` and `--cursor-y` inline styles on the container using pixel-to-percentage ratios, throttled via `requestAnimationFrame` to prevent layout thrashing.
  * Apply `.bg-atmospheric` to the base shell wrapper.

#### Step 1.3: Upgraded `KpiCard` with 3D Tilt & Cursor Spotlight
* **File to modify**: `clinicman/web/src/components/dashboard/KpiCard.tsx`
* **Changes**:
  * Implement coordinate tracking inside individual card instances. Listen to `onMouseMove` events, fetching the target card's `getBoundingClientRect()`.
  * Calculate local mouse variables (`--card-x` and `--card-y`) relative to the card's top-left corner to feed a radial border border light (gradient edge lighting).
  * Calculate offsets from the center coordinate (ranging from `-0.5` to `0.5`) to drive rotation vectors (`--tilt-x` and `--tilt-y`).
  * Apply `transform: perspective(1000px) rotateX(calc(var(--tilt-x) * 12deg)) rotateY(calc(var(--tilt-y) * -12deg))` inside Tailwind classes.
  * Apply a `transition: transform 0.2s var(--ease-out)` to guarantee interactive continuity.

#### Step 1.4: Magnetic & Glow-Tracking Button Primitive
* **File to modify**: `clinicman/web/src/components/ui/button.tsx`
* **Changes**:
  * Extend the `<Button>` component with an optional `magnetic` boolean prop. When active, wrap the internal layout using our existing `<Magnetic strength={0.25}>` wrapper.
  * Add a nested `.btn-spotlight` span that renders an inline radial highlight following the local cursor coordinate inside the button bounds.

#### Step 1.5: Nested Viewport Smooth Scroll Activation (Lenis Target Locking)
* **File to modify**: `clinicman/web/src/providers/SmoothScrollProvider.tsx`
* **Changes**:
  * Re-engineer the provider to recognize that clinical routes starting with `/dashboard`, `/patients`, etc. use `h-screen overflow-hidden` dashboard layouts with nested scroll areas.
  * Instead of disabling Lenis entirely on these paths, instantiate Lenis by passing a target wrapper selector pointing to the active `.overflow-y-auto` workspace element.
  * Synchronize nested Lenis scroll events with `ScrollTrigger.update()` to enable smooth inertia scrolling on case logs, tables, and dashboards.

---

### Phase 2: Enterprise UI & Shortcut Systems (Est: 3-4 Days)
*Focus: Build and wire full keyboard-navigable command structures (`cmdk`) and notification centers.*

#### Step 2.1: Command Palette Component Creation
* **New File**: `clinicman/web/src/components/shared/command-palette.tsx`
* **Implementation Details**:
  * Import `Command` elements from our active `cmdk` package.
  * Wrap in a high-blur Radix Dialog (`@radix-ui/react-dialog`) to create a backdrop glassmorphic shield.
  * Provide keyboard-shortcut metadata hints (`Cmd+K` / `Esc` to toggle).
  * Populate search items from the `NAV_ITEMS` schema (representing clinic modules) and patients cache.
  * Implement active highlighting states using GSAP spring fades on focus change.

#### Step 2.2: Mounting & Global Hook Bindings
* **File to modify**: `clinicman/web/src/app/(dashboard)/layout.tsx`
* **Changes**:
  * Mount `<CommandPalette />` globally at the root shell.
  * Bind event listeners for `keydown` triggers checking `(e.key === 'k' && (e.metaKey || e.ctrlKey))`. Protect inputs by preventing defaults during trigger actions.

#### Step 2.3: Radix-Driven Notification Center Popover
* **New File**: `clinicman/web/src/components/shared/notification-center.tsx`
* **File to modify**: `clinicman/web/src/components/shared/header.tsx`
* **Changes**:
  * Replace the static bell container with a fully animated Radix Popover (`@radix-ui/react-popover`).
  * Render a scrollable list of system logs (e.g. pending patient reviews, low inventory alerts, billing reminders).
  * Include a "Mark All Read" trigger button, animating items out of the viewport with a GSAP stagger slide.
  * Animate the bell icon with an active, elastic spring rotation on new notification arrivals.

---

### Phase 3: Spatial Architecture & Form UX (Est: 3-4 Days)
*Focus: Break layouts from boring symmetries into functional bento grids, construct timeline history logs, and write premium form inputs.*

#### Step 3.1: Dashboard Bento-Grid Restructure
* **File to modify**: `clinicman/web/src/app/(dashboard)/dashboard/page.tsx`
* **Changes**:
  * Re-architect the symmetrical 4-column column rows into a dynamic 12-column Bento-box grid (`grid grid-cols-12 gap-6`).
  * Span the primary Hero greeting across `col-span-12 md:col-span-8`, sitting beside a high-density "Today's Quick Stats" module spanning `col-span-4`.
  * Span a featured, interactive chart panel (`reports-charts.tsx`) across `col-span-12 lg:col-span-8` to balance a 4-span Quick Action list array.

#### Step 3.2: Reusable `Input` UI Component with Active Focus Gradients
* **New File**: `clinicman/web/src/components/ui/input.tsx`
* **Implementation Details**:
  * Write a fully compliant, forwardRef input element wrapped inside a functional floating label container.
  * Style using standard CSS transitions that lift labels (`transform -translate-y-4 scale-75`) upon focused input or active content.
  * Build an animated focus outline overlay utilizing a dynamic dual-gradient border.
  * Support validation animations (shaking on `aria-invalid` triggers, drawing a checkmark on valid completion).

#### Step 3.3: Case History Activity Timeline
* **New File**: `clinicman/web/src/components/shared/activity-timeline.tsx`
* **File to modify**: `clinicman/web/src/app/(dashboard)/patients/[id]/page.tsx`
* **Changes**:
  * Build a vertical timeline tracking path.
  * Render step icons with glowing status pulse rings (`animate-pulse-ring`) representing consult records, medicine prescriptions, and invoice checkouts.
  * Connect icons via a linear, scroll-driven gradient trace (`ScrollTrigger` driven line reveal).

---

### Phase 4: Perceived Performance & Hydration (Est: 3-4 Days)
*Focus: Enable staged page rendering, remove raw white blocks, and implement instant optimistic updates.*

#### Step 4.1: Shape-Accurate Route Skeletons
* **New Files**: 
  * `clinicman/web/src/app/(dashboard)/dashboard/loading.tsx`
  * `clinicman/web/src/app/(dashboard)/patients/loading.tsx`
  * `clinicman/web/src/components/dashboard/DashboardSkeleton.tsx`
* **Implementation Details**:
  * Write shape-accurate SVG and rectangle cards matching the precise proportions of the bento-box grid.
  * Animate skeleton elements using our dynamic `.skeleton-shimmer` shimmer patterns.
  * Instantly render skeletons during page routing transitions to secure smooth content transitions.

#### Step 4.2: Suspense Boundaries & Data Streaming
* **File to modify**: `clinicman/web/src/app/(dashboard)/dashboard/page.tsx`
* **Changes**:
  * Break large `Promise.all` server fetches.
  * Segment dashboard elements into individual React components (e.g. `<ReportsChartSection />`, `<KpiSummarySection />`).
  * Wrap components in explicit Next.js `<Suspense fallback={<GridSkeleton />} />` bounds. This ensures high-priority greeting components render instantly while slower database aggregates load in the background.

#### Step 4.3: Wire Optimistic State Updates
* **File to modify**: `clinicman/web/src/app/(dashboard)/appointments/page.tsx` (or new appointment forms)
* **Changes**:
  * Leverage React's modern `useOptimistic` hook inside form mutations.
  * Instantly project the newly booked slot onto the active schedule grid with a soft blurred border state, adjusting indices automatically once the database confirms writing the transaction.

---

## 3. Detailed Verification Plan

We will systematically verify every interaction and layer to guarantee WCAG compliance and smooth frame rates.

### Automated Tests
* Run TypeScript compiler:
  ```bash
  pnpm typecheck
  ```
* Execute Vitest unit testing suites:
  ```bash
  pnpm test:unit
  ```
* Run Next.js production builds to verify compilation and static generation:
  ```bash
  pnpm build
  ```

### Manual & Interactive Verification
1. **Performance Frames Check**: Open Chrome DevTools Performance monitor, scroll through the Bento grid, and ensure animations consistently run at **60fps** (no JS lag under coordinate listener loops).
2. **Tab Navigation Audit**: Navigate through the sidebar, dashboard, and KPI grids using only the keyboard (`Tab`, `Shift+Tab`, `Arrow keys`). Verify roving focus states.
3. **Screen Reader Live Alerts**: Inspect toast alert notifications using a screen reader to verify that success updates are audibly announced in live time.

---

## 4. Phase Checkpoints & Definition of Done

Each phase is considered fully completed only when it passes the following specific verification metrics:

### 🚩 Checkpoint 1: Visual Depth & Micro-Physics
* [x] Background dynamically reacts to mouse movements across all coordinates, running at 60fps.
* [x] Hovering over any KPI card tilts it inside a 3D coordinate space.
* [x] Main layout compiles with no lint or hydration warnings.
* [x] Nested viewport smooth scrolling unlocked using custom targeted Lenis wrappers.

### 🚩 Checkpoint 2: Enterprise UI & Navigation
* [x] Pressing `Cmd+K` or `Ctrl+K` instantly opens the glassmorphic command palette with full backdrop-blur shading.
* [x] Command palette items can be fully navigated, filtered, and triggered using only the keyboard.
* [x] Notification bell triggers a popover menu showing grouped clinical activity logs.

### 🚩 Checkpoint 3: Layouts & Input Experience
* [x] Predictable symmetrical layouts are replaced by the dynamic, 12-column Bento configurations.
* [x] Forms implement floating label inputs featuring glowing focus border highlights.
* [ ] Patient timelines show animated connection guides and glowing check pulses.

### 🚩 Checkpoint 4: Speed & Hydration
* [x] Page routing displays shimmer-animated loading skeletons matching layout dimensions.
* [ ] Dashboard components load independently via data streaming Suspense islands.
* [ ] Forms immediately reflect optimistic insertion states during creation processes.
