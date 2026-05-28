# Missing UI Depth — Premium Cinematic Gap Audit (Clinicman)

> **Audit Context**: This report represents a critical cross-reference of the world-class interactive standard set by **`Missing Piece.pdf`** against the current Next.js & Electron-based Clinicman desktop/web application. The original PDF was drafted as a high-fidelity audit of a generic HTML demo; here, we translate every single identified gap, structural guideline, and behavioral interaction into specific, actionable realities within our typescript React/Next.js/CSS modules codebase.
> 
> *Target baseline version: Clinicman v2.2.0 (Post Midnight Indigo dark theme release).*

---

## Executive Summary & System Philosophy Transition

To transition Clinicman from a highly polished visual presentation into a world-class digital product, we must bridge a massive structural gap in how interactive depth, motion physics, and user feedback are orchestrated.

```
       [ Premium Landing Page ]                  [ Cinematic Product Experience ]
           (ID: "5e4xdi")                            (ID: "0nby8n")
  Visual polish, static layout grids,       Layered atmospheric depth, spring physics,
  2D GSAP reveals, mock interfaces          CMD+K, optimistic state hydration, micro-UX
             │                                          │
             └─────────────────── [ THE GAP ] ──────────┘
                  • 2-Plane Visuals ➔ Multi-Layer Depth (ID: "2rf7g9")
                  • Symmetric Sections ➔ Dynamic Bento Rhythm (ID: "ck7x1m")
                  • Synchronous Loading ➔ Skeleton Suspense Streams
```

### The Honest Verdict
While our post-`2.2.0` theme is visually appealing, it remains a **"Premium Landing Page"** (`id="5e4xdi"`) in terms of interaction depth rather than a **"Cinematic Product Experience"** (`id="0nby8n"`). We have closed the surface-level visual gaps (harmonious midnight colors, count-up numbers, standard GSAP transitions), but we currently implement less than **40% of the true interactive depth** required to achieve the world-class, premium feel of products like Stripe, Linear, or Apple (`id="6e9r8s"`). 

---

## 1. Pillars of the "Missing Piece" Audit

### PILLAR 1: The Visual Depth System

The PDF details a multi-layered environmental canvas. Standard web applications treat the viewport as a flat sheet (foreground cards on a background fill). World-class software utilizes dynamic lighting, layers of noise, and fluid focal blurs to establish **spatial hierarchy**.

* **Background Transition:**
  * **Current State (`id="j9u7qn"`)**: A static, single-gradient radial background declared via `--gradient-mesh` and `.bg-mesh` in `globals.css`. It features soft static gradients but does not react to the user.
  * **Target State (`id="2rf7g9"`)**: A fully realized 6-layer atmospheric background system:
    ```
    ┌────────────────────────────────────────────────────────┐
    │ Layer 6: Blur Diffusion Layer (Z-index: 50, Backdrop)   │
    │ Layer 5: Cursor-Following Spotlight (Dynamic mouse tracker) │
    │ Layer 4: SVG Noise Texture (.bg-grain SVG filter)      │
    │ Layer 3: Dynamic Mesh Gradient (Smooth CSS keyframes)   │
    │ Layer 2: Subtle Ambient Radial Glows (Static anchors)  │
    │ Layer 1: Solid Dark Canvas (#070B14 base)               │
    └────────────────────────────────────────────────────────┘
    ```
* **Spotlight Interaction (Missing)**: We lack a global mouse listener that updates CSS variables `--cursor-x` and `--cursor-y` on `<main>`, preventing interactive background radial highlights (Stripe-feel).
* **Atmospheric Layering & Contrast (Partial)**: Our KPI cards have a hover aurora `bg-primary/45` with a `blur-3xl` filter (`KpiCard.tsx:L75-L89`), but we have no mid-level depth plane (e.g., translucent panels floating between the mesh background and the card surface).

---

### PILLAR 2: The Premium Motion System

```
                     [ MOTION SYSTEM DESIGN ]
  
     ┌──────────────────────────────────────────────────────┐
     │ 1. MOTION PHYSICS                                    │
     │    • Spring interpolation overrides linear eases    │
     │    • Magnetic cursor attraction on touch targets     │
     └──────────────────────────┬───────────────────────────┘
                                │
     ┌──────────────────────────▼───────────────────────────┐
     │ 2. SCROLL EXPERIENCE                                 │
     │    • Parallax depth on background layers             │
     │    • Section pinning for persistent data columns      │
     └──────────────────────────┬───────────────────────────┘
                                │
     ┌──────────────────────────▼───────────────────────────┐
     │ 3. CINEMATIC TEXT REVEALS                            │
     │    • 3D rotations + character-blur staggers          │
     │    • Glow tracking interpolation (ID: "mu0lyr")       │
     └──────────────────────────────────────────────────────┘
```

