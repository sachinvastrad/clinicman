# DrMan.ai — Technical Debt Log

All known shortcuts and deferred improvements. Every entry must have a Priority, estimated fix effort, and the sprint it was created in.

**Priority:** P0 (fix before go-live) · P1 (fix within 2 sprints) · P2 (fix in v1.2) · P3 (nice-to-have)

---

| ID | Description | Priority | Est. SP | Created In | Status |
|----|-------------|----------|---------|-----------|--------|
| TD-01 | PDF generation via Puppeteer (server-side headless Chrome) is memory-heavy on serverless. Migrate to `@react-pdf/renderer` (client-side, no Chromium dependency) | P2 | 5 | Sprint 3 | 🔲 Open |
| TD-02 | No job queue system — relying on Vercel Cron directly. Crons have 60-second timeout; campaign broadcast will fail for large patient lists. Add BullMQ + Redis (Upstash) in v2.0 | P1 | 8 | Sprint 5 | 🔲 Open |
| TD-03 | `whatsapp_messages` table used as a flat log, not a threaded conversation model. Campaign analytics require a redesign of this table for v1.1 | P1 | 5 | Sprint 5 | 🔲 Open |
| TD-04 | Patient search uses `pg_trgm` full-scan on `patients` table. Will degrade at 50,000+ records. Add composite GIN index and evaluate pgvector semantic search | P2 | 3 | Sprint 1 | 🔲 Open |
| TD-05 | Slot availability check in `GET /api/appointments/slots` uses sequential scan. Needs composite index on `(clinic_id, appointment_date, doctor_id, status)` | P1 | 1 | Sprint 2 | 🔲 Open |
| TD-06 | No retry logic on WhatsApp API calls. If WATI returns 429 or 500, the message is silently lost. Add exponential backoff retry (max 3 attempts) | P1 | 3 | Sprint 5 | 🔲 Open |
| TD-07 | Invoice number generation uses `MAX(invoice_number)` query — not safe under concurrent writes. Replace with `pg_sequences` | P0 | 2 | Sprint 4 | 🔲 Open |
| TD-08 | No pagination on `GET /api/patients/:id/visits` — loads all visits. Will slow for patients with 100+ visits | P2 | 1 | Sprint 3 | 🔲 Open |
| TD-09 | Prisma client instantiated per serverless function invocation. Causes connection pool exhaustion under load. Implement singleton pattern with connection guard | P1 | 2 | Phase 0 | 🔲 Open |
| TD-10 | Repertory data (Kent's) imported as static seed SQL. Should be a proper `rubrics` table with admin management UI for corrections and additions | P3 | 8 | Sprint 11 | 🔲 Open |
