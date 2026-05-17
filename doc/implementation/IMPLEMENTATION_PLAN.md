# DrMan.ai — Implementation Plan
**Role:** Expert Software Engineer & Architect  
**Version:** 1.0 | **Date:** 2026-05-16

---

## Table of Contents
1. [Team & Responsibilities](#1-team--responsibilities)
2. [Engineering Principles](#2-engineering-principles)
3. [Phase 0 — Foundation & Setup (Week 0–1)](#3-phase-0--foundation--setup-week-01)
4. [Phase 1 — MVP (Week 2–13)](#4-phase-1--mvp-week-213)
5. [Phase 2 — v1.1 Enrichment (Week 14–21)](#5-phase-2--v11-enrichment-week-1421)
6. [Phase 3 — v1.2 Clinical Depth (Week 22–28)](#6-phase-3--v12-clinical-depth-week-2228)
7. [Checkpoints & Quality Gates](#7-checkpoints--quality-gates)
8. [Testing Strategy](#8-testing-strategy)
9. [Definition of Done](#9-definition-of-done)
10. [Risk Register](#10-risk-register)
11. [Technical Debt Policy](#11-technical-debt-policy)

---

## 1. Team & Responsibilities

| Role | Count | Owns |
|------|-------|------|
| **Tech Lead / Architect** | 1 | Architecture decisions, code review, DB schema, API design, security |
| **Full-Stack Developer** | 1–2 | Feature implementation (frontend + backend), DB migrations |
| **QA Engineer** (part-time) | 1 | Test plans, manual regression, API test suites, UAT coordination |
| **UI/UX Designer** (part-time) | 1 | Figma designs for each sprint; design system tokens |
| **Product Owner** | 1 | Story grooming, acceptance criteria sign-off, stakeholder demos |

> **Assumption:** 2-developer core team. Velocity = ~20 SP/sprint (2-week sprint).  
> A single senior developer can sustain ~12 SP/sprint solo.

---

## 2. Engineering Principles

1. **Schema first** — every feature starts with a DB migration and Zod validation schema before UI work begins.
2. **API contract before UI** — agree on request/response shape; frontend can build with mocks while backend implements.
3. **Server Components by default** — use React Server Components (RSC) for all data-fetching; use `'use client'` only when interactivity demands it.
4. **RLS from day 1** — every Supabase table ships with Row Level Security policies in the same migration.
5. **No raw SQL in application code** — use Prisma ORM; hand-write SQL only in migrations.
6. **One feature flag system** — use environment variables for feature flags (no third-party flag SaaS in v1).
7. **Fail loudly in dev, gracefully in prod** — unhandled errors throw in development; show user-friendly messages and log to Sentry in production.
8. **Mobile-first UI** — design at 375px breakpoint first; scale up.
9. **Optimistic updates** — use React Query `useMutation` with `onMutate` rollback for all write operations visible in UI.

---

## 3. Phase 0 — Foundation & Setup (Week 0–1)

**Goal:** Every developer can run the full stack locally and push to CI in 30 minutes.

### 3.1 Repository & Monorepo Structure
```
drman-ai/
├── apps/
│   ├── web/          # Next.js 15 web app
│   └── mobile/       # React Native (Expo) — scaffold only in Phase 0
├── packages/
│   ├── db/           # Prisma schema + migrations + generated client
│   ├── ui/           # Shared Shadcn/UI component library
│   ├── config/       # Shared ESLint, Prettier, TypeScript config
│   └── types/        # Shared TypeScript interfaces (Patient, Visit, etc.)
├── workers/          # Background job scripts (Node.js)
├── supabase/
│   ├── migrations/   # SQL migration files
│   └── seed.sql      # Dev seed data
├── .github/
│   └── workflows/    # CI/CD pipelines
└── docs/             # All documentation (this folder)
```

**Tooling:**
- Package manager: **pnpm** with workspaces
- Node version manager: `.nvmrc` pinned to Node 22 LTS
- Code formatter: **Prettier** (single config at root)
- Linter: **ESLint** with `@typescript-eslint`, `eslint-plugin-react-hooks`
- Git hooks: **Husky** + **lint-staged** (format + lint on pre-commit)
- Commit convention: **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`)

### 3.2 Infrastructure Provisioning Checklist
```
[ ] Create Supabase project (free tier → Pro on go-live)
    [ ] Enable pg_trgm extension (for fuzzy patient search)
    [ ] Enable pg_cron extension (for scheduled DB jobs)
    [ ] Set up Auth: Phone OTP provider
    [ ] Configure Storage buckets: prescriptions, documents, avatars, receipts
[ ] Create Vercel project; link to GitHub repo
    [ ] Add environment variables (all from ARCHITECTURE.md §8)
    [ ] Enable Vercel Cron Jobs (for background workers)
[ ] Register WATI account
    [ ] Verify WhatsApp Business number
    [ ] Submit initial 4 template messages for Meta approval
[ ] Create Razorpay test account
[ ] Set up Sentry project (Next.js template)
[ ] Set up PostHog project
[ ] Create Firebase project; enable Cloud Messaging
[ ] Set up Resend account for transactional email
[ ] Set up GitHub repository
    [ ] Branch protection: require PR + 1 review for `main`
    [ ] Add Dependabot for security updates
```

### 3.3 Project Scaffold Tasks
```
[ ] Init Next.js 15 app (App Router, TypeScript, Tailwind CSS)
[ ] Install and configure Shadcn/UI (neutral theme, CSS variables)
[ ] Set up Supabase JS client (server + browser helpers)
[ ] Init Prisma; connect to Supabase PostgreSQL
[ ] Write Phase 0 migration: clinics, users, enums
[ ] Configure Next.js middleware for auth + role routing
[ ] Create .env.local, .env.staging, .env.production templates
[ ] Write README.md with local dev setup instructions (≤ 10 steps)
[ ] Smoke test: login page renders, OTP flow works end-to-end
```

**Phase 0 Exit Criteria:**
- Developer can clone, run `pnpm install && pnpm dev`, and see the login screen
- OTP login works against Supabase Auth (dev keys)
- CI pipeline runs on every PR (lint + type-check + build)
- Empty role-based dashboards load without errors

---

## 4. Phase 1 — MVP (Week 2–13)

**12 weeks | 6 × 2-week sprints | Target: 130 SP**

---

### Sprint 1 · Auth, Patient Registration & Profile (Week 2–3)
**SP: 18 | EPICs: E-01, E-02 (partial)**

#### DB Migrations
```sql
-- Migration 001: Users + Clinics (already done in Phase 0)
-- Migration 002: Patients, case_history, patient_documents
-- Migration 003: audit_log + RLS policies for all above
```

#### Backend Tasks
- [ ] `POST /api/auth/send-otp` — phone validation + Supabase OTP trigger
- [ ] `POST /api/auth/verify-otp` — verify + return session + user profile
- [ ] `GET /api/users` — list staff (admin only)
- [ ] `POST /api/users` — create staff account
- [ ] `PATCH /api/users/:id` — update / toggle active
- [ ] `GET /api/patients` — list with fuzzy search (pg_trgm)
- [ ] `POST /api/patients` — register new patient + generate patient_code
- [ ] `GET /api/patients/:id` — full profile (joins case_history)
- [ ] `PATCH /api/patients/:id` — update demographics
- [ ] `GET /api/patients/:id/case-history`
- [ ] `PUT /api/patients/:id/case-history` — upsert
- [ ] Middleware: `withAuth()` + `withRole()` wrappers
- [ ] Zod schemas for all request bodies

#### Frontend Tasks
- [ ] Login page: phone input + OTP entry + redirect
- [ ] Role-aware sidebar layout (Admin / Doctor / Receptionist nav items)
- [ ] Patient list page: search bar + table with pagination
- [ ] New patient registration form (stepper: Demographics → History → Consent)
- [ ] Patient profile page: header (name, ID, quick actions) + tabs (Overview, Visits, Documents, Remedy History)
- [ ] Case history form (accordion sections)
- [ ] Constitutional profile section on patient form
- [ ] Staff management page (Admin)
- [ ] Global search bar with keyboard shortcut (⌘K)
- [ ] `usePatient` React Query hook with optimistic update

#### QA Checkpoints for Sprint 1
- [ ] New patient registration (happy path + duplicate phone error)
- [ ] Patient search returns results within 300ms
- [ ] Admin can create/deactivate staff; deactivated staff cannot log in
- [ ] Doctor cannot access /finance → 403 page
- [ ] Audit log records all patient create/update events

---

### Sprint 2 · Appointments, Calendar & Queue (Week 4–5)
**SP: 19 | EPIC: E-03**

#### DB Migrations
```sql
-- Migration 004: appointments, blocked_slots
-- RLS: appointments scoped to clinic_id
```

#### Backend Tasks
- [ ] `GET /api/appointments` — daily/weekly list with filters
- [ ] `GET /api/appointments/slots` — available slots for a date
- [ ] `POST /api/appointments` — book (staff)
- [ ] `POST /api/appointments/public` — book (unauthenticated widget)
- [ ] `PATCH /api/appointments/:id` — reschedule / cancel / checkin / complete
- [ ] `POST /api/blocked-slots` — block date range
- [ ] Slot conflict detection (database-level unique partial index)
- [ ] Token number assignment (sequential per clinic per day)
- [ ] Supabase Realtime subscription setup for queue board channel

#### Frontend Tasks
- [ ] Appointment calendar (day/week view, color-coded by status)
- [ ] Book appointment modal: patient search + date + slot picker
- [ ] Reschedule / cancel flow with confirmation dialog
- [ ] Live queue board page (`/queue`) — optimised for TV screen display
- [ ] "Check In" + "Mark Done" actions on queue board
- [ ] Doctor's daily schedule list view
- [ ] Slot blocking UI (date range picker + reason)
- [ ] Appointment status badge component

#### QA Checkpoints for Sprint 2
- [ ] Double-booking attempt returns 409 Conflict
- [ ] Blocked slots hidden from available slots
- [ ] Realtime queue board updates within 1 second
- [ ] Receptionist can book, reschedule, cancel; changes reflected in calendar immediately

---

### Sprint 3 · Clinical Module & Prescription (Week 6–7)
**SP: 22 | EPIC: E-04 (MVP portion)**

#### DB Migrations
```sql
-- Migration 005: visits, vitals
-- Migration 006: prescriptions, prescription_items
-- Migration 007: constitutional_profile (column additions to case_history)
```

#### Backend Tasks
- [ ] `POST /api/visits` — start visit
- [ ] `GET /api/visits/:id` — full visit with sub-entities
- [ ] `PATCH /api/visits/:id` — update notes, status, follow-up date
- [ ] `POST /api/visits/:id/vitals` — record vitals
- [ ] `GET /api/visits/:visitId/prescription`
- [ ] `POST /api/visits/:visitId/prescription` — create + items
- [ ] `POST /api/prescriptions/:id/generate-pdf` — trigger Puppeteer
- [ ] Prescription PDF template (HTML → Puppeteer → PDF → Supabase Storage)
- [ ] `GET /api/disease-templates` — list prescription templates
- [ ] `POST /api/disease-templates` — Admin CRUD
- [ ] Improvement score: saved as field on visit record
- [ ] Remedy history query: cross-visit aggregation per patient

#### Frontend Tasks
- [ ] Visit workspace (tabbed): Case Notes | Vitals | Prescription | Diet | Yoga
- [ ] Case notes rich-text editor (Tiptap)
- [ ] Vitals entry form + trend sparkline chart
- [ ] Prescription builder: add remedy lines, potency picker, frequency selector
- [ ] Disease template picker modal (search + select → populate prescription)
- [ ] Save-as-template button (named custom template)
- [ ] Improvement score slider (0–10) on follow-up visit
- [ ] Remedy history tab on patient profile (cross-visit table)
- [ ] Prescription preview modal → "Save + Send via WhatsApp" button
- [ ] Allergy alert banner on prescription form
- [ ] Medical certificate generation modal (3 templates)

#### QA Checkpoints for Sprint 3
- [ ] Prescription PDF generates with all correct fields in < 3s
- [ ] Improvement score appears on patient profile trend chart
- [ ] Remedy history shows all remedies across visits in correct order
- [ ] Locked visit cannot be edited without Admin unlock
- [ ] Auto-save triggers every 60s on case notes form

---

### Sprint 4 · Inventory, Vendor Management & Billing (Week 8–9)
**SP: 39 | EPICs: E-05, E-06**

#### DB Migrations
```sql
-- Migration 008: inventory, inventory_movements
-- Migration 009: vendors, purchase_orders, purchase_order_items
-- Migration 010: invoices, invoice_items, payments
-- Migration 011: packages (treatment plans), patient_packages
```

#### Backend Tasks
- [ ] `GET/POST/PATCH /api/inventory` — CRUD + CSV bulk import endpoint
- [ ] `POST /api/inventory/stock-in` — record purchase movement
- [ ] `GET /api/inventory/movements` — filtered movement log
- [ ] `GET/POST/PATCH /api/vendors` — vendor CRUD
- [ ] `POST /api/purchases` — record purchase → increment inventory + auto-create expense
- [ ] `POST /api/prescriptions/:id/dispense` — dispense against prescription → decrement inventory
- [ ] `GET/POST /api/invoices` — create with line items
- [ ] `GET /api/invoices/:id`
- [ ] `POST /api/invoices/:id/payment` — record payment
- [ ] `POST /api/invoices/:id/generate-pdf` — receipt PDF
- [ ] `GET/POST/PATCH /api/packages` — treatment package Admin CRUD
- [ ] `POST /api/patients/:id/sell-package` — sell package to patient
- [ ] `GET /api/patients/:id/active-packages` — patient package balance
- [ ] Invoice number sequence generator (clinic-scoped, year-prefixed)
- [ ] Low-stock + expiry alert triggers via Supabase `pg_cron` or DB trigger

#### Frontend Tasks
- [ ] Inventory list page: search, filter low-stock / expiring, status badges
- [ ] Add / edit inventory item form
- [ ] Vendor list + vendor detail page
- [ ] Record purchase form (line items against vendor)
- [ ] Dispense medicines modal (linked from prescription)
- [ ] Invoice builder: line items + discount + payment mode selector
- [ ] Package management page (Admin): create / edit / archive packages
- [ ] "Sell Package" modal on patient profile
- [ ] Package balance chip on patient profile header
- [ ] Receipt PDF preview → print + WhatsApp send
- [ ] Outstanding dues list with "Record Payment" inline
- [ ] Daily collection summary (Receptionist dashboard widget)

#### QA Checkpoints for Sprint 4
- [ ] Dispensing a medicine decrements stock by correct quantity
- [ ] Stock cannot go below 0 (DB constraint enforced)
- [ ] Invoice total = sum of line items + GST − discount
- [ ] Package session count decrements on each visit correctly
- [ ] Low-stock DB trigger fires when quantity < reorder_level

---

### Sprint 5 · WhatsApp Integration & PDF Delivery (Week 10–11)
**SP: 16 | EPIC: E-07 (MVP portion)**

#### Backend Tasks
- [ ] WATI API wrapper: `sendTemplate()`, `sendTextReply()`, `getConversations()`
- [ ] `POST /api/whatsapp/webhook` — HMAC verified; handles inbound messages + delivery status
- [ ] `POST /api/whatsapp/send` — send template with params
- [ ] WhatsApp send wired into:
  - Appointment confirmation (triggered on appointment save)
  - 24-hour reminder (Vercel Cron every 30 min)
  - "You Are Next" (triggered on queue Done action)
  - Prescription dispatch (triggered on prescription save + send action)
  - Receipt dispatch (triggered on invoice payment)
  - Follow-up D-2 and D-0 reminders (Vercel Cron daily 9 AM)
- [ ] `POST /api/whatsapp/webhook` → handle CANCEL keyword → auto-cancel appointment
- [ ] WhatsApp opt-in/opt-out enforcement on all send paths
- [ ] Background job: `send-appointment-reminders` cron
- [ ] Background job: `send-followup-reminders` cron
- [ ] Background job: `send-birthday-wishes` cron
- [ ] Message status update from webhook → `whatsapp_messages` table

#### Frontend Tasks
- [ ] "Send via WhatsApp" button on prescription, receipt, and medical certificate screens
- [ ] Message delivery status chips (Sent / Delivered / Read / Failed) on relevant records
- [ ] WhatsApp opt-in toggle on patient registration form
- [ ] Cron job admin page (Admin > Settings): view last run time and status of each job

#### QA Checkpoints for Sprint 5
- [ ] Appointment confirmation sent within 60 seconds of booking
- [ ] 24-hour reminder NOT sent for cancelled appointments
- [ ] CANCEL keyword reply auto-cancels appointment and creates audit log entry
- [ ] Webhook HMAC verification rejects tampered payloads (401)
- [ ] Opt-out patient does not receive any WhatsApp message

---

### Sprint 6 · MVP Hardening, UAT & Pilot Deployment (Week 12–13)
**SP: ~16 (bug fixes, polish, performance)**

#### Tasks
- [ ] Full end-to-end test pass: all Sprint 1–5 flows
- [ ] Fix all P0 bugs from QA regression
- [ ] Performance: Lighthouse score ≥ 85 on key pages
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Error boundaries on every route; Sentry wired and receiving errors
- [ ] Empty states for all lists (no patients, no appointments, etc.)
- [ ] Loading skeletons on all data-fetching routes
- [ ] Responsive: test on 375px, 768px, 1280px, 1440px
- [ ] Seed script with realistic test data (10 patients, 3 staff, 20 appointments, 5 invoices)
- [ ] Security: OWASP Top 10 review (SQL injection via Prisma ✓, XSS via React ✓, CSRF via SameSite cookies, rate limiting on auth routes)
- [ ] DPDP Act compliance check: consent flow, opt-out, data export placeholder
- [ ] Staging deployment and sign-off
- [ ] UAT with clinic doctor/receptionist (1 day on-site)
- [ ] Production deployment

**MVP Checkpoint: see Section 7**

---

## 5. Phase 2 — v1.1 Enrichment (Week 14–21)

**8 weeks | 4 × 2-week sprints | Target: ~120 SP**

---

### Sprint 7 · Diet/Yoga Library + Lead CRM (Week 14–15)
**SP: 32 | EPICs: E-08, E-09**

#### DB Migrations
```sql
-- Migration 012: diet_templates, patient_diet_charts
-- Migration 013: yoga_asanas, patient_yoga_plans
-- Migration 014: leads
```

#### Backend Tasks
- [ ] `GET /api/diet-templates` — list with condition filter
- [ ] `POST/PATCH/DELETE /api/diet-templates` — Admin CRUD
- [ ] `POST /api/visits/:id/diet-chart` — save + trigger PDF
- [ ] `GET /api/yoga-asanas` — filtered list (condition, difficulty, body region)
- [ ] `POST/PATCH/DELETE /api/yoga-asanas` — Admin CRUD
- [ ] `POST /api/visits/:id/yoga-plan` — save + trigger PDF
- [ ] `POST /api/visits/:id/wellness-pdf` — combined diet + yoga PDF → WhatsApp
- [ ] `GET/POST/PATCH /api/leads` — CRUD
- [ ] `POST /api/leads/:id/convert` — convert to patient
- [ ] Lead webhook: website form POST → create lead
- [ ] Lead webhook: WhatsApp click-to-chat → create lead

#### Frontend Tasks
- [ ] Diet chart builder (template picker + editable table)
- [ ] Yoga asana library (filterable card grid + detail drawer)
- [ ] Yoga plan builder on visit workspace
- [ ] Wellness PDF preview → WhatsApp send
- [ ] Lead Kanban board (drag-and-drop columns)
- [ ] Lead detail side panel (notes, follow-up date, activity log)
- [ ] Lead → Patient conversion flow
- [ ] Admin: diet template editor + yoga asana editor (CRUD + image upload)

---

### Sprint 8 · Follow-Up Escalation + Online Booking Widget (Week 16–17)
**SP: 27 | EPICs: E-10, E-13**

#### DB Migrations
```sql
-- Migration 015: followup_tasks table (links visit → task → appointment)
```

#### Backend Tasks
- [ ] Follow-up task creation on visit save (auto-assigned to Receptionist)
- [ ] Overdue follow-up query (follow-up date passed, no subsequent appointment)
- [ ] `GET /api/followups/overdue` — list with priority flags
- [ ] Escalation cron: D+3 → send escalation WhatsApp + set priority flag; D+7 → notify Doctor
- [ ] `GET /api/settings/booking-widget` — returns widget config
- [ ] `PATCH /api/settings/booking-widget` — Admin update
- [ ] `GET /api/settings/booking-widget/embed` — returns embeddable HTML snippet
- [ ] Public booking widget route: `/book` (no auth, uses widget config)

#### Frontend Tasks
- [ ] Overdue follow-up dashboard widget (Receptionist home)
- [ ] Overdue list page with Book / Remind / Lost actions
- [ ] Escalation badge (red high-priority flag) on patient card
- [ ] Booking widget: self-contained React component at `/book`
- [ ] Booking confirmation screen (public, no auth)
- [ ] Admin: booking widget settings + embed code copy + live preview
- [ ] WhatsApp escalation template wiring

---

### Sprint 9 · WhatsApp Inbox + Broadcasts + Financial Reports (Week 18–19)
**SP: 34 | EPICs: E-07 (v1.1), E-11**

#### DB Migrations
```sql
-- Migration 016: whatsapp_campaigns, campaign_recipients
-- Migration 017: expenses (with vendor_id FK)
```

#### Backend Tasks
- [ ] `GET /api/whatsapp/inbox` — conversations list
- [ ] `GET /api/whatsapp/conversations/:patientId` — full thread
- [ ] `POST /api/whatsapp/reply` — free-text reply (within 24-hr session)
- [ ] `POST /api/whatsapp/campaigns` — create campaign + schedule
- [ ] Campaign execution job: filter patients → send templated messages in batches (rate-limited)
- [ ] Campaign analytics: delivery/read rates per campaign
- [ ] Birthday wishes cron: daily check + send
- [ ] Medicine refill reminder: calculate from prescription duration + send
- [ ] `GET /api/finance/income-summary` (daily/weekly/monthly groupings)
- [ ] `GET /api/finance/expenses` + `POST /api/finance/expenses`
- [ ] `PATCH /api/finance/expenses/:id` — approve/reject (Admin)
- [ ] `GET /api/finance/pl-report?month=YYYY-MM`
- [ ] `GET /api/finance/outstanding`
- [ ] `GET /api/finance/vendor-spend`
- [ ] Monthly P&L PDF generation (Puppeteer)

#### Frontend Tasks
- [ ] WhatsApp inbox (split-panel: conversation list + thread view)
- [ ] Campaign creator (filter → template → schedule → send)
- [ ] Campaign history + analytics page
- [ ] Finance: income summary page (daily tiles + breakdown chart)
- [ ] Finance: expense list + submit expense form + approval workflow
- [ ] Finance: monthly P&L page (revenue vs expense chart + export)
- [ ] Finance: outstanding dues page with WhatsApp reminder button
- [ ] Finance: vendor spend report

---

### Sprint 10 · Push Notifications + Mobile App + v1.1 Polish (Week 20–21)
**SP: 27 | EPICs: E-14, Mobile scaffold**

#### Backend Tasks
- [ ] `POST /api/notifications/register-token` — save FCM device token per user
- [ ] Notification trigger service: wraps all send-notification logic
- [ ] Wire FCM triggers into: new appointment (website), low stock, new lead, overdue follow-up, expense approval, new WhatsApp message
- [ ] `PATCH /api/users/notification-preferences` — save per-user preferences

#### Frontend Tasks
- [ ] FCM service worker registration (`firebase-messaging-sw.js`)
- [ ] Notification permission request on first login
- [ ] Notification preferences page (Profile > Notifications)
- [ ] In-app notification bell with unread badge + dropdown list
- [ ] **React Native (Expo) scaffold:**
  - [ ] Navigation: React Navigation (Stack + Bottom Tabs)
  - [ ] Auth screen (OTP login, shared Supabase auth)
  - [ ] Dashboard (role-aware)
  - [ ] Patient search + basic profile view
  - [ ] Appointments list for today
  - [ ] Push notifications via Expo Notifications + FCM
  - [ ] Offline caching (last 30 days via SQLite / MMKV)
- [ ] v1.1 bug fixes and performance tuning

**v1.1 Checkpoint: see Section 7**

---

## 6. Phase 3 — v1.2 Clinical Depth (Week 22–28)

**7 weeks | 3 sprints**

---

### Sprint 11 · Repertorization Engine + Materia Medica (Week 22–24)
**SP: 18 | EPIC: E-04 (v1.2)**

#### Backend Tasks
- [ ] Import open-source repertory data (Kent's Repertory — public domain) into `rubrics` and `rubric_remedies` tables
- [ ] Import Boericke's Materia Medica (public domain) into `materia_medica` table
- [ ] `POST /api/repertorization` — accepts symptom list + grades → returns scored remedy list
- [ ] Scoring algorithm: Σ(grade × remedy_value) per remedy; sort descending
- [ ] `GET /api/materia-medica/:remedyName` — full MM entry
- [ ] `GET /api/materia-medica/compare?a=X&b=Y` — side-by-side

#### Frontend Tasks
- [ ] Repertorization panel on visit workspace (Tab 6)
- [ ] Symptom search with keyboard navigation
- [ ] Symptom tray with grade selector (1 plain / 2 italic / 3 bold)
- [ ] Remedy scoring results table (top 10 with coverage bar)
- [ ] Materia Medica side panel (slide-over from prescription form)
- [ ] Compare two remedies view

---

### Sprint 12 · Miasmatic Analysis + Advanced Analytics (Week 25–26)
**SP: 23 | EPICs: E-04 (miasmatic), E-12**

#### Backend Tasks
- [ ] `POST /api/visits/:id/miasmatic-analysis` — save analysis
- [ ] `GET /api/reports/patients` — demographics, top diseases, improvement trends
- [ ] `GET /api/reports/appointments` — no-show report, busiest slots heat map
- [ ] `GET /api/reports/revenue` — trend data
- [ ] `GET /api/reports/leads` — funnel by source

#### Frontend Tasks
- [ ] Miasmatic analysis form on visit workspace (checklist → dominant miasm indicator)
- [ ] Admin dashboard KPI tiles (top diseases, conversion rate, live data)
- [ ] Patient analytics page (pie + bar + line charts using Recharts)
- [ ] Appointment analytics page (heat map for busiest slots)
- [ ] Revenue analytics page (stacked bar chart)
- [ ] Lead funnel report (source comparison bar chart)

---

### Sprint 13 · GST Report, ABDM Hooks, Containerisation (Week 27–28)
**SP: 13 | EPIC: E-11 (GST), Compliance**

#### Backend Tasks
- [ ] GST liability calculation query (output GST per rate, input GST from expenses)
- [ ] `GET /api/finance/gst-report?month=YYYY-MM`
- [ ] ABDM stub endpoints: `POST /api/abdm/health-id/verify` (placeholder, behind feature flag)
- [ ] FHIR R4 patient resource serializer (placeholder, behind feature flag)
- [ ] Dockerise Next.js app (`Dockerfile` multi-stage build)
- [ ] Docker Compose for local dev (Next.js + PostgreSQL + Redis)
- [ ] Performance: add Redis caching for expensive report queries (5-min TTL)
- [ ] Database: add missing indexes based on slow query log analysis

#### Frontend Tasks
- [ ] GST report page (summary tiles + detailed CSV export)
- [ ] ABDM section in Settings (disabled until v2.0, informational)

**v1.2 Checkpoint: see Section 7**

---

## 7. Checkpoints & Quality Gates

### Checkpoint 0 · Foundation Ready (End of Week 1)
| Gate | Pass Criteria |
|------|--------------|
| Dev environment | All developers can run full stack locally in < 10 min |
| CI pipeline | Lint + type-check + build passes on every PR |
| Auth | OTP login + role redirect works end-to-end |
| DB | Migrations applied; RLS policies in place |
| Staging | Vercel preview deployment accessible |

---

### Checkpoint 1 · MVP Complete (End of Week 13)

**Functional completeness:**
| Feature | Pass Criteria |
|---------|--------------|
| Patient registration | Register, search, edit patient; constitutional profile captured |
| Appointments | Book, reschedule, cancel, queue flow; WhatsApp confirmation sent |
| Prescription | Write, generate PDF, send via WhatsApp; disease templates work |
| Inventory + billing | Stock tracked; dispense auto-bills; package plan deducts sessions |
| WhatsApp | All 5 MVP templates sent; opt-out respected; webhook processes delivery |

**Quality gates:**
| Metric | Target |
|--------|--------|
| Lighthouse Performance | ≥ 85 (desktop), ≥ 75 (mobile) |
| API p95 response time | < 500ms |
| Page load (4G) | < 2s |
| Test coverage | ≥ 70% on API route handlers |
| Critical bug count | 0 P0 bugs open |
| Security | OWASP Top 10 review passed |
| UAT sign-off | Doctor + Receptionist complete 3 full patient journeys without assistance |

**Business gate:**
- Clinic can run a full working day using only the system (no paper fallback needed)

---

### Checkpoint 2 · v1.1 Complete (End of Week 21)

| Feature | Pass Criteria |
|---------|--------------|
| Diet & Yoga | Doctor prescribes plan, PDF generated, WhatsApp sent in < 3 min |
| Lead CRM | Lead captured from 3 sources; converted to patient |
| Follow-up escalation | D+3 escalation WhatsApp sent; high-priority flag appears |
| Booking widget | Embedded on test HTML page; booking creates appointment in system |
| WhatsApp inbox | Receptionist views + replies to 3 patient conversations |
| Financial reports | Monthly P&L generated and exported to PDF |
| Push notifications | New appointment notification received on mobile within 30 seconds |
| Mobile app | Doctor and Receptionist can view today's appointments on iOS/Android |

**Quality gates:**
| Metric | Target |
|--------|--------|
| Mobile app crash-free sessions | ≥ 99% |
| WhatsApp delivery rate | ≥ 95% |
| No-show rate (pilot clinic) | < 12% (↓ from baseline) |
| Lead conversion rate | > 25% |

---

### Checkpoint 3 · v1.2 Complete (End of Week 28)

| Feature | Pass Criteria |
|---------|--------------|
| Repertorization | Doctor selects 5 symptoms, system returns scored remedy list |
| Materia Medica | Doctor looks up any of 300+ remedies in < 2 seconds |
| Miasmatic analysis | Dominant miasm calculated and shown on patient profile |
| Analytics dashboard | All KPI tiles live with correct data |
| GST report | Monthly GST report generates with correct output/input split |
| ABDM stubs | Feature-flagged endpoints return correct FHIR R4 format |
| Docker | `docker compose up` runs full stack in < 5 minutes |

---

## 8. Testing Strategy

### 8.1 Unit Tests (Jest + React Testing Library)
- **What:** Pure functions, Zod validators, permission helpers, PDF template rendering
- **When:** Written alongside the feature; part of PR requirement
- **Target:** 100% coverage on `lib/permissions.ts`, `lib/validations/`, utility functions

### 8.2 Integration Tests (Vitest + Supabase local)
- **What:** API route handlers tested against a local Supabase instance
- **How:** Spin up `supabase start` in CI; run migrations + seed; test each route
- **Target:** ≥ 70% coverage on API route handlers; all happy paths + key error cases covered
- **Key flows to test:**
  - Appointment booking conflict prevention
  - Invoice total calculation
  - WhatsApp opt-out enforcement
  - RLS: user from clinic A cannot read clinic B's patients

### 8.3 End-to-End Tests (Playwright)
- **What:** Critical user journeys across the full stack
- **When:** Run on merge to `main` and before every release
- **Flows covered:**
  1. Login → Register patient → Book appointment → Check-in → Write prescription → Send via WhatsApp
  2. Login as Receptionist → Create invoice → Record payment → Send receipt
  3. Admin → Create staff account → New staff logs in
  4. Booking widget → Public user books appointment → Receptionist confirms → Patient receives WhatsApp

### 8.4 Manual / Exploratory Testing (QA Engineer)
- **Sprint regression:** Each sprint, QA runs a regression checklist on all previous sprints
- **UAT sessions:** 2 UAT sessions (post-MVP, post-v1.1) with real clinic staff
- **Device testing:** Chrome, Safari, Firefox; iOS Safari, Android Chrome; 375px, 768px, 1440px

### 8.5 Performance Testing
- **Tool:** k6 (load testing)
- **Scenarios:**
  - 50 concurrent users on patient search endpoint
  - 100 concurrent users on appointment list
  - PDF generation under 20 concurrent requests
- **Run:** Before each major release (Checkpoint 1, 2, 3)

### 8.6 Security Testing
- **OWASP ZAP:** Automated scan before each release
- **Manual checks:** SQL injection (Prisma parameterises all queries ✓), XSS (React escapes ✓), CSRF (SameSite=Strict cookies), IDOR (test that user from clinic A cannot access clinic B records), rate limiting on auth endpoints

---

## 9. Definition of Done

A user story is **Done** when ALL of the following are true:

- [ ] All acceptance criteria checked off
- [ ] Unit/integration tests written and passing (≥ 70% coverage on new code)
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No ESLint errors
- [ ] UI reviewed against Figma design at 375px and 1280px breakpoints
- [ ] API endpoint documented in `API_SPEC.md` (or confirmed already covered)
- [ ] DB migration applied to staging; RLS policy written
- [ ] PR reviewed by at least 1 other developer
- [ ] QA smoke-tested in staging
- [ ] No P0 or P1 bugs introduced

---

## 10. Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|-----------|
| R-01 | WhatsApp template approval delayed (Meta takes 48–72 hrs) | Medium | High | Submit all templates in Week 0; have SMS fallback for appointment reminders |
| R-02 | Supabase Realtime connection drops under load | Low | Medium | Implement reconnect logic with exponential backoff; fallback to polling every 10s |
| R-03 | Puppeteer PDF generation slow / memory issues on Vercel | Medium | High | Use `@sparticuz/chromium` (cold-start optimised); cache PDF if prescription unchanged |
| R-04 | WATI API rate limit hit during broadcast | Medium | Medium | Batch sends with 1-second delay between messages; queue via pg_cron |
| R-05 | UAT reveals major UX issues requiring redesign | Low | High | Run low-fidelity prototype test with clinic staff in Week 5 (before sprint 4) |
| R-06 | Scope creep from clinic owner during development | High | Medium | Strict sprint scope lock; new requests go into backlog; change control process |
| R-07 | Data migration from existing paper/Excel records | Medium | Medium | Build CSV import for patients in Sprint 1; provide import template to clinic |
| R-08 | Prisma migration conflicts when two devs work on schema simultaneously | Medium | Low | One person owns schema changes; create branch migrations; squash before merge |
| R-09 | Mobile app builds break due to Expo SDK updates | Low | Low | Pin Expo SDK version; update on dedicated sprint task, not mid-feature |
| R-10 | DPDP Act compliance gap discovered post-launch | Low | High | Legal review of consent flow before MVP go-live; data deletion endpoint in Sprint 1 |

---

## 11. Technical Debt Policy

- **Debt log:** Maintain a `TECH_DEBT.md` file in the root; any known shortcut gets an entry with priority and estimated fix effort
- **Debt sprint:** Every 4th sprint allocates 20% of capacity (4 SP) to debt reduction
- **No TODO in production code:** `// TODO` comments must be converted to GitHub issues before merging to `main`
- **Dependency updates:** Dependabot auto-creates PRs; reviewed and merged monthly
- **Known v1.0 shortcuts:**
  - PDF generation via Puppeteer (server-side, heavy) → migrate to `@react-pdf/renderer` in v1.2
  - No job queue (direct Vercel Cron) → replace with BullMQ + Redis in v2.0 for reliable retries
  - `whatsapp_messages` table used as simple log → add proper threading model in v1.1 (campaign)