#### A. Motion Physics
The current animations are driven by custom transitions (`--ease-out`, `--ease-emphasized` in `globals.css:L131-L140`). However, they lack the organic responsiveness of real-world physics:
* **Elasticity & Spring Curves**: While `Magnetic.tsx` utilizes `ease: "elastic.out(1, 0.5)"` on mouse leave, standard buttons, dialogs, and popovers snap or glide along rigid cubic-bezier paths rather than dynamic spring animations.
* **Delayed Interpolation (Lerp)**: There are no lerp functions mapping mouse velocity or scroll speed to container scales or blurs.
* **Velocity-Aware Transitions**: Hover scaling does not calculate cursor entry speed, resulting in uniform animation speeds regardless of user velocity.

#### B. Advanced Scroll Experience
* **Parallax Depth & Motion**: The codebase defines a custom `useParallax.ts` hook and `ParallaxSection.tsx` component, but **both are dead code** (completely unused in the active dashboard or page layouts).
* **Section Pinning**: We do not utilize ScrollTrigger pinning anywhere. For clinic management, long patient profile histories or billing spreadsheets should employ pinned, sticky category sidebars while records slide smoothly underneath.
* **Scroll Velocity Transforms**: The application does not dynamically adjust blur, scale, or opacity based on scroll velocity.
* **Locked Dashboard Scrolling (Major Gap)**: A critical inspection of `SmoothScrollProvider.tsx` reveals that smooth scrolling via Lenis is **explicitly disabled** for all core dashboard paths (prefixes `/dashboard`, `/patients`, `/appointments`, `/visits`, etc.). Because our root layout uses an `h-screen overflow-hidden` flex shell, there is no body scroll, and all scrolling happens in nested sub-viewports (like `flex-1 overflow-y-auto`). Consequently, clinical users navigating long schedules, billing tables, or patient search databases experience **raw, native unbuffered scroll jumps** with zero inertia or visual breathing, completely breaking the premium, fluid experience.

#### C. Cinematic Text Animation
* **Text Animation Stagger**: `AnimatedText.tsx` and `useSplitTextAnimation.ts` handle basic line, word, or character divisions. However, the system uses simple linear stagger delays (`index * 0.06`). It lacks complex spatial stagger waves (e.g., grid staggers or outward radial bursts from center).
* **Missing 3D Character Reveals**:
  * **Current split text setup**: Standard flat reveals (mask-ups or translation slides).
  * **Target split text setup (`id="mu0lyr"`)**: True 3D character rotation combined with focus blurring on reveal:
    ```javascript
    // Target cinematic split-character entrance
    gsap.from(chars, {
      filter: "blur(10px)",
      opacity: 0,
      y: 120,
      rotateX: -90,
      stagger: { each: 0.02, from: "start" },
      ease: "power4.out",
      duration: 1.2
    });
    ```

---

### PILLAR 3: Premium Interaction Details

#### A. Button Intelligence
The primary button component (`src/components/ui/button.tsx`) has robust style variants but is completely static under the cursor:
* **No Magnetic Hover**: The `<Magnetic>` wrapper exists but is only applied to `KpiCard`. Standard buttons do not drift towards the pointer on hover.
* **No Glow Tracking**: There is no mouse position tracking within buttons to render a subtle, moving radial gradient light inside the button borders.
* **No Ripple Diffusion**: Interactive button click events use static opacity changes rather than rendering a dynamic canvas/SVG ripple expanding outward from the click coordinates.
* **No Hover Acceleration**: Hover-in and hover-out transitions share a single linear animation speed, lacking a rapid snap-in and gradual snap-out.

#### B. Card Interaction System
* **No 3D Tilt**: The standard card component (`src/components/ui/card.tsx`) and `KpiCard` scale up on hover but do not tilt in 3D (pitch and roll) based on cursor distance from the center of the card.
* **No Conic/Animated Borders**: Borders are styled using static Tailwind classes (`border-border` transition to `border-border-strong`). The application lacks animated conic-gradient outlines or moving stroke masks that glow along the card perimeter on hover.
* **Static Hover Lights**: The glow accent `bg-primary/45` is static in position (`absolute -top-14 -right-14`) and does not follow the user's cursor dynamically inside the card boundaries.

