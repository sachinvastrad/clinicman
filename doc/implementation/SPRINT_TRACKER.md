# DrMan.ai — Sprint Tracker
**Last Updated:** 2026-05-16

Track progress sprint-by-sprint. Update status as work progresses.

---

## Legend
`🔲 Not Started` · `🔄 In Progress` · `✅ Done` · `⚠️ Blocked` · `❌ Dropped`

---

## Phase 0 — Foundation (Week 0–1)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Monorepo scaffold (pnpm workspaces) | Tech Lead | 🔲 | |
| Next.js 15 + Tailwind + Shadcn/UI setup | Dev | 🔲 | |
| Supabase project creation (dev + staging) | Tech Lead | 🔲 | |
| Prisma init + connect to Supabase | Dev | 🔲 | |
| Migration 001: clinics + users | Dev | 🔲 | |
| OTP login flow (end-to-end) | Dev | 🔲 | |
| Role-aware sidebar layout | Dev | 🔲 | |
| CI pipeline (GitHub Actions) | Tech Lead | 🔲 | |
| Vercel projects (staging + prod) | Tech Lead | 🔲 | |
| README with local setup ≤ 10 steps | Dev | 🔲 | |
| WATI account registration | PM | 🔲 | Submit templates W0 |
| Razorpay test account | PM | 🔲 | |
| Firebase project + FCM | Dev | 🔲 | |

**Phase 0 Exit:** `🔲 Not reached`

---

## Sprint 1 — Auth + Patient + EMR (Week 2–3) · 18 SP

| Story | SP | Owner | Status | Notes |
|-------|----|-------|--------|-------|
| US-01-01 Staff Account Creation | 3 | Dev | 🔲 | |
| US-01-02 Role-Based Navigation | 3 | Dev | 🔲 | |
| US-01-03 OTP Login | 2 | Dev | 🔲 | |
| US-01-04 Deactivate Staff Account | 2 | Dev | 🔲 | |
| US-01-05 Audit Log | 3 | Dev | 🔲 | |
| US-02-01 New Patient Registration | 5 | Dev | 🔲 | |
| **Sprint 1 Total** | **18** | | 🔲 | |

**Sprint 1 Demo:** `🔲 Scheduled: end of Week 3`

---

## Sprint 2 — Appointments + Queue (Week 4–5) · 19 SP

| Story | SP | Owner | Status | Notes |
|-------|----|-------|--------|-------|
| US-02-07 Patient Search | 3 | Dev | 🔲 | |
| US-02-08 Vitals | 3 | Dev | 🔲 | |
| US-03-01 Book Appointment | 5 | Dev | 🔲 | |
| US-03-02 Reschedule & Cancel | 3 | Dev | 🔲 | |
| US-03-03 Token / Queue | 5 | Dev | 🔲 | |
| **Sprint 2 Total** | **19** | | 🔲 | |

---

## Sprint 3 — Clinical + Prescription (Week 6–7) · 22 SP

| Story | SP | Owner | Status | Notes |
|-------|----|-------|--------|-------|
| US-02-02 Constitutional Profile | 5 | Dev | 🔲 | |
| US-02-03 Case History | 8 | Dev | 🔲 | |
| US-02-04 Follow-Up Visit | 5 | Dev | 🔲 | |
| US-04-01 Prescription Writing | 8 | Dev | 🔲 | |
| US-04-02 Disease Templates | 5 | Dev | 🔲 | |
| US-04-03 Prescription PDF + WA | 5 | Dev | 🔲 | |
| US-02-05 Improvement Score | 5 | Dev | 🔲 | |
| US-02-06 Remedy History | 5 | Dev | 🔲 | |
| US-04-08 Medical Certificate | 3 | Dev | 🔲 | |
| **Sprint 3 Total** | **22** | | 🔲 | |

---

## Sprint 4 — Inventory + Billing (Week 8–9) · 39 SP

| Story | SP | Owner | Status | Notes |
|-------|----|-------|--------|-------|
| US-05-01 Medicine Inventory | 5 | Dev | 🔲 | |
| US-05-02 Vendor Management | 3 | Dev | 🔲 | |
| US-05-03 Purchase Records | 5 | Dev | 🔲 | |
| US-05-04 Dispense Medicines | 5 | Dev | 🔲 | |
| US-06-01 Create Invoice | 5 | Dev | 🔲 | |
| US-06-02 Package Plans | 8 | Dev | 🔲 | |
| US-06-03 Receipt + WhatsApp | 5 | Dev | 🔲 | |
| US-06-04 Outstanding Dues | 3 | Dev | 🔲 | |
| **Sprint 4 Total** | **39** | | 🔲 | |

---

## Sprint 5 — WhatsApp Integration (Week 10–11) · 16 SP

