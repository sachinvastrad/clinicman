# DrMan.ai — Implementation Documentation

> Engineering plans for building and shipping DrMan.ai.  
> Start here before writing a single line of code.

---

## Reading Order

| Step | File | What you'll get |
|------|------|----------------|
| 1 | [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Team setup, engineering principles, all 13 sprints with exact tasks, checkpoints, testing strategy, risk register |
| 2 | [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) | 3-environment strategy, CI/CD pipelines (GitHub Actions), DB migration policy, monitoring, backup, go-live checklist |
| 3 | [SPRINT_TRACKER.md](./SPRINT_TRACKER.md) | Living task board — update status as sprints progress |
| 4 | [TECH_DEBT.md](./TECH_DEBT.md) | Known shortcuts to fix; every entry has priority + effort |

---

## Quick Reference

### Timeline Summary

| Phase | Weeks | Deliverable |
|-------|-------|-------------|
| Phase 0 | 0–1 | Repo, CI, Supabase, login working |
| Phase 1 (MVP) | 2–13 | Full clinic can operate on system |
| **Checkpoint 1** | End W13 | MVP go-live ✓ |
| Phase 2 (v1.1) | 14–21 | Diet/Yoga, Leads, Booking Widget, Mobile App |
| **Checkpoint 2** | End W21 | v1.1 release ✓ |
| Phase 3 (v1.2) | 22–28 | Repertorization, Analytics, ABDM, Docker |
| **Checkpoint 3** | End W28 | v1.2 release ✓ |

### Sprint Velocity
- 2 developers: ~20 SP per 2-week sprint
- 1 developer: ~12 SP per 2-week sprint

### Branch Strategy
```
main          ← production; protected; requires PR + review
  └── feature/sprint-N-short-description
  └── fix/issue-description
  └── hotfix/critical-fix-description
```

### Key Commands
```bash
pnpm dev              # start Next.js dev server
pnpm build            # production build
pnpm test:unit        # jest unit tests
pnpm test:integration # vitest + local supabase
pnpm test:e2e         # playwright full suite
pnpm db:migrate:dev   # prisma migrate dev (creates new migration)
pnpm db:migrate:deploy# prisma migrate deploy (applies to staging/prod)
pnpm db:studio        # prisma studio (DB GUI)
supabase start        # start local supabase stack
supabase stop         # stop local supabase stack
```