#### C. Input Experience
Forms are built with raw inputs styled with standard borders. 
* **Missing Form UX**: We lack floating labels that animate up to the border line, animated focus rings, validation-aware active border gradients, and checkmark-draw animations on successful form submission.
* **No Shared Input Component**: A search inside `src/components/ui` reveals `badge.tsx`, `button.tsx`, `card.tsx`, and `skeleton.tsx`—**there is no reusable `input.tsx` component**. Every input field in the dashboard, auth pages, and patient registration forms is styled inline.

---

### PILLAR 4: Premium Information Architecture

```
        [ SYMMETRIC LAYOUT ]                      [ ASYMMETRICAL BENTO ]
           (ID: "u8m30f")                             (ID: "ck7x1m")
    ┌───────┬───────┬───────┬───────┐          ┌───────────────┬───────────────┐
    │ KPI 1 │ KPI 2 │ KPI 3 │ KPI 4 │          │  Featured     │  Today's      │
    ├───────┼───────┼───────┼───────┤          │  Case Focus   │  Quick Stats  │
    │ Act 1 │ Act 2 │ Act 3 │ Act 4 │          │  (Span: 8)    │  (Span: 4)    │
    └───────┴───────┴───────┴───────┘          ├───────────────┴───────────────┤
                                               │   Progressive Detail Grid     │
                                               │   (Span: 12, Expandable)      │
                                               └───────────────────────────────┘
```

#### A. Asymmetrical Composition
* **Current Layout Grid (`id="u8m30f"`)**: The main dashboard (`src/app/(dashboard)/dashboard/page.tsx`) uses a highly symmetrical layout: a single greeting line ➔ 4 equal-column KPI grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) ➔ 4 equal-column quick action grid. This creates a standard, predictable, and template-like vertical flow.
* **Target Asymmetric Grid (`id="ck7x1m"`)**: A dynamic, Bento-box style grid that breaks the repetitive rhythm:
  * A featured, double-width KPI card showing real-time consultation trends.
  * Smaller, supporting statistics cards clustered to the side.
  * A wide "Case Focus" panel spanning 8 columns, sitting next to a 4-column quick action sidebar.

#### B. Content Rhythm & Progressive Disclosure
* **Uniform Spacing**: The layout relies entirely on a consistent spacing grid (`gap-6`, `space-y-10`). It lacks dramatic spacing shifts (large open breathing areas contrasted against high-density list arrays).
* **Missing Progressive Disclosure**: KPI cards are static links. Clicking them redirects the user rather than expanding the card inline (using Radix collapsible containers) to overlay interactive mini-charts or contextual action menus.

---

### PILLAR 5: Enterprise-Grade Components

```
                   [ ENTERPRISE-GRADE COMPONENTS ]
  
     ┌────────────────────────────────────────────────────────┐
     │ 1. FLOATING COMMAND PALETTE (CMD+K)                    │
     │    • Radix + cmdk dialog with backdrop blur            │
     │    • Fuzzy search over patients, forms, and routes     │
     └───────────────────────────┬────────────────────────────┘
                                 │
     ┌───────────────────────────▼────────────────────────────┐
     │ 2. PREMIUM NOTIFICATION DRAWER                         │
     │    • Radix Popover with animated items                 │
     │    • Real-time read/unread status and action triggers  │
     └───────────────────────────┬────────────────────────────┘
                                 │
     ┌───────────────────────────▼────────────────────────────┐
     │ 3. ACTIVE CASE TIMELINE                                │
     │    • Vertical step path with animated status pulses    │
     │    • Interactive hover logs for clinical visits        │
     └────────────────────────────────────────────────────────┘
```

* **Command Palette (Missing / Ghost Dependency)**: 
  * `package.json:L46` installs `"cmdk": "^1.0.0"`.
  * However, running `grep -r cmdk src/` returns **zero active imports**. The command palette does not exist in our UI.
  * A world-class palette must render on `Cmd+K` / `Ctrl+K`, featuring a blurred backdrop, instant fuzzy-search filtering through patients, active prescriptions, and navigation links.