| Story | SP | Owner | Status | Notes |
|-------|----|-------|--------|-------|
| US-07-01 Appointment Confirmation | 3 | Dev | 🔲 | Needs WATI approval |
| US-07-02 24hr Reminder | 3 | Dev | 🔲 | |
| US-07-03 You Are Next | 2 | Dev | 🔲 | |
| US-07-05 Follow-Up D-2/D-0 | 3 | Dev | 🔲 | |
| US-07-08 Receipt via WA | 2 | Dev | 🔲 | |
| WA Webhook handler | 3 | Dev | 🔲 | |
| **Sprint 5 Total** | **16** | | 🔲 | |

---

## Sprint 6 — MVP Hardening (Week 12–13)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Full regression test pass | QA | 🔲 | |
| Fix P0 bugs | Dev | 🔲 | |
| Lighthouse ≥ 85 | Dev | 🔲 | |
| Core Web Vitals pass | Dev | 🔲 | |
| Sentry integration | Dev | 🔲 | |
| OWASP Top 10 review | Tech Lead | 🔲 | |
| Seed script | Dev | 🔲 | |
| UAT with clinic staff | PM + QA | 🔲 | On-site 1 day |
| Staging deployment | Dev | 🔲 | |
| Production go-live | Tech Lead | 🔲 | |

**CHECKPOINT 1 (MVP):** `🔲 Target: End of Week 13`

---

## Sprint 7 — Diet/Yoga + Lead CRM (Week 14–15) · 32 SP

| Story | SP | Owner | Status |
|-------|----|-------|--------|
| US-09-01 Diet Chart Builder | 5 | Dev | 🔲 |
| US-09-02 Yoga Library | 8 | Dev | 🔲 |
| US-09-03 Admin Content Mgmt | 3 | Dev | 🔲 |
| US-08-01 Lead Capture | 5 | Dev | 🔲 |
| US-08-02 Lead Pipeline Kanban | 5 | Dev | 🔲 |
| US-08-03 Lead Conversion | 3 | Dev | 🔲 |
| US-08-04 Lead Analytics | 3 | Dev | 🔲 |

---

## Sprint 8 — Follow-Up Escalation + Booking Widget (Week 16–17) · 27 SP

| Story | SP | Owner | Status |
|-------|----|-------|--------|
| US-10-01 Set Follow-Up Date | 2 | Dev | 🔲 |
| US-10-02 Overdue Dashboard | 3 | Dev | 🔲 |
| US-10-03 Escalation Reminder | 3 | Dev | 🔲 |
| US-13-01 Booking Widget | 8 | Dev | 🔲 |
| US-13-02 Widget Config | 3 | Dev | 🔲 |

---

## Sprint 9 — WhatsApp Inbox + Financial Reports (Week 18–19) · 34 SP

| Story | SP | Owner | Status |
|-------|----|-------|--------|
| US-07-09 Broadcast Campaign | 8 | Dev | 🔲 |
| US-07-10 Two-Way Inbox | 8 | Dev | 🔲 |
| US-07-06 Birthday Wishes | 2 | Dev | 🔲 |
| US-07-07 Refill Reminder | 3 | Dev | 🔲 |
| US-11-01 Daily Expenses | 3 | Dev | 🔲 |
| US-11-02 Income Summary | 3 | Dev | 🔲 |
| US-11-03 Monthly P&L | 5 | Dev | 🔲 |
| US-11-04 Vendor Spend | 3 | Dev | 🔲 |

---

## Sprint 10 — Push Notifications + Mobile App (Week 20–21) · 27 SP

| Story | SP | Owner | Status |
|-------|----|-------|--------|
| US-14-01 Push Notifications | 5 | Dev | 🔲 |
| Mobile: auth + dashboard | 8 | Dev | 🔲 |
| Mobile: patients + appointments | 8 | Dev | 🔲 |
| v1.1 bug fixes + polish | 6 | Dev | 🔲 |

**CHECKPOINT 2 (v1.1):** `🔲 Target: End of Week 21`

---

## Sprint 11 — Repertorization + Materia Medica (Week 22–24) · 18 SP

| Story | SP | Owner | Status |
|-------|----|-------|--------|
| US-04-05 Repertorization Engine | 13 | Dev | 🔲 |
| US-04-06 Materia Medica Reference | 5 | Dev | 🔲 |

---

## Sprint 12 — Miasmatic Analysis + Analytics (Week 25–26) · 23 SP

| Story | SP | Owner | Status |
|-------|----|-------|--------|
| US-04-07 Miasmatic Analysis | 5 | Dev | 🔲 |
| US-12-01 Admin Dashboard | 8 | Dev | 🔲 |
| US-12-02 Patient Analytics | 5 | Dev | 🔲 |
| US-12-03 Appointment Analytics | 5 | Dev | 🔲 |

---

## Sprint 13 — GST + ABDM + Containerisation (Week 27–28) · 13 SP

| Story | SP | Owner | Status |
|-------|----|-------|--------|
| US-11-05 GST Report | 5 | Dev | 🔲 |
| ABDM stubs + feature flag | 3 | Dev | 🔲 |
| Dockerise application | 3 | Dev | 🔲 |
| Redis caching for reports | 2 | Dev | 🔲 |

**CHECKPOINT 3 (v1.2):** `🔲 Target: End of Week 28`
