# DrMan.ai — System Architecture

**Version:** 1.0 | **Date:** 2026-05-16

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│   ┌──────────────────────┐       ┌──────────────────────────────┐  │
│   │   Web App (Next.js)  │       │  Mobile App (React Native /  │  │
│   │   Desktop + Tablet   │       │  Expo PWA)  iOS + Android    │  │
│   └──────────┬───────────┘       └──────────────┬───────────────┘  │
└──────────────┼──────────────────────────────────┼───────────────────┘
               │  HTTPS / REST + WS               │
┌──────────────▼──────────────────────────────────▼───────────────────┐
│                          API LAYER (Next.js App Router)             │
│                                                                     │
│   /api/auth        /api/patients      /api/appointments             │
│   /api/prescriptions  /api/billing    /api/inventory                │
│   /api/leads       /api/finance       /api/whatsapp                 │
│   /api/reports     /api/users         /api/content                  │
│                                                                     │
│   Middleware: Auth Guard → Role Check → Rate Limit → Handler        │
└──────────────┬──────────────────────────────────────────────────────┘
               │
       ┌───────┴──────────────────────────────────┐
       │                                          │
┌──────▼──────────┐                    ┌──────────▼────────────┐
│  Supabase       │                    │  Background Workers   │
│  - PostgreSQL   │                    │  (Fly.io / Vercel     │
│  - Auth (OTP)   │                    │   Edge Functions)     │
│  - Storage      │                    │                       │
│  - Realtime     │                    │  - Follow-up reminders│
│    (websockets) │                    │  - Appointment alerts │
└──────┬──────────┘                    │  - Campaign broadcasts│
       │                               │  - Report generation  │
       │                               └──────────┬────────────┘
       │                                          │
┌──────▼──────────────────────────────────────────▼────────────┐
│                      EXTERNAL SERVICES                        │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ WATI /      │  │  Razorpay    │  │  Resend (email)     │  │
│  │ AiSensy     │  │  (Payments)  │  │  (Staff alerts)     │  │
│  │ WhatsApp    │  └──────────────┘  └─────────────────────┘  │
│  │ Business    │                                              │
│  │ API (BSP)   │  ┌──────────────┐  ┌─────────────────────┐  │
│  └─────────────┘  │  Puppeteer / │  │  PostHog            │  │
│                   │  React-PDF   │  │  (Analytics)        │  │
│                   │  (PDFs)      │  └─────────────────────┘  │
│                   └──────────────┘                           │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (Next.js 15)

```
src/
├── app/                          # App Router
│   ├── (auth)/
│   │   └── login/                # OTP login page
│   ├── (dashboard)/              # Protected layout (role-aware sidebar)
│   │   ├── layout.tsx            # Auth check + role context
│   │   ├── dashboard/            # Home dashboard (role-specific)
│   │   ├── patients/
│   │   │   ├── page.tsx          # Patient list
│   │   │   ├── new/page.tsx      # Register patient
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Patient profile
│   │   │       ├── visits/       # Visit history
│   │   │       └── prescription/ # Prescription writer
│   │   ├── appointments/
│   │   ├── billing/
│   │   ├── inventory/
│   │   ├── leads/
│   │   ├── whatsapp/             # Inbox
│   │   ├── finance/
│   │   ├── reports/
│   │   └── settings/
│   ├── book/                     # Public booking widget (no auth)
│   └── api/                      # API route handlers
├── components/
│   ├── ui/                       # Shadcn base components
│   ├── shared/                   # App-wide (Navbar, Sidebar, Modal)
│   ├── patients/                 # Patient-specific components
│   ├── appointments/
│   ├── prescription/
│   ├── billing/
│   └── whatsapp/
├── lib/
│   ├── supabase/                 # Supabase client (server + browser)
│   ├── whatsapp/                 # WATI API wrapper
│   ├── pdf/                      # PDF generation helpers
│   ├── permissions.ts            # RBAC helper
│   └── validations/              # Zod schemas
├── hooks/                        # Custom React hooks
├── store/                        # Zustand global state
└── types/                        # TypeScript interfaces
```

---

## 3. Data Flow — Appointment Booking

```
Patient (Website Widget)
        │
        ▼
POST /api/appointments/public
        │ validate slot availability
        ▼
DB: appointments (status=pending_confirmation)
        │
        ▼
Realtime event → Receptionist dashboard notification
        │
Receptionist confirms
        │
        ▼
DB: status=confirmed
        │
        ├──► WhatsApp Confirmation (WATI API)
        └──► Scheduler: queue 24-hr reminder job
```

---

## 4. Data Flow — Prescription to WhatsApp

```
Doctor fills prescription form
        │
        ▼
POST /api/prescriptions
        │ saves to DB
        ▼
POST /api/pdf/prescription?id=xxx
        │ Puppeteer renders HTML → PDF
        ▼
Storage: supabase/prescriptions/{patientId}/{visitId}.pdf
        │
        ▼
POST /api/whatsapp/send
        │ WATI: document message with PDF URL
        ▼
Patient receives PDF on WhatsApp
        │
Delivery webhook → DB: message_status=delivered/read
```

---

## 5. Realtime Features (Supabase Realtime)

| Feature | Channel | Trigger |
|---------|---------|---------|
| Queue board updates | `queue:{clinicId}` | Token status change |
| New appointment notification | `appointments:{userId}` | INSERT on appointments |
| Low stock alert | `alerts:{clinicId}` | inventory qty < reorder_level |
| New lead notification | `leads:{clinicId}` | INSERT on leads |
| WhatsApp message received | `whatsapp:{clinicId}` | Webhook → DB insert |

---

## 6. Background Job Architecture

Jobs run as Vercel Cron (or Fly.io workers for heavy tasks):

| Job | Schedule | Description |
|-----|----------|-------------|
| `send-appointment-reminders` | Every 30 min | Find appts in next 24–25 hrs; send WhatsApp |
| `send-followup-reminders` | Daily 9:00 AM | Find follow-ups due in 2 days; send WhatsApp |
| `check-low-stock` | Daily 8:00 AM | Check inventory; alert admin |
| `generate-monthly-report` | 1st of month, 7 AM | Generate P&L PDF; notify admin |
| `cleanup-expired-sessions` | Daily midnight | Remove expired OTP sessions |

---

## 7. Security Architecture

```
Request
  │
  ▼
Edge Middleware (Next.js)
  ├── /api/* → verify JWT (Supabase Auth)
  ├── /book/* → public (no auth)
  └── /dashboard/* → verify JWT + role check

JWT payload:
  { sub: userId, role: 'admin'|'doctor'|'receptionist', clinicId }

Row Level Security (Supabase RLS):
  - All tables scoped to clinic_id
  - patients: SELECT allowed for doctor + receptionist of same clinic
  - finance: SELECT/INSERT only for admin + receptionist
  - audit_log: INSERT only via service role (never client)
```

---

## 8. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# WhatsApp (WATI)
WATI_API_ENDPOINT=
WATI_API_TOKEN=
WHATSAPP_WEBHOOK_SECRET=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# PDF
PUPPETEER_EXECUTABLE_PATH=  # for production (chromium)

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_BOOKING_WIDGET_ORIGIN=

# Email (Resend)
RESEND_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
```
