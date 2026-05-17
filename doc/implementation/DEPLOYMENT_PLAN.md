# DrMan.ai — Deployment Plan
**Role:** Expert Software Engineer & Architect  
**Version:** 1.0 | **Date:** 2026-05-16

---

## Table of Contents
1. [Environment Strategy](#1-environment-strategy)
2. [Infrastructure Architecture](#2-infrastructure-architecture)
3. [CI/CD Pipeline](#4-cicd-pipeline)
4. [Environment Configuration](#5-environment-configuration)
5. [Database Migration Strategy](#6-database-migration-strategy)
6. [Release Process](#7-release-process)
7. [Monitoring & Observability](#8-monitoring--observability)
8. [Backup & Recovery](#9-backup--recovery)
9. [Scaling Plan](#10-scaling-plan)
10. [Rollback Procedures](#11-rollback-procedures)
11. [Go-Live Checklist](#12-go-live-checklist)

---

## 1. Environment Strategy

Three permanent environments, each fully isolated (separate Supabase projects, separate Vercel projects, separate WATI credentials where possible).

```
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL DEV                                                      │
│  Developer machine                                              │
│  • Next.js dev server (port 3000)                               │
│  • Supabase local via Docker (supabase start)                   │
│  • .env.local with DEV keys                                     │
│  • WhatsApp: WATI sandbox / mock                                │
│  • Payments: Razorpay test mode                                 │
└─────────────────────────────────────────────────────────────────┘
            │  git push → opens PR
            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGING (preview.drman.ai)                                     │
│  Vercel preview deployment (auto-created per PR)                │
│  • Supabase STAGING project (separate from prod)                │
│  • Seeded with anonymised test data                             │
│  • WhatsApp: WATI sandbox number                                │
│  • Payments: Razorpay test mode                                 │
│  • Used for: QA testing, UAT, stakeholder demos                 │
└─────────────────────────────────────────────────────────────────┘
            │  PR merged to main → staging auto-deploys
            ▼  manual promote after Checkpoint sign-off
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION (app.drman.ai)                                      │
│  Vercel production deployment                                   │
│  • Supabase PROD project (ap-south-1 region — Mumbai)           │
│  • WhatsApp: WATI production number (verified business)         │
│  • Payments: Razorpay live mode                                 │
│  • Real patient data; DPDP Act compliance active                │
└─────────────────────────────────────────────────────────────────┘
```

### Environment-specific feature flags
Use `NEXT_PUBLIC_FEATURE_*` env vars to gate unreleased features:
```bash
NEXT_PUBLIC_FEATURE_REPERTORIZATION=false   # enabled in v1.2
NEXT_PUBLIC_FEATURE_ABDM=false              # enabled in v2.0
NEXT_PUBLIC_FEATURE_AI=false                # enabled in v3.0
```

---

## 2. Infrastructure Architecture

### 2.1 Web Application — Vercel

```
DNS (Cloudflare)
    │
    ▼
Vercel Edge Network (CDN + SSL termination)
    │
    ├── Static assets (JS/CSS/images) → Edge Cache
    ├── Next.js Server Components → Vercel Serverless Functions (ap-south-1)
    ├── Next.js API Routes → Vercel Serverless Functions (ap-south-1)
    └── Vercel Cron Jobs → Background worker API routes
```

**Vercel configuration (`vercel.json`):**
```json
{
  "regions": ["bom1"],
  "crons": [
    { "path": "/api/jobs/appointment-reminders", "schedule": "*/30 * * * *" },
    { "path": "/api/jobs/followup-reminders",    "schedule": "0 9 * * *"    },
    { "path": "/api/jobs/birthday-wishes",        "schedule": "0 8 * * *"    },
    { "path": "/api/jobs/refill-reminders",       "schedule": "0 10 * * *"   },
    { "path": "/api/jobs/low-stock-check",        "schedule": "0 8 * * *"    },
    { "path": "/api/jobs/monthly-report",         "schedule": "0 7 1 * *"    },
    { "path": "/api/jobs/followup-escalation",    "schedule": "0 11 * * *"   }
  ]
}
```

### 2.2 Database — Supabase (PostgreSQL 15)

| Resource | Dev | Staging | Production |
|----------|-----|---------|-----------|
| Plan | Free | Pro ($25/mo) | Pro ($25/mo) or Team |
| Region | Local Docker | ap-south-1 (Mumbai) | ap-south-1 (Mumbai) |
| Compute | Local | Small (2 vCPU, 1 GB) | Medium (2 vCPU, 4 GB) |
| Storage | Local | 8 GB | 50 GB |
| Backups | None | Daily (7-day) | Daily (30-day) + PITR |
| Realtime | Local | Enabled | Enabled |
| Connection pool | None | Supabase Pooler (Transaction mode) | Supabase Pooler (Transaction mode) |

**Connection string in Next.js API routes:**
- Use **Transaction mode** pooler URL for serverless functions (prevents connection exhaustion)
- Use **Session mode** pooler URL for migrations (Prisma migrate)

### 2.3 File Storage — Supabase Storage

| Bucket | Access | Max file size | Purpose |
|--------|--------|--------------|---------|
| `prescriptions` | Private (service role only) | 10 MB | Prescription PDFs |
| `receipts` | Private | 5 MB | Receipt/invoice PDFs |
| `documents` | Private | 20 MB | Patient uploaded reports |
| `avatars` | Public | 2 MB | Staff and patient photos |
| `yoga-images` | Public | 2 MB | Yoga asana photos |

**Signed URL policy:** Private bucket files served via 1-hour signed URLs generated server-side.

### 2.4 Background Workers
- **Phase 1:** Vercel Cron Jobs (sufficient for MVP — up to 20 cron invocations/day on Pro)
- **Phase 2+:** Migrate heavy jobs (campaign broadcast, PDF batch generation) to **BullMQ + Redis** on Fly.io if Vercel timeout (60s) is insufficient
- Worker server on Fly.io: `fly.toml` config, `workers/` directory, auto-scale to 0 when idle

### 2.5 Domain & DNS (Cloudflare)

| Subdomain | Points to | Purpose |
|-----------|-----------|---------|
| `app.drman.ai` | Vercel production | Main web app |
| `preview.drman.ai` | Vercel staging | UAT / demos |
| `api.drman.ai` | (alias for app.drman.ai/api) | API base URL |
| `book.drman.ai` | Vercel production `/book` | Public booking widget page |

---

## 3. CI/CD Pipeline

### 3.1 Pipeline Overview

```
Developer → git push → GitHub PR
                         │
              ┌──────────▼──────────┐
              │  CI: Pull Request   │
              │  (every PR push)    │
              │                     │
              │  1. lint-and-types  │  ← 2 min
              │  2. unit-tests      │  ← 3 min
              │  3. build           │  ← 4 min
              │  4. integration-tests│ ← 6 min (Supabase local)
              │  5. e2e-tests (PR)  │  ← 10 min (Playwright, smoke only)
              └──────────┬──────────┘
                         │ all green
                         ▼
              PR Review (1 approval required)
                         │ merged to main
              ┌──────────▼──────────┐
              │  CD: Staging        │
              │  (on merge to main) │
              │                     │
              │  1. build           │
              │  2. migrate staging │  ← prisma migrate deploy
              │  3. deploy staging  │  ← Vercel preview
              │  4. e2e full suite  │  ← Playwright full
              │  5. notify team     │  ← Slack/email
              └──────────┬──────────┘
                         │ manual trigger (after QA sign-off)
              ┌──────────▼──────────┐
              │  CD: Production     │
              │  (manual promote)   │
              │                     │
              │  1. create git tag  │  ← vX.Y.Z
              │  2. migrate prod DB │  ← prisma migrate deploy (prod)
              │  3. deploy prod     │  ← Vercel production
              │  4. smoke tests     │  ← Playwright smoke (prod URL)
              │  5. notify team     │
              └─────────────────────┘
```

### 3.2 GitHub Actions Workflows

**`.github/workflows/ci.yml`**
```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit --coverage
      - uses: codecov/codecov-action@v4

  integration-tests:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate:test
      - run: pnpm test:integration
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/drman_test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
```

**`.github/workflows/deploy-staging.yml`**
```yaml
name: Deploy Staging
on:
  push:
    branches: [main]

jobs:
  migrate-and-deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - name: Run DB migrations (staging)
        run: pnpm db:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      - name: Deploy to Vercel (staging)
        run: pnpm vercel --token ${{ secrets.VERCEL_TOKEN }} --env staging
      - name: Run E2E smoke tests
        run: pnpm test:e2e:smoke
        env:
          BASE_URL: https://preview.drman.ai
      - name: Notify Slack
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"✅ Staging deployed: ${{ github.sha }}"}'
```

**`.github/workflows/deploy-production.yml`**
```yaml
name: Deploy Production
on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "deploy" to confirm production release'
        required: true

jobs:
  production-deploy:
    if: ${{ github.event.inputs.confirm == 'deploy' }}
    runs-on: ubuntu-latest
    environment: production   # requires manual approval in GitHub Environments
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - name: Tag release
        run: |
          git tag v$(node -p "require('./package.json').version")
          git push origin --tags
      - name: Run DB migrations (production)
        run: pnpm db:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
      - name: Deploy to Vercel (production)
        run: pnpm vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
      - name: Smoke tests (production)
        run: pnpm test:e2e:smoke
        env:
          BASE_URL: https://app.drman.ai
```

---

## 4. Environment Configuration

### 4.1 Secrets Management

All secrets stored in **GitHub Environments** (not in code, not in `.env` committed to repo):

```
GitHub Environments:
├── staging
│   ├── STAGING_SUPABASE_URL
│   ├── STAGING_SUPABASE_ANON_KEY
│   ├── STAGING_SUPABASE_SERVICE_ROLE_KEY
│   ├── STAGING_DATABASE_URL         (Prisma direct connection)
│   ├── STAGING_WATI_API_ENDPOINT
│   ├── STAGING_WATI_API_TOKEN
│   ├── STAGING_RAZORPAY_KEY_ID
│   ├── STAGING_RAZORPAY_KEY_SECRET
│   └── ...
└── production
    ├── PROD_SUPABASE_URL
    ├── PROD_SUPABASE_ANON_KEY
    ├── PROD_SUPABASE_SERVICE_ROLE_KEY
    ├── PROD_DATABASE_URL
    ├── PROD_WATI_API_ENDPOINT
    ├── PROD_WATI_API_TOKEN
    ├── PROD_RAZORPAY_KEY_ID
    ├── PROD_RAZORPAY_KEY_SECRET
    └── ...
```

**Local development:** Developers copy `.env.example` to `.env.local` and fill in dev keys. `.env.local` is gitignored.

### 4.2 `.env.example` (committed to repo)
```bash
# ── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                          # Prisma: direct connection (migrations)
DATABASE_URL_POOL=                     # Prisma: pooler (runtime queries)

# ── WhatsApp (WATI) ───────────────────────────────────────
WATI_API_ENDPOINT=
WATI_API_TOKEN=
WHATSAPP_WEBHOOK_SECRET=

# ── Payments ──────────────────────────────────────────────
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# ── PDF Generation ────────────────────────────────────────
PUPPETEER_EXECUTABLE_PATH=             # leave blank locally; set in prod

# ── Push Notifications ────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_SERVICE_ACCOUNT=        # JSON stringified (server-side FCM)

# ── Email (Resend) ────────────────────────────────────────
RESEND_API_KEY=

# ── Analytics ─────────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ── Error Tracking ────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=                     # for source map upload

# ── App ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BOOKING_WIDGET_ORIGIN=http://localhost:3000

# ── Feature Flags ─────────────────────────────────────────
NEXT_PUBLIC_FEATURE_REPERTORIZATION=false
NEXT_PUBLIC_FEATURE_ABDM=false
NEXT_PUBLIC_FEATURE_AI=false
```

---

## 5. Database Migration Strategy

### 5.1 Migration Workflow (Prisma)

```bash
# 1. Developer modifies prisma/schema.prisma
# 2. Generate migration file (never edit generated SQL)
pnpm db:migrate:dev --name add_improvement_score_to_visits

# 3. Generated file: prisma/migrations/20260517_add_improvement_score/migration.sql
# 4. Commit migration file alongside feature code in the same PR
# 5. CI runs prisma migrate deploy on staging (non-destructive only)
# 6. Production migration runs as part of deploy workflow (manual trigger)
```

### 5.2 Migration Rules
- **Always additive in a single migration:** Add columns with a default value, never remove or rename in the same migration that adds a new column
- **Multi-step destructive changes:**
  1. Deploy 1: Add new column (nullable); write data to both old + new
  2. Deploy 2: Backfill old rows; switch reads to new column
  3. Deploy 3: Remove old column (once Deploy 2 verified stable for ≥ 1 week)
- **Never run `migrate reset` on staging once it has real UAT data** — use `migrate deploy` only
- **Seed data** is in `supabase/seed.sql`; run manually on fresh staging setup only

### 5.3 Migration File Naming
```
prisma/migrations/
├── 20260517000000_init_clinics_users/
├── 20260518000000_patients_case_history/
├── 20260520000000_appointments_blocked_slots/
├── 20260522000000_visits_vitals/
├── 20260524000000_prescriptions/
├── 20260526000000_inventory_vendors/
├── 20260528000000_invoices_packages/
└── ...
```

### 5.4 Emergency Schema Rollback
- Prisma does not auto-rollback; maintain a `down.sql` file alongside each migration for manual reversal
- If a migration causes a production incident, apply `down.sql` via Supabase SQL editor, then hotfix the application

---

## 6. Release Process

### 6.1 Versioning
Semantic versioning: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking change or new phase (v1→v2)
- MINOR: New feature sprint (v1.0→v1.1)
- PATCH: Bug fix or hotfix (v1.1.0→v1.1.1)

### 6.2 Release Cadence
| Release type | Frequency | Process |
|-------------|-----------|---------|
| Feature release | End of each sprint (2 weeks) | Full pipeline → manual prod promotion |
| Hotfix | As needed | Fast-track: `hotfix/*` branch → PR → deploy without waiting for sprint |
| Patch | Weekly if needed | Same as feature release |

### 6.3 Release Checklist (before every production deploy)
```
Pre-deploy:
[ ] All CI checks green on the release commit
[ ] QA sign-off on staging (Checkpoint document signed)
[ ] DB migrations reviewed — no destructive changes without rollback plan
[ ] New env vars added to Vercel production environment
[ ] New WhatsApp templates submitted and approved (if any)
[ ] Razorpay webhooks updated (if payment flow changed)
[ ] WATI webhook URL updated (if changed)
[ ] Feature flags set correctly for production
[ ] Sentry release created (source maps uploaded)
[ ] Release notes written in CHANGELOG.md

Deploy:
[ ] Trigger production deploy workflow (manual, requires "deploy" confirmation)
[ ] Monitor Sentry for new errors for 30 minutes post-deploy
[ ] Monitor Vercel function logs for 500 errors
[ ] Verify critical flows manually: login, book appointment, send prescription

Post-deploy:
[ ] Notify clinic admin via WhatsApp/email with what's new
[ ] Update CHANGELOG.md and tag on GitHub
[ ] Close deployed GitHub Issues
```

---

## 7. Monitoring & Observability

### 7.1 Error Tracking — Sentry
```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,       // 10% of transactions
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Scrub PHI from error payloads before sending to Sentry
    if (event.request?.data) {
      delete event.request.data.phone
      delete event.request.data.full_name
    }
    return event
  },
})
```

**Alert rules (configured in Sentry):**
| Alert | Threshold | Channel |
|-------|-----------|---------|
| Error spike | > 10 new errors/min | Email + Slack |
| P0 error (payment/auth failure) | Any occurrence | Immediate SMS to Tech Lead |
| Cron job failure | Any job fails | Email |

### 7.2 Product Analytics — PostHog
Events to track:
```typescript
posthog.capture('appointment_booked',   { source, type, doctor_id })
posthog.capture('prescription_sent',    { via: 'whatsapp' | 'pdf' })
posthog.capture('invoice_created',      { amount, payment_mode })
posthog.capture('lead_converted',       { source })
posthog.capture('patient_registered',   { channel: 'staff' | 'widget' })
posthog.capture('whatsapp_sent',        { template_name })
```
**Note:** Never capture PHI (no names, phones, or medical data) in PostHog events.

### 7.3 Uptime Monitoring — Better Uptime / UptimeRobot
| Endpoint | Check interval | Alert if down |
|----------|---------------|--------------|
| `https://app.drman.ai` | 1 min | > 2 min |
| `https://app.drman.ai/api/health` | 1 min | > 1 min |
| `https://app.drman.ai/book` | 5 min | > 5 min |

**`/api/health` endpoint** returns:
```json
{
  "status": "ok",
  "db": "connected",
  "version": "1.1.0",
  "timestamp": "2026-05-16T10:00:00Z"
}
```

### 7.4 Database Monitoring — Supabase Dashboard
- Enable **pg_stat_statements** extension to identify slow queries
- Alert on: connection pool usage > 80%, disk usage > 70%, replication lag > 10s
- Weekly review of slow query log; add indexes as needed

### 7.5 Logging
- Application logs: Vercel function logs (7-day retention on Pro plan)
- Structured logging via `pino` (JSON format, includes `clinic_id`, `user_id`, `request_id` — no PHI)
- Audit log: immutable PostgreSQL table (see `DATABASE_SCHEMA.md`)

---

## 8. Backup & Recovery

### 8.1 Database Backups

| Environment | Frequency | Retention | Type |
|-------------|-----------|-----------|------|
| Production | Daily 2 AM IST | 30 days | Supabase managed snapshots |
| Production | Continuous | 7 days | Point-in-Time Recovery (PITR) |
| Staging | Daily | 7 days | Supabase managed |

**Additional manual backup before every production deploy:**
```bash
# Export before deploy (run via GitHub Action pre-deploy step)
pg_dump $PROD_DATABASE_URL \
  --format=custom \
  --file=backups/pre-deploy-$(date +%Y%m%d-%H%M%S).dump
# Upload to Supabase Storage bucket 'backups' (private)
```

### 8.2 File Storage Backups
- Supabase Storage files are replicated within the region
- Critical PDFs (prescriptions, invoices): additional copy synced to AWS S3 `ap-south-1` bucket via nightly script

### 8.3 Recovery Time Objectives

| Scenario | RTO | RPO | Recovery Method |
|----------|-----|-----|-----------------|
| Vercel deployment rollback | 5 min | 0 | Vercel one-click rollback to previous deployment |
| API bug (no data loss) | 15 min | 0 | Redeploy previous git tag |
| DB migration gone wrong | 30 min | < 5 min | Apply `down.sql`; redeploy previous version |
| Data corruption (partial) | 2 hours | < 24 hours | PITR restore to last known good state |
| Complete data loss | 4 hours | < 24 hours | Restore from daily snapshot + replay WAL |
| Supabase region outage | 30 min | varies | Fail over to read replica (v2.0 feature) |

---

## 9. Scaling Plan

### 9.1 Phase 1 (MVP — 1 clinic, ≤ 500 appts/day)
- **Vercel Pro:** Auto-scales serverless functions; no action needed
- **Supabase Pro:** Medium compute handles ~500 concurrent connections via pooler
- **Expected peak load:** ~50 concurrent users during busy clinic hours (9 AM–1 PM IST)

### 9.2 Phase 2 (v1.1 — 1–5 clinics)
- Evaluate Supabase compute upgrade (Large: 4 vCPU, 16 GB) if DB CPU > 70% during peak
- Add Redis (Upstash) for session caching and rate limiting
- Move broadcast campaigns to BullMQ queue to avoid Vercel cron timeout

### 9.3 Phase 3 (v2.0 — Multi-tenant SaaS, 50+ clinics)
- Migrate to **NestJS** microservices on **AWS ECS Fargate** (or Fly.io)
- Separate databases per tenant (Supabase organisations) OR logical separation via `clinic_id` RLS (evaluate based on compliance requirements)
- Add **read replicas** for analytics queries
- CDN for static assets via Cloudflare R2
- Global rate limiting via Cloudflare Workers

### 9.4 Capacity Estimates

| Metric | MVP (1 clinic) | v2.0 (50 clinics) |
|--------|----------------|------------------|
| Daily API calls | ~5,000 | ~250,000 |
| DB rows/month | ~10,000 | ~500,000 |
| WhatsApp msgs/day | ~200 | ~10,000 |
| Storage/month | ~2 GB | ~100 GB |
| Estimated infra cost | $50/mo | $800/mo |

---

## 10. Rollback Procedures

### 10.1 Application Rollback (No DB Change)
```bash
# Option A: Vercel dashboard → Deployments → click previous deployment → "Promote to Production"
# Time: < 5 minutes

# Option B: GitHub Actions
git revert HEAD --no-edit
git push origin main
# Triggers full deploy pipeline; production updated in ~10 minutes
```

### 10.2 Application Rollback (With DB Migration)
```bash
# Step 1: Roll back application to previous version (as above)
# Step 2: Apply migration down script manually
# (Connect to prod DB via Supabase SQL editor or psql)
\i prisma/migrations/YYYYMMDD_migration_name/down.sql

# Step 3: Verify application works with rolled-back schema
# Step 4: Remove migration record from _prisma_migrations table
DELETE FROM _prisma_migrations WHERE migration_name = 'YYYYMMDD_migration_name';
```

### 10.3 Data Corruption Rollback (PITR)
```
1. Identify exact timestamp of last known good state
2. In Supabase dashboard → Settings → Database → Point in Time Recovery
3. Create new Supabase project from PITR backup
4. Update DATABASE_URL env vars to point to restored project
5. Redeploy application
6. Verify data integrity
7. Communicate downtime to clinic admin
```

### 10.4 Hotfix Process
```
main branch (production)
    │
    ├── git checkout -b hotfix/fix-invoice-total
    │         (branch from main, NOT from develop)
    │
    ├── Fix the bug + write regression test
    │
    ├── Open PR → fast-track review (1 approval, < 2 hours)
    │
    ├── Merge to main → auto-deploys to staging
    │
    ├── QA verifies fix on staging (30 min)
    │
    └── Manual production deploy
```

---

## 11. Go-Live Checklist

### Pre-Go-Live (1 week before)
```
Infrastructure:
[ ] Production Supabase project created (ap-south-1 region)
[ ] All DB migrations applied to prod; RLS policies verified
[ ] All environment variables set in Vercel production
[ ] Custom domain configured (app.drman.ai + SSL)
[ ] Cloudflare DNS configured with proxy enabled
[ ] Supabase Auth: production phone OTP provider configured
[ ] Storage buckets created with correct public/private policies

Integrations:
[ ] WATI production WhatsApp number verified
[ ] All 8 WhatsApp templates approved by Meta
[ ] WATI webhook URL set to https://app.drman.ai/api/whatsapp/webhook
[ ] Razorpay live mode enabled; webhook configured
[ ] Firebase production project; FCM enabled; service account key set
[ ] Sentry production environment configured; source maps uploaded
[ ] PostHog production API key configured

Security:
[ ] OWASP Top 10 review completed and signed off
[ ] DPDP Act consent flow reviewed and approved
[ ] Rate limiting on /api/auth/* routes (5 req/min per IP)
[ ] All secrets rotated from staging values to production values
[ ] Supabase RLS policies tested with production roles

Data:
[ ] Existing patient data migrated (if any) via CSV import
[ ] Admin user account created for clinic owner
[ ] Clinic profile (name, address, logo, GSTIN) configured
[ ] Doctor accounts created and tested
[ ] Receptionist accounts created and tested
[ ] At least 5 disease templates pre-loaded
[ ] Yoga asana library seeded (60+ asanas)
[ ] Diet templates seeded (9+ templates)

Monitoring:
[ ] Sentry alerts configured
[ ] Uptime monitor configured (app.drman.ai + /api/health)
[ ] Supabase DB alerts configured (CPU, connections, disk)
[ ] On-call rotation documented (who responds to P0 alerts)

Testing:
[ ] Full E2E test suite passes on production URL (pre-launch)
[ ] Tech Lead manually runs 3 complete patient journeys on production
[ ] Clinic staff UAT sign-off obtained
```

### Go-Live Day
```
09:00 AM  - Deploy to production (trigger GitHub Action)
09:10 AM  - Monitor Sentry for 30 minutes (zero new errors expected)
09:30 AM  - Clinic staff log in and run first live appointment booking
10:00 AM  - First patient registered on production system
12:00 PM  - First prescription PDF sent via WhatsApp
06:00 PM  - End of day: review Supabase metrics, PostHog events, Sentry errors
```

### Post-Go-Live Support (Week 1)
- Tech Lead available on call during clinic hours (9 AM – 7 PM IST)
- WhatsApp support group for clinic staff issues
- Daily 15-min check-in with clinic owner
- Any P0 bugs hotfixed within 4 hours
- Any P1 bugs hotfixed within 24 hours
- Daily deployment allowed (no change freeze in first 2 weeks)