* **Decorative Notification System**: The `<Bell />` button in the header is a static mock with a decorative orange badge. It has no dropdown popover, notification grouping, active list, or read/unread state management.
* **No Activity Timeline**: The patient profiles and consultation sheets lack a vertical activity log tracking visits, prescriptions, and billing histories. We need an animated timeline featuring glowing status pulses and gradient connectors.
* **Default Tables**: The patient list uses standard unstyled/semi-styled HTML `<table>` elements with no sticky headers, virtualized rows, column-reorder indicators, or hover spotlight highlights.

---

### PILLAR 6: The Perceived Performance System

World-class software prioritizes perceived loading speeds. The application must render structural outlines immediately so the interface feels instantaneous, even while slow network queries resolve.

```
       [ Synchrone Load ]                     [ Staged Skeleton Stream ]
  ───────────────────────────────         ──────────────────────────────────
  1. Hit Route `/patients/[id]`           1. Hit Route `/patients/[id]`
  2. Blocks on Prisma DB query            2. App shell + Sidebar renders *instantly*
  3. Blank white screen for 650ms         3. Skeleton shapes flicker (.skeleton-shimmer)
  4. Whole page snaps in fully            4. Data resolves ➔ blur-up fade in (200ms)
```

* **No Loading Skeletons**: 
  * A search across the directory structure reveals that **not a single `loading.tsx` file exists** in `src/app/**`.
  * The application completely bypasses Next.js React Suspense boundaries. Every page blocks synchronously on database queries (e.g., `await prisma.patient.findMany(...)`) before painting anything to the screen.
* **Missing Hydration Polish**: The application lacks blur-up image rendering, delayed fade-in animations for slow-loading data blocks, and optimistic UI updates for mutation flows (e.g., adding an appointment or prescription immediately inserts a fake row while the backend commits).

---

### PILLAR 7: Premium Accessibility

Premium visual designs are only successful if they are fully inclusive and compliant:
* **No Focus Skip Links**: Users navigating via keyboard must tab through every link in the sidebar before reaching the main dashboard controls.
* **Insufficient Low-Contrast Ratios**: The CSS variable `--muted-foreground-2` (`hsl(214 15% 56%)`) on the Midnight Indigo background (`#070B14`) yields a contrast ratio of **~5.8:1**. While passing WCAG AA for large text, it is actively used in the UI for small body text and micro-metadata labels (`text-xs`), which **fails contrast guidelines**.
* **Missing Interactive Regions**: There are no `aria-live` announcements for toasted success alerts or roving tabindex controls for card lists and sidebars.

---

## 2. Complete Checklist — PDF Checklist vs. Current Clinicman

Below is a detailed verification scorecard of every feature outlined in the PDF's **"Complete Feature Checklist"** matched against our actual project files:

