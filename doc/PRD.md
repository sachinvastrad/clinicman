# DrMan.ai — Homeopathic Clinic Management System
## Product Requirements Document (PRD) · v2.0
**Date:** 2026-05-16 | **Author:** Product Owner | **Status:** Approved for Development

---

## Table of Contents
1. [Executive Summary & Positioning](#1-executive-summary--positioning)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [Product Scope](#5-product-scope)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Tech Stack](#8-tech-stack)
9. [Compliance & Security](#9-compliance--security)
10. [Competitive Differentiators](#10-competitive-differentiators)
11. [EPICs & User Stories](#11-epics--user-stories)
12. [Release Roadmap](#12-release-roadmap)

---

## 1. Executive Summary & Positioning

> **"WhatsApp-first Homeopathy Clinic Operating System for Indian Clinics."**

**DrMan.ai** is a full-stack, AI-ready clinic management platform purpose-built for homeopathic practices. It delivers a unified web application (Next.js) and cross-platform mobile app covering end-to-end clinical, operational, and financial workflows for three roles — **Receptionist**, **Doctor**, and **Admin**.

**Key differentiators:**
- Homeopathy-specific clinical tools: repertorization, miasmatic analysis, constitutional profiling, remedy history, potency & dosage tracking, improvement scale
- WhatsApp-first patient communication: every clinical output (prescription, diet chart, yoga plan, receipt, reminder) delivered via WhatsApp in one click
- Built-in diet chart builder and curated yoga library linked directly to prescription workflows
- CRM-style lead pipeline with multi-source capture (website, WhatsApp, Google Ads, walk-in, referral)
- Real-time financial dashboard: income, expenses, vendor management, and profitability
- Built for one clinic first; architecture designed to scale into a multi-tenant SaaS platform

---

## 2. Problem Statement

Homeopathic clinics in India and abroad operate with:
- **Paper-based records**: case files are lost, illegible, and inaccessible across visits
- **No-show rates of 20–30%**: lack of automated reminders wastes doctor time and clinic revenue
- **Revenue leakage**: untracked in-house medicine dispensing, undocumented consultations, no package plan management
- **Poor patient retention**: no structured follow-up, no escalation for non-responders, no wellness content delivery
- **Manual accounting**: expense and income reconciliation done in notebooks or Excel; no vendor tracking
- **Zero lead visibility**: walk-in enquiries and website/Google Ads visitors are never tracked or nurtured
- **Fragmented communication**: reception uses personal WhatsApp, prescriptions are handwritten, reminders are ad hoc

DrMan.ai solves all of the above in a single, role-aware, WhatsApp-first platform.

---

## 3. Goals & Success Metrics

| Goal | KPI | Target (Month 6) |
|------|-----|-----------------|
| Digitise patient records | % records on system | 100% new patients |
| Reduce no-shows | No-show rate | < 10% (↓ from ~25%) |
| Revenue accuracy | Untracked / billing errors | < 2% |
| Patient retention | 6-month follow-up compliance | > 70% (↑ 60%) |
| Appointment self-service | Online bookings / total | > 40% |
| WhatsApp engagement | Message open rate | > 90% |
| Lead conversion | Lead → patient conversion | > 30% |
| Receptionist efficiency | Admin time saved/day | > 2 hours |
| Follow-up compliance | Overdue follow-ups acted on | > 80% |

---

## 4. Target Users & Personas

### 4.1 Dr. Priya (Homeopathic Doctor)
- 12 years of practice, sees 25–40 patients/day
- Needs fast case-taking, constitutional profiling, repertorization, and concise prescription writing
- Wants to track each patient's improvement score visit-over-visit and compare remedy history
- Wants to send diet charts and yoga routines without manual typing
- Pain point: repeating the same follow-up instructions every visit; no systematic improvement tracking

### 4.2 Reema (Receptionist)
- Handles walk-ins, phone/WhatsApp bookings, token management, billing, and lead follow-up
- Issues receipts and collects payments; manages medicine dispensing counter
- Pain point: juggling a paper appointment book, a cash register, a personal WhatsApp, and a lead notebook simultaneously

### 4.3 Vikram (Clinic Admin / Owner)
- Monitors daily collections, monthly P&L, vendor spend, staff accounts, and lead pipeline
- Needs consolidated reports exportable to PDF/Excel and shareable with his accountant
- Pain point: no single source of truth; revenue and expenses tracked in separate tools

### 4.4 Priyanka (Patient — Indirect User)
- Books appointments via clinic website or WhatsApp
- Wants digital prescription, diet plan, follow-up reminders, and birthday messages on WhatsApp
- Pain point: forgetting medicine schedules, follow-up dates, and losing paper prescriptions

---

## 5. Product Scope

### In Scope — v1.0 (MVP)
- Web App (Next.js, responsive desktop + tablet)
- Role-based access: Receptionist, Doctor, Admin
- Patient registration & EMR (including constitutional profile, remedy history, improvement scale)
- Appointment booking, token queue, slot management
- Homeopathic prescription module (basic — no repertorization engine yet)
- In-house medicine inventory & dispensing (with cost price / selling price / vendor)
- Billing: line-item invoices, package plans, GST, receipts, medical certificates
- WhatsApp Business API: confirmations, reminders, prescription/receipt delivery
- Basic financial tracking: income, expenses by category, daily cash book

### In Scope — v1.1
- Diet chart builder + Yoga library
- Lead management CRM (multi-source including Google Ads)
- Follow-up engine with escalation reminders
- Online booking widget (embeddable on clinic website)
- WhatsApp broadcast campaigns, birthday + refill reminders, two-way inbox
- Monthly P&L, vendor management, expense approval workflow
- Push notifications (Firebase)
- Mobile App (React Native / Expo)

### In Scope — v1.2
- Repertorization engine (symptom → remedy scoring)
- Materia Medica quick reference
- Miasmatic analysis module
- Advanced analytics dashboard (top diseases, conversion rate, no-show trends)
- ABDM-ready architecture (Ayushman Bharat Digital Mission)
- GST liability report

### Out of Scope (v2.0+)
- Lab / radiology integration
- Insurance billing
- Multi-branch / multi-tenant SaaS
- Telemedicine video calls
- AI features (prescription suggestions, lead scoring, voice-to-notes, chatbot)

---

## 6. Functional Requirements

### 6.1 Authentication & Role Management
- Phone + OTP login (SMS via Supabase Auth)
- Role-based permissions (RBAC): Admin > Doctor > Receptionist
- Admin can create, deactivate, and reassign staff accounts
- Session timeout and immutable audit log for all sensitive actions
- Push notification preferences per user

### 6.2 Patient Management (EMR)
- Patient registration: name, DOB, gender, address, photo, contact, occupation, allergies, referred by
- Unique Patient ID (UHI-compatible format: DRM-YYYY-NNNNN)
- **Constitutional profile**: dominant constitution type, characteristic symptoms, thermal state, mental disposition
- **Remedy history**: full list of remedies prescribed across all visits with response noted
- **Improvement scale**: doctor rates patient improvement at each visit (0–10 scale; visual trend chart)
- Complete case history: chief complaint, HPI, past history, surgical history, family history, personal history, mental generals, physical generals, PQRS symptoms
- Miasmatic background capture (Psora / Sycosis / Syphilis / Tubercular)
- Vitals tracking per visit (weight, BMI, BP, temperature, pulse) with trend charts
- Document upload: lab reports, old prescriptions, X-rays (PDF/image)
- Patient search by name, ID, phone (fuzzy, < 300ms)
- Chronic vs Acute case tagging
- Visit timeline with all encounters

### 6.3 Appointment & Scheduling
- Doctor's daily/weekly calendar view
- Receptionist can book, reschedule, cancel on behalf of patient
- Patient self-booking via public-facing widget (website) and WhatsApp
- Booking sources tracked: Reception / Website / WhatsApp / Mobile App
- Appointment types: New Case, Follow-Up, Emergency
- Appointment statuses: Booked → Confirmed → Checked-In → In Consultation → Completed → Cancelled / No-Show
- Token/queue management with real-time status board
- Estimated wait time display
- Blocking timeslots for holidays / unavailability (single, range, recurring)
- Automated WhatsApp confirmation & 24-hour reminder

### 6.4 Homeopathic Clinical Module
- Case-taking templates (Kentian, Boenninghausian, Sensation method)
- PQRS symptom capture (Peculiar, Queer, Rare, Strange)
- **Common disease prescription templates** (pre-built for top 20 conditions: Acne, Arthritis, Anxiety, IBS, Migraine, PCOD, Psoriasis, etc.)
- **Remedy template library**: doctor can save frequently used remedy combinations as named templates for reuse
- Symptom selection and repertorization — v1.2 (integrated open repertory database)
- Remedy suggestion ranked by symptom coverage — v1.2
- Materia Medica quick-lookup — v1.2
- Potency selection guide (LM, CH, X scales)
- Prescription builder: remedy, potency, dose, anupan (vehicle), frequency, duration
- Miasmatic analysis indicator — v1.2
- **Patient improvement score** at each visit (0–10 with notes) displayed as trend
- Case analysis notes (rich text)
- Compare past prescriptions across visits
- One-click prescription PDF generation and WhatsApp dispatch

### 6.5 In-House Medicine Dispensing & Vendor Management
- Medicine catalog: remedy name, potency, form, brand, batch, expiry, **cost price**, **selling price**, reorder level
- **Vendor / supplier management**: vendor name, contact, GST, payment terms, delivery lead time
- **Purchase records**: record medicine purchases against a vendor; track total spend per vendor
- Low-stock alerts (in-app + WhatsApp to admin)
- Expiry alerts (30-day and 7-day warnings)
- Dispense medicines linked to prescription; stock auto-decremented
- Charge dispensed medicines to patient bill automatically
- Stock movement log (purchased / dispensed / adjusted / expired)
- Bulk CSV import for initial stock setup

### 6.6 Diet Chart & Yoga Library
- Diet chart builder with food categories (allowed, restricted, avoid)
- Condition-based templates (Diabetes, Hypertension, Obesity, PCOD, Psoriasis, IBS, Thyroid, Anaemia, General Detox)
- Nutrition guidance notes (free text)
- Curated yoga asana library: name (English + Sanskrit), description, step-by-step, image, benefits, contraindications, condition tags, difficulty
- Doctor prescribes specific asanas with duration, reps, frequency
- Diet chart + yoga plan bundled into a branded PDF and sent via WhatsApp

### 6.7 Billing & Payments
- Line-item invoice: consultation fee + medicines dispensed + other charges
- **Package / treatment plans**: create multi-session packages (e.g., "3-month weight loss plan — ₹3,500"); track sessions consumed vs remaining
- Multiple payment modes: Cash, UPI, Card, **Net Banking**
- GST-compliant receipt generation (PDF)
- Medical certificate generation (Sick Leave, Fitness, Custom)
- Partial payment / outstanding tracking
- Daily collection summary for Receptionist
- Print (thermal 80mm) and WhatsApp delivery of receipt

### 6.8 WhatsApp Communication
- WhatsApp Business API integration (WATI / AiSensy / Interakt)
- **Pre-approved templates:**
  - Appointment Confirmation
  - 24-hour Appointment Reminder
  - "You Are Next" (queue update)
  - Prescription Dispatch (PDF)
  - Diet Chart + Yoga Wellness Plan (PDF)
  - Follow-Up Due Reminder
  - Escalation Reminder (overdue follow-up)
  - Payment Receipt (PDF)
  - **Birthday Wishes**
  - **Medicine Refill Reminder**
  - Monthly Health Tip / Newsletter
- Broadcast campaigns to filtered patient segments
- Two-way message inbox with conversation assignment
- Message delivery status: Sent / Delivered / Read
- Opt-in at registration; opt-out honoured within 24 hours (DPDP Act)

### 6.9 Lead Management CRM
- Lead capture sources: **Website form**, **WhatsApp click-to-chat**, **Walk-in**, **Referral**, **Google Ads**, Social Media
- Lead pipeline stages: New → Contacted → Appointment Booked → **Consultation Completed** → Converted → Lost
- Assign lead to Receptionist; follow-up date and notes per lead
- Lead-to-patient conversion one-click (pre-fills registration)
- Lead source analytics + conversion rate per source
- WhatsApp nurturing messages from lead stage

### 6.10 Follow-Up & Reminders (with Escalation)
- Doctor sets follow-up interval per patient per visit
- WhatsApp reminder D-2 before follow-up due date
- WhatsApp reminder D-0 (on due date) if no appointment booked
- **Escalation reminder**: if still no appointment 3 days after due date, send escalation WhatsApp and notify Receptionist with high-priority flag
- Overdue follow-up dashboard for Receptionist
- Follow-up completion tracked against booking

### 6.11 Financial Management
- Income entries: consultation, medicine sales, package plan, other
- Expense categories: rent, salary, medicine purchase, electricity, marketing, equipment, miscellaneous
- **Vendor-linked expenses**: expenses against specific vendors with purchase order reference
- Daily cash book view
- Monthly P&L report with month-over-month comparison
- GST liability summary (output GST vs input credit)
- Expense approval workflow (Receptionist submits → Admin approves/rejects)
- Export to Excel / PDF
- Revenue per doctor
- Outstanding dues report with WhatsApp payment reminder

### 6.12 Reports & Analytics (Admin)
- **Dashboard KPIs**: appointments today, revenue today, pending follow-ups, **top diseases treated**, **lead conversion rate**, new patients this month
- Patient statistics: new vs returning, disease-wise, age/gender distribution
- Appointment analytics: booked vs attended vs cancelled vs no-show (dedicated no-show report)
- Revenue analytics: daily / weekly / monthly / yearly
- **Medicine sales report**: top remedies dispensed, revenue from medicines vs consultations
- Lead funnel report by source
- Follow-up compliance rate
- WhatsApp campaign performance
- **Improvement trends**: average patient improvement score across chronic cases

### 6.13 Push Notifications (Staff)
- Firebase Cloud Messaging for in-app and mobile push notifications
- Triggered by: new appointment (from website widget), low stock, new lead, overdue follow-up, expense approval request, new WhatsApp message
- Notification preferences configurable per user

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Page load < 2s on 4G; API response < 500ms (p95) |
| Availability | 99.9% uptime; scheduled maintenance 2–4 AM IST |
| Scalability | 10,000 patients, 500 appointments/day per clinic (v1); multi-tenant SaaS ready (v2) |
| Mobile | React Native app + PWA fallback; offline mode for last 30 days of patient records |
| Accessibility | WCAG 2.1 AA compliance |
| Internationalisation | English + Marathi/Hindi UI toggle (v1.1) |
| Data Retention | Patient records ≥ 7 years per Medical Council of India norms |
| Audit Trail | Immutable audit log with timestamp + user ID for all write operations |
| Push Notifications | Firebase FCM for web + mobile |
| Architecture | Modular monolith (v1) → microservices migration path (v2) |

---

## 8. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI, React Query, Zustand |
| Mobile | React Native (Expo) + Next.js PWA fallback |
| Backend | Next.js API Routes (v1 monolith) → NestJS microservices (v2) |
| ORM | Prisma ORM |
| Database | PostgreSQL (Supabase) — primary; Redis — cache / job queues |
| Auth | Supabase Auth (OTP / Magic Link) |
| File Storage | Supabase Storage (S3-compatible) |
| PDF Generation | React-PDF / Puppeteer |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| WhatsApp | WATI or AiSensy (WhatsApp Business API BSP) |
| Payments | Razorpay (UPI, Card, Net Banking) |
| Hosting | Vercel (web) + Fly.io or AWS ECS (background workers) |
| CI/CD | GitHub Actions |
| Monitoring | Sentry (errors) + PostHog (product analytics) |
| Containerisation | Docker (v1.2) → Kubernetes (v2 multi-tenant) |

---

## 9. Compliance & Security

- **DPDP Act 2023 (India)**: Explicit patient consent before storing personal/health data; right to access and deletion; consent audit trail
- **IT Act 2000**: Data localisation for health records stored in Indian region
- **ABDM-Ready (v1.2)**: Ayushman Bharat Digital Mission alignment — Health ID (ABHA), FHIR R4 API hooks, patient-linked health records
- **End-to-end encryption**: PHI encrypted at rest (AES-256) and in transit (TLS 1.3)
- **RBAC + RLS**: Role-based access control enforced at API layer; Supabase Row Level Security scopes all DB queries to clinic_id
- **WhatsApp opt-in/opt-out**: Explicit consent at registration; opt-out via STOP keyword; processed within 24 hours
- **Audit logging**: Immutable audit log; INSERT-only via service role; cannot be modified by any staff
- **Backups**: Daily automated DB backups with 30-day retention; point-in-time recovery via Supabase
- **Vulnerability management**: Dependency scanning via GitHub Dependabot; OWASP Top 10 review before each major release

---

## 10. Competitive Differentiators

Unlike generic clinic software (Practo, Lybrate, Clinicea), DrMan.ai is:

| Dimension | Existing Tools | DrMan.ai |
|-----------|---------------|---------|
| Specialisation | Generic / multi-specialty | Homeopathy-first (constitutional profiling, miasmatic analysis, repertorization) |
| Communication | SMS / email | WhatsApp-first (all outputs delivered via WhatsApp in one click) |
| Clinical depth | Basic notes | Improvement scale, remedy history, PQRS capture, potency tracking |
| Wellness | Separate apps | Diet + yoga prescription built-in and bundled into patient plan |
| Lead management | None | Full CRM pipeline from Google Ads → consultation → conversion |
| Geography | Generic | India-focused (GST, DPDP Act, ABDM, Razorpay, IST workflows) |
| Business model | Per-seat SaaS | Single clinic → multi-tenant SaaS trajectory built into architecture |
| AI (v2+) | None in this segment | Prescription suggestions, lead scoring, voice-to-notes, booking chatbot |

---

## 11. EPICs & User Stories

*(See `EPICS_AND_STORIES.md`)*

---

## 12. Release Roadmap

| Phase | Scope | Timeline |
|-------|-------|----------|
| **MVP (v1.0)** | Auth, Patient EMR (+ constitutional profile + improvement scale), Appointments, Basic Prescription (+ disease templates), Inventory (+ vendor mgmt), Billing (+ package plans), WhatsApp Reminders | Month 1–3 |
| **v1.1** | Diet/Yoga Library, Lead CRM (+ Google Ads source), Follow-up Escalation, Online Booking Widget, WhatsApp Inbox + Broadcasts + Birthday + Refill templates, Financial Reports + Vendor Expenses, Push Notifications, Mobile App | Month 4–5 |
| **v1.2** | Repertorization Engine, Materia Medica, Miasmatic Analysis, Advanced Analytics Dashboard, ABDM-ready APIs, GST Report, Containerisation | Month 6–7 |
| **v2.0** | Multi-branch / Multi-tenant SaaS, Telemedicine, ABDM full integration, Insurance billing hooks | Month 8–12 |
| **v3.0 (AI)** | AI prescription suggestions, AI lead scoring, AI follow-up prediction, Voice-to-consultation notes, WhatsApp AI booking chatbot | Month 13–18 |
