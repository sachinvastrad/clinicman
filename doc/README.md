# DrMan.ai — Documentation Index

> **"WhatsApp-first Homeopathy Clinic Operating System for Indian Clinics."**  
> Web + Mobile · Next.js · v2.0 docs (merged from product research + ChatGPT PRD)

---

## Document Map

| File | Version | Purpose | Audience |
|------|---------|---------|----------|
| [PRD.md](./PRD.md) | v2.0 | Full Product Requirements Document (enhanced with positioning, ABDM, AI roadmap, competitive differentiators) | PM, Tech Lead, Stakeholders |
| [EPICS_AND_STORIES.md](./EPICS_AND_STORIES.md) | v2.0 | 15 EPICs · 48 User Stories · 317 SP (adds constitutional profile, improvement scale, remedy history, vendor mgmt, package plans, escalation reminders, birthday/refill WhatsApp, Google Ads lead source, AI features) | Dev Team, QA |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | v1.0 | System architecture, component diagram, data flow | Tech Lead, Backend Dev |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | v1.0 | Full PostgreSQL schema (19 tables, columns, indexes, RLS policies) | Backend Dev |
| [API_SPEC.md](./API_SPEC.md) | v1.0 | REST API endpoints for every module | Frontend, Backend, QA |
| [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) | v1.0 | RBAC matrix + TypeScript permission helper + nav guard | Dev, QA |
| [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md) | v1.0 | WhatsApp Business API setup, 8 templates, webhook handler, reminder job | Backend Dev |
| [UI_FLOWS.md](./UI_FLOWS.md) | v1.0 | Screen-by-screen user flows for all roles, full route inventory | Frontend Dev, Designer |

---

## Quick-Start for Developers

1. Read `ARCHITECTURE.md` first for the big picture.
2. Use `DATABASE_SCHEMA.md` to set up your local Supabase project.
3. Follow `API_SPEC.md` to implement backend routes.
4. `ROLES_AND_PERMISSIONS.md` drives all middleware guards.
5. `UI_FLOWS.md` maps to the component tree.
6. `WHATSAPP_INTEGRATION.md` is standalone — tackle after core CRUD is stable.