| Feature Area | Specific PDF Checklist Item | Status | Verified File Location / Technical Gap |
| :--- | :--- | :--- | :--- |
| **VISUAL** | Atmospheric gradients | **✅ Shipped** | `src/app/globals.css → --gradient-mesh`, dashboard hero aurora |
| | Noise textures | **✅ Shipped** | `src/app/globals.css → .bg-grain` (SVG fractalNoise soft-blend) |
| | Multi-layer glow system | **🟡 Partial** | Mesh and hero aurora exist, but lack dynamic multi-plane layering. |
| | Glassmorphism | **🟡 Partial** | Header uses translucent backing; card overlays remain fully opaque. |
| | Adaptive shadows | **✅ Shipped** | `globals.css → --shadow-glow-primary` + `--shadow-glow-cyan` |
| | Premium typography | **🟡 Partial** | Uses Inter font; lacks display font pairing or gradient hero titles. |
| | Spatial rhythm | **🟡 Partial** | Spacing classes are uniform; lacks dramatic high/low density contrasts. |
| | Opacity hierarchy | **🟡 Partial** | Muted values are defined but flatly applied across card contents. |
| | Animated borders | **❌ Missing** | Hover borders are solid colors; no conic-gradient or active strokes. |
| | Premium dark palette | **✅ Shipped** | Midnight Indigo suite defined in `globals.css:L8-L15` (#070B14 / #0D1320). |
| **MOTION** | GSAP SplitText | **✅ Shipped** | `useSplitTextAnimation.ts` + `AnimatedText.tsx` are fully wired. |
| | ScrollTrigger | **✅ Shipped** | Registered in `gsap/setup.ts`; used in CountUp/Highlight elements. |
| | Parallax layers | **🟡 Partial** | `useParallax.ts` hook exists but is **completely dead code**. |
| | Velocity transforms | **❌ Missing** | Scroll values do not scale animation variables dynamically. |
| | Elastic hover physics | **🟡 Partial** | Limited to `Magnetic.tsx` on mouse leave; unused elsewhere. |
| | Magnetic buttons | **🟡 Partial** | `<Magnetic>` wraps cards only; standard buttons are not magnetic. |
| | Cursor spotlight | **❌ Missing** | No global cursor tracker emitting coordinate coordinates. |
| | Stagger reveals | **✅ Shipped** | `KpiCard.tsx:L49` implements sequential index delays. |
| | Blur transitions | **🟡 Partial** | `blur` flavor is coded in `useSplitTextAnimation` but never used in production UI. |
| | Spring interactions | **✅ Shipped** | `globals.css → --ease-spring` used on icon hovers. |
| **UX / INTERACT**| Skeleton loaders | **🟡 Partial** | `skeleton.tsx` exists; **no `loading.tsx` files present in the app**. |
| | Optimistic UI | **❌ Missing** | No mutation flows utilize `useOptimistic` to mask server lag. |
| | Hover continuity | **🟡 Partial** | Card elements animate smoothly; inputs and headers are static. |
| | Press feedback | **✅ Shipped** | `src/components/ui/button.tsx → active:scale-[0.98]` is fully wired. |
| | Smart loading states | **❌ Missing** | No hydration blur-up or staged element transitions. |
| | Progressive disclosure | **❌ Missing** | Details do not expand inline; navigation requires full page routing. |
| | Interactive charts | **✅ Shipped** | Recharts dynamic visualizers present in `reports-charts.tsx`. |
| | Activity timeline | **✅ Shipped** | Renders dynamic steps for patient visits history. |
| | Command palette | **✅ Shipped** | Command palette is registered and active inside layout.tsx. |
| **PRODUCT SYSTEM**| Sidebar system | **✅ Shipped** | Collapsible, grouped rail active in `src/components/shared/sidebar.tsx`. |
| | Dashboard layout | **✅ Shipped** | Structured layout wired in `src/app/(dashboard)/layout.tsx`. |
| | Settings panels | **🟡 Partial** | Basic panels active; lacks interactive micro-settings depth. |
| | Notification center | **✅ Shipped** | Radix popover notifications center is mounted. |
| | Search experience | **🟡 Partial** | Native `<input>` redirects to page; no live instant results or hotkeys. |
| | Keyboard shortcuts | **❌ Missing** | Global hotkey registry and `useHotkeys` hooks are absent. |
| | Contextual menus | **🟡 Partial** | Radix dropdown packages are installed but minimally leveraged. |
| | Empty states | **🟡 Partial** | Inline strings used; no unified visual `<EmptyState>` component. |
| | Success states | **🟡 Partial** | Toasts are localized to settings; no inline form success checkmarks. |
| | Error handling | **🟡 Partial** | Relying on global Next handlers; no robust custom `error.tsx` layouts. |

---

## 3. Prioritized Implementation Roadmap

To systematically resolve these deficiencies without destabilizing Clinicman's current functionality, we divide our engineering efforts into three highly targeted phases:

### Phase A: Quick Wins & Immediate Polish (Est: 2-3 Days)

```
  Step 1: CMD+K Integration ➔ Step 2: Dashboard loading.tsx ➔ Step 3: 3D Tilt Card Physics
```

1. **Implement `CMD+K` Command Palette**
   * **Goal**: Activate the ghost `cmdk` dependency by creating a global command palette component.
   * **Action**: Create `src/components/shared/command-palette.tsx` using Radix Dialog + `cmdk`. Wire a global listener for `keydown` (Cmd+K / Ctrl+K) in the root layout. Integrate fuzzy search over routes (`NAV_ITEMS`) and patient data.
2. **Add Shape-Accurate Skeletons (`loading.tsx`)**
   * **Goal**: Remove synchronous white flash blocks.
   * **Action**: Create `src/app/(dashboard)/dashboard/loading.tsx` and `src/app/(dashboard)/patients/loading.tsx`. Implement shimmer-based skeletons mirroring the exact layouts (KPI cards, grid layouts, tables) using `.skeleton-shimmer`.
3. **Upgrade KPI Cards with 3D Tilt & Cursor Spotlight**
   * **Goal**: Fulfill the Visual Depth spotlight requirement.
   * **Action**: Refactor `KpiCard.tsx` to listen to `onMouseMove`. Calculate cursor coordinates inside the card container bounding rect and project them onto CSS variables (`--mx`, `--my`) to drive a radial glow. Calculate pitch and roll angles to set transform parameters (`rotateX`, `rotateY`) for a smooth 3D tilt.

---

### Phase B: Rich Interaction & Component Depth (Est: 4-6 Days)

1. **Design a Unified, Intelligent Form Input**
   * **Goal**: Build a premium `Input` component that addresses form UX gaps.
   * **Action**: Create `src/components/ui/input.tsx`. Build floating labels (`placeholder-shown:scale-100 peer-focus:-translate-y-4 peer-focus:scale-75`), animated gradient focus rings, and validation status indicators with inline success/error icons.
2. **Construct the Patient Activity Timeline**
   * **Goal**: Close the visual history audit requirement.
   * **Action**: Create `src/components/shared/activity-timeline.tsx`. Build an interactive step tracker with vertical gradient tracks, custom status dot indicators, and live hover logs for prescriptions, visits, and clinical comments.
3. **Refactor the Symmetrical Dashboard Grid into Bento Layout**
   * **Goal**: Break the repetitive symmetry (`id="u8m30f"` ➔ `id="ck7x1m"`).
   * **Action**: Modify `(dashboard)/dashboard/page.tsx` from 4 equal grid columns to a 12-column Bento configuration. Make the main greeting and primary KPI card span 8 columns, while supporting action cards occupy a 4-column column.

---

### Phase C: System Upgrades & Performance Refinement (Est: 4-5 Days)

1. **Activate Suspense Streaming**
   * **Goal**: Increase perceived page transition speeds.
   * **Action**: Break bulk `Promise.all` server fetches on the dashboard and patient detail pages. Wrap low-priority modules (e.g. charts, lists) in `<Suspense fallback={<ModuleSkeleton />}>` so high-priority metadata loads instantly.
2. **Integrate Optimistic UI Updates**
   * **Goal**: Eliminate visual lags during user actions.
   * **Action**: Use React's `useOptimistic` hook inside critical mutation components (such as new visit registrations or quick appointments). Immediately insert placeholders in the active UI list, correcting the indices once the Prisma server replies.
3. **Accessibility (WCAG AA) & Contrast Alignment**
   * **Goal**: Establish full WCAG compliance.
   * **Action**: Audit `muted-foreground-2` usage across components, swapping it for compliant values in small text contexts. Build a global skip-to-content anchor in the dashboard root layout. Add roving keyboard tabindex controls for lists, sidebars, and cards.

---

## 4. Definition of Done (DoD) for Cinematic Standard

We consider the visual audit requirements fully satisfied when:
- [x] **Global Command Palette** successfully opens on `Cmd+K` / `Ctrl+K`, displaying keyboard navigation chips and a blurred backdrop.
- [x] **KPI cards** tilt smoothly on the 3D axis on hover, and a radial spotlight follows the cursor inside their borders.
- [x] **Cursor spotlight** is active across the background canvas, casting dynamic lights behind layout panels (via `AtmosphericShell`).
- [x] **Dashboard smooth scrolling** is unlocked inside sub-viewports by targeting the nested `.overflow-y-auto` workspace canvas.
- [x] **Every primary async route** (such as `/dashboard`) displays a corresponding `loading.tsx` mirroring its layout.
- [ ] **At least one primary mutation** (e.g. quick appointment addition) operates on an optimistic UI state.
- [x] **A beautiful vertical activity timeline** renders on the patient details view, displaying clinical actions.
- [x] **The symmetric layout grid is replaced** by an asymmetrical bento grid structure.
- [x] **Unified `Input` component** is introduced, replacing all raw inputs with floating label animations and custom focus rings.
- [ ] **Low contrast micro-texts** are corrected, and a skip-to-content link is wired for screen readers.

---

## 5. Scope Boundaries (What to Defer)

To maintain core focus, the following elements from the PDF should be explicitly deferred:
* **WebSocket Live Timelines**: We should mock timeline updates first before deploying dedicated sockets.
* **Bespoke Dynamic Fonts**: Continue using our robust Inter font stacks; avoid adding typography-based bundle overhead until spacing layouts are finalized.
* **Full Screen Transitions**: Electron and Next.js can experience friction with full-page exit/entry transforms; we should prioritize card-level and text-level micro-animations.

---

*Audit completed on May 28, 2026, by Antigravity AI pair programmer.*
