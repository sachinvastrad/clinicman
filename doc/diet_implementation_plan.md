# Diet Chart Generator — Implementation Plan & Checkpoints

**Module:** DrMan.ai · Diet Chart Generator (DCG)
**Owner:** Sachin (PO) · **Engineering lead:** TBD
**Document:** `clinicman/doc/diet_implementation_plan.md`
**Source of truth for *what & why*:** `clinicman/doc/final_diet.md` (PRD)
**This document covers *how & when* — phased breakdown, file-level changes, acceptance checkpoints.**

> **How to read this file:**
> Each phase has (a) Stories, (b) Files touched / added, (c) Tasks broken into tickets, (d) **Checkpoints** with `[ ]` boxes — tick as you complete. A phase is *done* when every checkpoint inside it ticks.

---

## 0. Tech & Repo Context (locked)

| Concern | Decision |
|---|---|
| Frontend | Next.js 15.0.3 (App Router) · React 19 · Tailwind 3 · Radix UI · Recharts · React-Hook-Form + Zod |
| State | TanStack Query + Zustand (existing) |
| ORM / DB | Prisma 5.22 · PostgreSQL (Supabase) · SQLite for dev (`prisma/dev.db`) |
| Auth | Iron-session + Supabase SSR (existing `lib/supabase/server`) |
| Test | Vitest (unit) · Playwright (E2E) |
| Build | `pnpm` workspaces · Electron desktop wrapper exists |
| Seed cmd | `npm run db:seed` → runs `tsx prisma/seed.ts` |
| Migration cmd | `pnpm db:migrate:dev --name <name>` |
| Module root path | Web: `clinicman/web/src/app/(dashboard)/diet-*` + `api/diet-*` + `api/patient-diet-charts/*` |
| Existing artefacts to extend (NOT rewrite) | `prisma/schema.prisma` · `prisma/seed.ts` · `(dashboard)/diet-templates/page.tsx` · `(dashboard)/visits/[visitId]/diet-chart/page.tsx` · `(print)/visits/[visitId]/diet-chart/print/page.tsx` · `api/diet-templates/*` · `api/patient-diet-charts/route.ts` |

---

## 1. High-level Phase Map

| Phase | Theme | Duration | Output |
|---|---|---|---|
| P1 | Schema & seed foundation | 2 wk | Foods/recipes/subs/templates in DB; patient extended fields live |
| P2 | Generator engine (deterministic) | 2 wk | Pure-TS module: inputs → 7-day plan + violations |
| P3 | Inputs UI (the long form) | 1.5 wk | Patient-aware generator inputs screen |
| P4 | Output UI (7-day grid + rollups + grocery) | 1.5 wk | Editable plan view |
| P5 | Print PDF + WhatsApp send | 1 wk | 2-page A4 PDF; WA module wired |
| P6 | Reports + permissions + audit | 4 d | Admin tile; per-doctor metrics; permission gates |
| P7 | Pilot hardening | 2 wk | Dogfood, MD content review, perf tune, bug bash |
| v1.1 | LLM regionalisation, budget optimiser, i18n, patient HTML link, adherence ping | 4 wk | (separate plan) |

**Total v1.0:** ~10 weeks · feature-flagged behind `DIET_GEN_V1_ENABLED` (defaults OFF in prod, ON in clinic dogfood env).

---

## 2. Cross-cutting Decisions

- **Feature flag:** `DIET_GEN_V1_ENABLED` (env var; mirrors existing `permissions.ts` pattern). When OFF, the existing `(dashboard)/visits/[visitId]/diet-chart/page.tsx` legacy editor stays.
- **Migration safety:** every Prisma migration is **additive** — no drops of columns used by legacy charts in v1.0. `customContent` and `content` columns stay (`@deprecated` comment), removed in v1.1.
- **Idempotent seed:** all seeders upsert by natural key (food.name, recipe.name, template.name, sub `(from,to,context)`).
- **Test pyramid:** 70% unit (generator pure functions), 20% integration (API+DB), 10% E2E (Playwright golden scenarios).
- **Source-of-truth dataset:** committed JSON/CSV in `prisma/seed-data/diet/` — single place to edit nutrition, GI, substitutions, templates.
- **Generator is pure (no I/O):** lives in `src/lib/diet/generator/*`. API routes call it after fetching dependencies. This makes it unit-testable with no DB.
- **No LLM in v1.0** — engine is fully deterministic. Anything that says "AI" in `ref_diet_prd.md` is v1.1+.

---

## 3. File-level scaffolding (planned new/changed files)

```
clinicman/web/
├── prisma/
│   ├── schema.prisma                              [MODIFY] +Food, Recipe, FoodSubstitution, PatientBiomarker; extend DietTemplate, PatientDietChart, Patient
│   ├── seed.ts                                    [MODIFY] add 4 seed calls
│   ├── seed-yoga.ts                               [unchanged]
│   ├── seed-diet-foods.ts                         [NEW]
│   ├── seed-diet-recipes.ts                       [NEW]
│   ├── seed-diet-subs.ts                          [NEW]
│   ├── seed-diet-templates.ts                     [NEW]
│   ├── seed-data/
│   │   └── diet/
│   │       ├── foods.csv                          [NEW] ~500 rows (IFCT-2017 derived)
│   │       ├── recipes.json                       [NEW] ~200 recipes
│   │       ├── substitutions.csv                  [NEW] ~1000 swaps
│   │       └── templates/*.json                   [NEW] ~60 scaffolds
│   └── migrations/<ts>_diet_gen_v1/migration.sql  [NEW] auto from db:migrate:dev
│
├── src/
│   ├── lib/
│   │   ├── diet/
│   │   │   ├── types.ts                           [NEW] Inputs, Plan, Day, Slot, Item, Violation
│   │   │   ├── targets.ts                         [NEW] Mifflin BMR, TDEE, goal delta, macros, caps
│   │   │   ├── template-rank.ts                   [NEW] scaffold selection
│   │   │   ├── candidate-pool.ts                  [NEW] per-slot food/recipe filter
│   │   │   ├── selector.ts                        [NEW] greedy fill + variety rotation
│   │   │   ├── rules/
│   │   │   │   ├── index.ts                       [NEW] rule registry + runner
│   │   │   │   ├── diabetes.ts                    [NEW]
│   │   │   │   ├── hypertension.ts                [NEW]
│   │   │   │   ├── ckd.ts                         [NEW]
│   │   │   │   ├── pregnancy.ts                   [NEW]
│   │   │   │   ├── meds.ts                        [NEW]
│   │   │   │   └── ayurveda.ts                    [NEW]
│   │   │   ├── swap.ts                            [NEW] smart-swap top-N
│   │   │   ├── grocery.ts                         [NEW] aggregate raw qtys
│   │   │   ├── rollup.ts                          [NEW] day/week totals + GL
│   │   │   ├── if-window.ts                       [NEW] intermittent fasting window
│   │   │   └── generator.ts                       [NEW] pipeline orchestrator
│   │   ├── permissions.ts                         [MODIFY] add diet:read|write|admin|wa_send
│   │   └── prisma.ts                              [unchanged]
│   │
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── diet-templates/                    [MODIFY] support new fields, source filter, clone
│   │   │   │   └── page.tsx
│   │   │   ├── foods/                             [NEW v1.0 read-only browser; full editor v1.1]
│   │   │   │   └── page.tsx
│   │   │   ├── patients/[id]/
│   │   │   │   ├── diet-profile/page.tsx          [NEW] extended diet preferences editor
│   │   │   │   └── biomarkers/page.tsx            [NEW] lab values list/add
│   │   │   └── visits/[visitId]/
│   │   │       ├── diet-chart/                    [MODIFY] route stays; UI replaced behind flag
│   │   │       │   ├── page.tsx                   [MODIFY] mounts <GeneratorShell/> if flag ON, legacy if OFF
│   │   │       │   ├── inputs-form.tsx            [NEW]
│   │   │       │   ├── output-grid.tsx            [NEW]
│   │   │       │   ├── grocery-panel.tsx          [NEW]
│   │   │       │   ├── rollup-card.tsx            [NEW]
│   │   │       │   └── generator-shell.tsx       [NEW]
│   │   │
│   │   ├── (print)/
│   │   │   └── visits/[visitId]/diet-chart/print/
│   │   │       └── page.tsx                       [MODIFY] render 7-day grid + rollup + grocery; 2-page A4
│   │   │
│   │   └── api/
│   │       ├── diet/
│   │       │   ├── foods/route.ts                 [NEW] GET search
│   │       │   ├── foods/[id]/route.ts            [NEW] GET detail
│   │       │   ├── recipes/route.ts               [NEW] GET search
│   │       │   ├── templates/route.ts             [NEW] GET list + POST create custom
│   │       │   ├── templates/[id]/clone/route.ts  [NEW] POST clone
│   │       │   ├── generate/route.ts              [NEW] POST → snapshot + violations
│   │       │   └── swap/route.ts                  [NEW] POST → top 3 subs
│   │       ├── patient-diet-charts/
│   │       │   ├── route.ts                       [MODIFY] accept snapshot JSON; versioning
│   │       │   ├── [id]/route.ts                  [NEW] PATCH bumps version
│   │       │   └── [id]/whatsapp/route.ts         [NEW] POST render PDF + WA send
│   │       ├── patients/[id]/diet-profile/route.ts [NEW] GET/PUT extended fields
│   │       └── patients/[id]/biomarkers/route.ts   [NEW] GET/POST
│   │
│   ├── components/
│   │   └── diet/
│   │       ├── meal-cell.tsx                      [NEW]
│   │       ├── item-chip.tsx                      [NEW]
│   │       ├── swap-popover.tsx                   [NEW]
│   │       ├── macro-bar.tsx                      [NEW] recharts
│   │       ├── chip-multiselect.tsx               [NEW] allergens/dislikes/etc
│   │       └── biomarker-row.tsx                  [NEW]
│   │
│   └── types/diet.ts                              [NEW] shared TS types (imported by both lib + UI)
│
├── tests/
│   ├── unit/diet/
│   │   ├── targets.test.ts                        [NEW]
│   │   ├── candidate-pool.test.ts                 [NEW]
│   │   ├── selector.test.ts                       [NEW]
│   │   ├── rules/diabetes.test.ts                 [NEW]
│   │   ├── rules/hypertension.test.ts             [NEW]
│   │   └── rollup.test.ts                         [NEW]
│   ├── integration/diet/
│   │   ├── generate.test.ts                       [NEW] golden scenarios via API
│   │   └── seed.test.ts                           [NEW] verify counts post-seed
│   └── e2e/diet/
│       ├── generate-pcos-veg.spec.ts              [NEW]
│       ├── generate-diabetic-veg.spec.ts          [NEW]
│       ├── generate-htn-nonveg.spec.ts            [NEW]
│       ├── generate-pregnancy-t3.spec.ts          [NEW]
│       └── generate-elderly-wl.spec.ts            [NEW]
```

---

## 4. Phase 1 — Schema & Seed Foundation (2 weeks)

### 4.1 Stories
- *As an engineer, I can run `npm run db:seed` and get ≥ 500 foods, ≥ 200 recipes, ≥ 1000 substitutions, ≥ 60 templates seeded idempotently.*
- *As a doctor, I can edit a patient's extended diet profile and the data persists.*

### 4.2 Tickets (Linear-shaped)
| # | Ticket | Estimate | Files |
|---|---|---|---|
| P1-1 | Prisma: add `Food`, `Recipe`, `RecipeIngredient`, `FoodSubstitution`, `PatientBiomarker` models + enums | 1 d | `schema.prisma` |
| P1-2 | Prisma: extend `DietTemplate` with new fields + `DietType`/`AgeGroup`/`DietGoal` enums; keep `content` as `@deprecated` | 0.5 d | `schema.prisma` |
| P1-3 | Prisma: extend `PatientDietChart` (snapshot JSON + version); remove `@unique` on `visitId`; keep `customContent @deprecated` | 0.5 d | `schema.prisma` |
| P1-4 | Prisma: extend `Patient` with ~50 optional fields per PRD §6 | 0.5 d | `schema.prisma` |
| P1-5 | Generate migration `pnpm db:migrate:dev --name diet_gen_v1` | 0.25 d | `prisma/migrations/<ts>_diet_gen_v1/` |
| P1-6 | Build `seed-diet-foods.ts` (CSV parser reused from `seed-yoga.ts`) | 1 d | `prisma/seed-diet-foods.ts` |
| P1-7 | Build `seed-diet-recipes.ts` (JSON parser; resolves ingredient FK by name) | 1 d | `prisma/seed-diet-recipes.ts` |
| P1-8 | Build `seed-diet-subs.ts` | 0.5 d | `prisma/seed-diet-subs.ts` |
| P1-9 | Build `seed-diet-templates.ts` | 0.5 d | `prisma/seed-diet-templates.ts` |
| P1-10 | Wire all 4 into `seed.ts` | 0.25 d | `prisma/seed.ts` |
| P1-11 | Curate `foods.csv` (≥ 500 rows from IFCT-2017 + NIN GI table) — MD-supervised | 2.5 d | `prisma/seed-data/diet/foods.csv` |
| P1-12 | Curate `recipes.json` (≥ 200 staple recipes) — cuisine-tagged | 2 d | `prisma/seed-data/diet/recipes.json` |
| P1-13 | Curate `substitutions.csv` (≥ 1000 swaps) | 1 d | `prisma/seed-data/diet/substitutions.csv` |
| P1-14 | Curate `templates/*.json` (≥ 60 scaffolds — see PRD §7) | 2.5 d | `prisma/seed-data/diet/templates/*.json` |
| P1-15 | API: `/api/patients/[id]/diet-profile` GET/PUT | 0.5 d | new route file |
| P1-16 | API: `/api/patients/[id]/biomarkers` GET/POST | 0.5 d | new route file |
| P1-17 | UI: `(dashboard)/patients/[id]/diet-profile/page.tsx` (basic editor; not the generator inputs form) | 1 d | new |
| P1-18 | Unit: `tests/integration/diet/seed.test.ts` — assert counts after seed | 0.5 d | new |

### 4.3 Migration safety checklist
- [ ] No column **drops** in this migration
- [ ] All new `Patient` columns are nullable / have defaults
- [ ] `PatientDietChart.visitId` `@unique` removed via `prisma migrate dev` (verify the SQL drops only the unique index, not the column)
- [ ] Verify `prisma db push` on a copy of prod data succeeds without errors

### 4.4 Seed data schema (sample)

**`foods.csv`** (header → first row example):
```
name,name_local_hi,name_local_kn,category,sub_category,veg_type,cuisine_regions,kcal,protein_g,carb_g,fat_g,fiber_g,sugar_g,sodium_mg,potassium_mg,calcium_mg,iron_mg,vitamin_a_ug,vitamin_c_mg,vitamin_d_ug,vitamin_b12_ug,folate_ug,omega3_g,gi,allergens,fodmap_level,disease_allowed,disease_restricted,seasonality,cost_tier,unit_cost_inr,default_portion_g,default_portion_desc,source
Ragi (Finger Millet),रागी,ರಾಗಿ,CEREAL_MILLET,millet,VEG,"karnataka;tamil_nadu;andhra",336,7.3,72.0,1.3,11.5,0.0,11,408,344,3.9,3,1.5,0,0,18,0.04,67,,low,"diabetes_t2;weight_loss;anaemia;osteoporosis","",,economy,4,30,"½ cup flour",IFCT-2017
```

**`recipes.json`** (one object example):
```json
{
  "name": "Ragi Dosa",
  "cuisine": "karnataka",
  "meal_slots": ["breakfast", "dinner"],
  "veg_type": "VEG",
  "prep_time_min": 20,
  "difficulty": "easy",
  "servings_base": 2,
  "kcal_per_serving": 180,
  "protein_g_per_serving": 6,
  "carb_g_per_serving": 28,
  "fat_g_per_serving": 4,
  "gi_estimate": 55,
  "instructions": "Mix ragi flour with curd...",
  "must_pair_with": ["sambar", "coconut_chutney"],
  "tags": ["low-gi", "high-fiber", "diabetic-friendly"],
  "ingredients": [
    { "food_name": "Ragi (Finger Millet)", "qty_g": 60 },
    { "food_name": "Curd",                 "qty_g": 30 }
  ]
}
```

**`substitutions.csv`:**
```
from_food,to_food,context_slot,reason,similarity_score
Paneer,Tofu,lunch,lactose,0.85
Paneer,Greek Yogurt,breakfast,preference,0.7
Chicken,Fish,lunch,preference,0.8
Rice,Ragi,lunch,low_gi,0.75
```

**`templates/<name>.json`:**
```json
{
  "name": "PCOS Support — Veg — South Indian",
  "description": "Insulin-sensitising low-GI plan",
  "diet_type": "VEG",
  "age_group": "ADULT",
  "goal": "PCOS",
  "condition_tags": ["pcos","insulin_resistance"],
  "cuisine_regions": ["karnataka","tamil_nadu","kerala"],
  "target_kcal": 1500,
  "macro_split": { "carbs_pct": 40, "protein_pct": 30, "fat_pct": 30 },
  "protein_per_kg": 1.2,
  "gi_cap": 55,
  "salt_cap_g": 4,
  "added_sugar_cap_g": 0,
  "oil_cap_ml": 20,
  "water_target_l": 3.0,
  "slot_distribution": {
    "early_morning": 3, "breakfast": 22, "mid_morning": 8,
    "lunch": 30, "evening_snack": 10, "dinner": 22, "bedtime": 5
  },
  "slot_food_groups": {
    "breakfast": ["CEREAL_MILLET","PULSE_LEGUME","DAIRY"],
    "lunch":     ["CEREAL_MILLET","PULSE_LEGUME","GLV","VEGETABLE","DAIRY"],
    "dinner":    ["CEREAL_MILLET","PULSE_LEGUME","VEGETABLE"]
  },
  "allowed_foods": ["millets","leafy greens","seeds","legumes","cinnamon","fenugreek"],
  "avoid_foods": ["refined flour","sugar","fruit juice","processed snacks"],
  "lifestyle_notes": "30-min brisk walk daily; sleep ≥ 7 hr; manage stress.",
  "supplement_hints": "Consider Vitamin D3, Inositol if deficient (clinician-led)",
  "requires_dietitian_review": false,
  "source": "NIN-2024-DGI + Clinic-Curated"
}
```

### 4.5 Checkpoints — Phase 1
- [ ] **CP1.1** `schema.prisma` compiles; `pnpm db:generate` succeeds
- [ ] **CP1.2** Migration applied locally; legacy diet charts still load on existing UI
- [ ] **CP1.3** `seed-diet-foods.ts` runs idempotently — second run inserts 0 rows
- [ ] **CP1.4** `npm run db:seed` outputs `✓ Foods: 500+ · Recipes: 200+ · Subs: 1000+ · Templates: 60+`
- [ ] **CP1.5** Every seeded row has a non-null `source` (audit trail)
- [ ] **CP1.6** `GET /api/diet/foods?q=ragi` returns ≥ 1 result with full nutrition
- [ ] **CP1.7** `PUT /api/patients/[id]/diet-profile` round-trips all new fields
- [ ] **CP1.8** `POST /api/patients/[id]/biomarkers` accepts HbA1c entry; appears in subsequent GET
- [ ] **CP1.9** `(dashboard)/patients/[id]/diet-profile` page edits and persists
- [ ] **CP1.10** Integration test `seed.test.ts` asserts seeded counts; passes in CI
- [ ] **CP1.11** Re-seed in CI does not duplicate rows
- [ ] **CP1.12** PR reviewed by MD for ≥ 20 sample foods and 5 templates (data quality gate)

---

## 5. Phase 2 — Generator Engine (deterministic core) (2 weeks)

### 5.1 Stories
- *As a doctor, when I submit a generator input bundle the system returns a complete 7-day plan + nutrition rollup + violations list in < 1.5 s P95.*
- *As an engineer, I can run `pnpm test:unit` and see ≥ 90% coverage on `src/lib/diet/`.*

### 5.2 Module contract (TS — lives in `src/lib/diet/types.ts`)
```ts
export interface DietInputs {
  patient: {
    ageYears: number; ageMonths?: number; gender: "M" | "F" | "O";
    heightCm?: number; currentWeightKg?: number; targetWeightKg?: number;
    waistCm?: number; hipCm?: number; bodyFatPct?: number;
    pregnancyStatus?: "none"|"t1"|"t2"|"t3"|"lactating_0_6"|"lactating_6_12";
    menstrualPhase?: string;
  };
  activity: {
    level: "bed_rest"|"sedentary"|"light"|"moderate"|"heavy"|"athlete";
    exerciseTypes?: string[]; exerciseMinsWeek?: number;
    workShift?: "day"|"night"|"rotating"|"split";
  };
  diet: {
    type: string;                       // see PRD §6.4
    therapeuticPatterns?: string[];
    religiousTags?: string[];
    allergens?: string[]; intolerances?: string[];
    loves?: string[]; dislikes?: string[];
    textureAversions?: string[]; spiceTolerance?: string;
    fastingDays?: string[]; fastingWindow?: { start: string; end: string };
  };
  region: {
    macroRegion?: string; state?: string; subRegion?: string;
    climate?: string; diasporaVariant?: string;
  };
  goal: { primary: string; secondary?: string[]; horizonWeeks?: number };
  conditions?: string[];                  // disease tags
  biomarkers?: Record<string, number>;    // {hba1c: 7.2, ldl: 145, ...}
  medications?: string[];
  supplements?: string[];
  lifestyle?: {
    sleepHoursAvg?: number; bedtime?: string; waketime?: string;
    stressLevel?: string; waterIntakeL?: number;
    caffeineCupsDay?: number; alcoholFreq?: string;
    bowelFreqDay?: number; bristolStool?: number; eatOutFreq?: string;
  };
  cooking?: {
    cookedBy?: string; equipment?: string[]; timeTier?: string;
    mealPrepStyle?: string; householdSize?: number;
  };
  budget?: { tier?: string; localeTier?: string; seasonalityPref?: string };
  constitutional?: { prakriti?: string; vikriti?: string; homeoType?: string };
  // Hard inputs
  templateId?: string;          // forced scaffold; otherwise auto-ranked
  seed?: number;                // for reproducible regeneration
  lockedCells?: Array<{ day: number; slot: string; foodIds: string[] }>;
}

export interface GeneratedPlan {
  summary: {
    targetKcal: number; macroSplit: { c: number; p: number; f: number };
    proteinG: number; giCap?: number; saltCapG: number; waterTargetL: number;
    templateId: string; templateName: string;
  };
  days: Array<{
    dayIndex: 0|1|2|3|4|5|6;        // Mon..Sun
    slots: Record<string, Item[]>;   // slot -> items
    totals: Totals;
    glycemicLoad: number;
    estCostInr: number;
  }>;
  weeklyRollup: {
    avgDailyKcal: number; avgDailyGi: number;
    macroSplitActual: { c: number; p: number; f: number };
    distinctFoods: number;
    micronutrientCoverage: Array<{ name: string; pctRda: number }>;
    risks: string[];
  };
  grocery: Array<{ aisle: string; foodId: string; name: string; qtyG: number; estCostInr: number }>;
  dosAndDonts: { allowed: string[]; avoid: string[]; lifestyleNotes: string[] };
  violations: Array<{ rule: string; action: "swapped"|"softened"|"warned"; original?: string; replacement?: string; reason: string }>;
}

export interface Item { foodId: string; recipeId?: string; name: string; qtyG: number; unit: string; kcal: number; proteinG: number; carbG: number; fatG: number; fiberG?: number; gi?: number; notes?: string; locked?: boolean; }
export interface Totals { kcal: number; proteinG: number; carbG: number; fatG: number; fiberG: number; addedSugarG: number; sodiumMg: number; potassiumMg: number; }
```

### 5.3 Pipeline (mirrors PRD §8)
```
generate(inputs, depRepo): GeneratedPlan
  ├─ solveTargets(inputs)            → { kcal, macros, caps }
  ├─ pickTemplate(inputs, depRepo)   → template (if not forced)
  ├─ splitSlots(template, kcal)      → { slot: kcal }
  ├─ buildPlan7Days(slotsKcal, depRepo, inputs)
  │     ├─ for each day, for each slot:
  │     │    pool = candidatePool(slot, inputs, depRepo)
  │     │    items = selectItems(pool, slotKcal, ctx)
  │     ├─ smoothVariety(plan)
  │     └─ enforceIfWindow(plan, inputs.fastingWindow)
  ├─ validateRules(plan, inputs)     → swap on violations, max 3 iters
  ├─ buildGrocery(plan)              → aisle-grouped raw qtys
  ├─ rollup(plan)                    → daily + weekly + GL
  └─ return { summary, days, weeklyRollup, grocery, dosAndDonts, violations }
```

### 5.4 Dep injection (testability)
Generator takes a `DepRepo` interface, NOT prisma directly:
```ts
interface DepRepo {
  listFoods(filter: FoodFilter): Promise<Food[]>;
  listRecipes(filter: RecipeFilter): Promise<Recipe[]>;
  listTemplates(filter: TemplateFilter): Promise<Template[]>;
  getSubstitutions(fromId: string, slot?: string): Promise<Food[]>;
}
```
- Prod impl: `PrismaDepRepo` in `src/lib/diet/repos/prisma.ts`
- Test impl: `InMemoryDepRepo` (fixture-fed) in `tests/unit/diet/_fixtures/repo.ts`

### 5.5 Tickets
| # | Ticket | Est | Files |
|---|---|---|---|
| P2-1 | `types.ts` (shared between lib + UI + API) | 0.5 d | `src/types/diet.ts`, `src/lib/diet/types.ts` |
| P2-2 | `targets.ts` — Mifflin, TDEE, goal delta, macro split, cap defaults | 0.5 d | new |
| P2-3 | `DepRepo` interface + `PrismaDepRepo` impl + `InMemoryDepRepo` test impl | 0.5 d | new |
| P2-4 | `template-rank.ts` | 0.5 d | new |
| P2-5 | `candidate-pool.ts` (handles diet type + allergens + GI cap + region + budget + season) | 1 d | new |
| P2-6 | `selector.ts` (greedy fill ± 10% + variety counter) | 1 d | new |
| P2-7 | `rules/index.ts` — registry + iteration loop | 0.5 d | new |
| P2-8 | `rules/diabetes.ts` (GI cap + HbA1c modulation) | 0.5 d | new |
| P2-9 | `rules/hypertension.ts` (Na cap + DASH skeleton) | 0.5 d | new |
| P2-10 | `rules/ckd.ts` (protein + K cap) | 0.5 d | new |
| P2-11 | `rules/pregnancy.ts` (+350/450 kcal, iron/folate) | 0.5 d | new |
| P2-12 | `rules/meds.ts` (Warfarin/MAOI/Levothyroxine/Statin) | 0.5 d | new |
| P2-13 | `rules/ayurveda.ts` (Vata/Pitta/Kapha bias) | 0.5 d | new |
| P2-14 | `swap.ts` (top-3 from substitutions ranked by similarity) | 0.5 d | new |
| P2-15 | `if-window.ts` (IF 16:8 / 14:10 / OMAD slot compression) | 0.5 d | new |
| P2-16 | `grocery.ts` (qty aggregate; aisle bucket) | 0.5 d | new |
| P2-17 | `rollup.ts` (daily + weekly + GL) | 0.5 d | new |
| P2-18 | `generator.ts` (pipeline orchestrator) | 1 d | new |
| P2-19 | API route `/api/diet/generate/route.ts` (validates Zod schema, calls generator) | 0.5 d | new |
| P2-20 | API route `/api/diet/swap/route.ts` | 0.25 d | new |
| P2-21 | Unit tests — 30+ for `targets`, 20+ for `candidate-pool`, 15+ for each rule file | 2 d | `tests/unit/diet/*` |
| P2-22 | 5 golden-scenario fixtures (PCOS-veg, Diabetic-veg, HTN-nonveg, Pregnancy-T3, Elderly-WL) | 0.5 d | `tests/unit/diet/_fixtures/*.json` |

### 5.6 Golden Scenarios (test matrix — must pass all)
| # | Scenario | Asserts |
|---|---|---|
| GS1 | PCOS-veg, F-31y-64kg-161cm, sedentary, Karnataka | kcal ∈ 1400–1600; GI all ≤ 55; ≥ 90 g protein; no sugar |
| GS2 | Diabetic-veg-Bengaluru, M-58y-78kg-170cm + HbA1c 8.2 | GI cap auto-tightens to 50; ≥ 25 g fibre/day; no fruit juice |
| GS3 | HTN-nonveg, M-52y-82kg-176cm + BP 152/96 | Na ≤ 1500 mg/day; K-rich foods ≥ 3 slots; fish 2x/week |
| GS4 | Pregnancy T3-veg, F-29y-66kg-162cm | TDEE+450; iron ≥ 25 mg; folate ≥ 600 µg; soft meals |
| GS5 | Elderly-WL-veg, F-72y-72kg-155cm + osteoporosis | kcal ∈ 1300–1500; protein 1.0 g/kg; calcium ≥ 1000 mg; soft texture |

### 5.7 Checkpoints — Phase 2
- [ ] **CP2.1** `solveTargets` returns Mifflin-correct kcal for 10 fixtures (manual hand-calc cross-check)
- [ ] **CP2.2** All 5 golden scenarios produce a complete 7-day plan
- [ ] **CP2.3** Per-day kcal within ± 10% of target on all GS
- [ ] **CP2.4** Zero hard-rule violations after pipeline completes on all GS
- [ ] **CP2.5** Variety: no slot repeats a food more than `max_repeat` times across 7 days
- [ ] **CP2.6** Swap API returns ≥ 3 substitutes for `paneer`, `chicken`, `rice`, `wheat_roti`
- [ ] **CP2.7** Generator P95 < 1.5 s on local dev (measured via `console.time`)
- [ ] **CP2.8** `pnpm test:unit -- diet` ≥ 90% coverage on `src/lib/diet/`
- [ ] **CP2.9** Locked cells survive regeneration (`lockedCells[]` input echoed in output)
- [ ] **CP2.10** IF window 16:8 collapses bedtime + early-morning slots when in fasted window
- [ ] **CP2.11** Violations are populated (and resolved) for an intentionally over-spec'd input (regression test)

---

## 6. Phase 3 — Inputs UI (1.5 weeks)

### 6.1 Stories
- *As a doctor, I can open the generator screen and see the patient's saved profile prefilled.*
- *As a doctor, I can override any field for this generation only, OR save back to the patient.*

### 6.2 Layout (mirrors PRD §11.2)
```
GeneratorShell (split)
├── Left rail: PatientCard (read-only) + BiometricsCard (editable inline)
├── Center: GoalPicker (big card grid) + DietTypeSelect + CuisineSelector
├── Right rail: ChipMultiselects (allergens, dislikes, conditions, biomarkers chips)
└── Bottom drawer: BudgetCookingFastingNotes (collapsed by default)
```

### 6.3 Components to build
| Component | Files |
|---|---|
| `<GeneratorShell/>` | `(dashboard)/visits/[visitId]/diet-chart/generator-shell.tsx` |
| `<InputsForm/>` | `(dashboard)/visits/[visitId]/diet-chart/inputs-form.tsx` (RHF + Zod) |
| `<ChipMultiselect/>` | `components/diet/chip-multiselect.tsx` |
| `<BiomarkerRow/>` | `components/diet/biomarker-row.tsx` |
| `<GoalPickerGrid/>` | `components/diet/goal-picker-grid.tsx` |
| `<DietProfileSummary/>` | `components/diet/diet-profile-summary.tsx` |

### 6.4 Tickets
| # | Ticket | Est |
|---|---|---|
| P3-1 | Zod schema for `DietInputs` (shared between client + API) | 0.25 d |
| P3-2 | `<ChipMultiselect>` w/ Radix Combobox + add-custom + search | 0.75 d |
| P3-3 | `<GoalPickerGrid>` (35-tile grid w/ search filter) | 0.5 d |
| P3-4 | `<BiomarkerRow>` (lab marker + value + date + source) | 0.5 d |
| P3-5 | `<InputsForm>` RHF + Zod + dirty-state guard | 1.5 d |
| P3-6 | "More personalisation" collapsible (progressive disclosure) | 0.5 d |
| P3-7 | Auto-prefill from `/api/patients/[id]/diet-profile` + `case_history` + `prescription` | 0.5 d |
| P3-8 | "Save back to profile" toggle wiring | 0.25 d |
| P3-9 | `<GeneratorShell>` wraps form + handles `Generate` POST | 0.5 d |
| P3-10 | Mobile / tablet responsive | 0.5 d |
| P3-11 | E2E: doctor fills form, submits, gets 200 + plan | 0.5 d |

### 6.5 Checkpoints — Phase 3
- [ ] **CP3.1** Form loads in < 500 ms with all patient data prefilled
- [ ] **CP3.2** Every §6 input group reachable (verified by ChromeDevTools snapshot test)
- [ ] **CP3.3** Allergens chip rejects unknown allergen and accepts via "add custom"
- [ ] **CP3.4** Disease-tag chip auto-suggests from `case_history` tags
- [ ] **CP3.5** Biomarker row accepts HbA1c with date; renders inline error if value out of range
- [ ] **CP3.6** "Save back to profile" toggle, when ON, persists overrides to `Patient`
- [ ] **CP3.7** Keyboard-only navigation works end-to-end
- [ ] **CP3.8** Form passes Zod validation client-side AND server-side (defence-in-depth)
- [ ] **CP3.9** Mobile viewport (768px) usable without horizontal scroll
- [ ] **CP3.10** Playwright test: PCOS-veg patient → fill form → click Generate → plan response in < 2 s

---

## 7. Phase 4 — Output UI (1.5 weeks)

### 7.1 Stories
- *As a doctor, after generation I see a 7-day grid I can scan in 5 seconds.*
- *As a doctor, I can swap any food item with 1 click.*
- *As a doctor, I can regenerate one day without losing the rest.*

### 7.2 Components
| Component | Files |
|---|---|
| `<OutputGrid/>` | `(dashboard)/visits/[visitId]/diet-chart/output-grid.tsx` |
| `<MealCell/>` | `components/diet/meal-cell.tsx` |
| `<ItemChip/>` | `components/diet/item-chip.tsx` |
| `<SwapPopover/>` | `components/diet/swap-popover.tsx` |
| `<MacroBar/>` | `components/diet/macro-bar.tsx` (Recharts) |
| `<GroceryPanel/>` | `(dashboard)/visits/[visitId]/diet-chart/grocery-panel.tsx` |
| `<RollupCard/>` | `(dashboard)/visits/[visitId]/diet-chart/rollup-card.tsx` |

### 7.3 Tabs
- `Plan` — 7-day grid (default)
- `Grocery` — aisle-grouped list with checkboxes
- `Do's & Don'ts` — chips with reason tooltips
- `Weekly Rollup` — recharts pie + bar + variety count + risks
- `Violations` — only shown if `violations.length > 0` (yellow banner)

### 7.4 Tickets
| # | Ticket | Est |
|---|---|---|
| P4-1 | `<MealCell>` + `<ItemChip>` with swap/delete/add affordances | 1 d |
| P4-2 | `<OutputGrid>` — 7×7 grid, sticky day headers | 0.5 d |
| P4-3 | `<SwapPopover>` calls `/api/diet/swap`; renders top 3; apply updates state | 0.5 d |
| P4-4 | `<MacroBar>` w/ traffic-light vs target | 0.5 d |
| P4-5 | `<GroceryPanel>` (checkboxes + group toggle) | 0.5 d |
| P4-6 | `<RollupCard>` w/ Recharts pie + bar + micronutrient list | 0.5 d |
| P4-7 | Tab navigation (Radix Tabs) | 0.25 d |
| P4-8 | "Regenerate day", "Regenerate all", "Lock cell" actions | 0.75 d |
| P4-9 | Save flow → POST `/api/patient-diet-charts` with snapshot | 0.5 d |
| P4-10 | Edit existing chart → PATCH bumps version | 0.5 d |
| P4-11 | E2E: end-to-end generate → swap → save → reopen → diff version | 0.75 d |

### 7.5 Checkpoints — Phase 4
- [ ] **CP4.1** Grid renders all 49 cells without layout shift
- [ ] **CP4.2** Per-cell swap returns ≤ 800 ms and updates totals live
- [ ] **CP4.3** Macro bar turns red if any macro deviates > 15% from target
- [ ] **CP4.4** Grocery list aggregates duplicates correctly (e.g., rice 60g × 3 days = 180g)
- [ ] **CP4.5** Lock-cell prevents that cell from changing in next regenerate
- [ ] **CP4.6** Violations banner shows reason + suggested fix; can be dismissed
- [ ] **CP4.7** Save creates a `PatientDietChart` row with full snapshot; refresh restores identically
- [ ] **CP4.8** Editing post-save bumps `version` and preserves prior `snapshot`
- [ ] **CP4.9** Recharts work in production build (no SSR-only failures)
- [ ] **CP4.10** Playwright golden flow passes for all 5 scenarios

---

## 8. Phase 5 — Print PDF + WhatsApp (1 week)

### 8.1 Stories
- *As a doctor, I click Print and get a clean 2-page A4 PDF.*
- *As a receptionist, I click "Send WhatsApp" and the patient receives the PDF.*

### 8.2 Tickets
| # | Ticket | Est |
|---|---|---|
| P5-1 | Extend `(print)/visits/[visitId]/diet-chart/print/page.tsx` to read `snapshot` JSON; render 2-page layout | 1.5 d |
| P5-2 | Page 1: header + summary card + Mon–Wed grid | 0.5 d |
| P5-3 | Page 2: Thu–Sun + weekly rollup + do's/don'ts + grocery + footer | 0.5 d |
| P5-4 | Backward-compat: if `customContent` only (legacy chart), render old layout | 0.25 d |
| P5-5 | API route `/api/patient-diet-charts/[id]/whatsapp/route.ts` — render PDF server-side via Playwright; upload to media bucket; call existing WA module | 1.5 d |
| P5-6 | Register `diet_chart_pdf` WhatsApp template with Meta (Reema owns Meta approval) | 0.5 d wallclock (outside dev) |
| P5-7 | Write back `whatsappSentAt`; surface retry on failure | 0.25 d |
| P5-8 | E2E: PDF render + WA send to test number | 0.5 d |

### 8.3 Checkpoints — Phase 5
- [ ] **CP5.1** Print preview fits on 2 A4 pages for all 5 golden scenarios (no overflow)
- [ ] **CP5.2** Body text min 11 pt; clinic letterhead correct
- [ ] **CP5.3** Patient name + age + condition tag + date visible on page 1
- [ ] **CP5.4** Footer disclaimer present on every page
- [ ] **CP5.5** WhatsApp send writes `whatsappSentAt`; PDF received on test number
- [ ] **CP5.6** Retry button visible on send failure; second attempt succeeds
- [ ] **CP5.7** Legacy `customContent`-only charts still render via old layout (no regression)
- [ ] **CP5.8** PDF size < 500 KB (compressed images)

---

## 9. Phase 6 — Reports, Permissions, Audit (4 days)

### 9.1 Tickets
| # | Ticket | Est |
|---|---|---|
| P6-1 | Add `diet:read`, `diet:write`, `diet:admin`, `diet:wa_send` to `lib/permissions.ts` | 0.25 d |
| P6-2 | Wire permissions on all `/api/diet/*` and patient-diet-charts routes | 0.5 d |
| P6-3 | Admin dashboard tile: "% visits with diet chart this month" per doctor | 0.5 d |
| P6-4 | Admin report: top 10 templates by use; avg violations resolved | 0.5 d |
| P6-5 | Audit log: every `generate / swap / save / wa_send` event | 0.5 d |
| P6-6 | Require-dietitian-review modal for flagged templates | 0.5 d |
| P6-7 | E2E: receptionist cannot reach `/generate` (403); can send WA | 0.5 d |

### 9.2 Checkpoints — Phase 6
- [ ] **CP6.1** Receptionist role hitting `/api/diet/generate` → 403
- [ ] **CP6.2** Doctor sees the generator UI; Admin sees both generator + templates editor
- [ ] **CP6.3** Admin tile updates within 5 min of new chart creation
- [ ] **CP6.4** Audit table contains rows for every test action
- [ ] **CP6.5** Renal-flagged template requires confirm modal before `Save`
- [ ] **CP6.6** Override action logged with user, reason

---

## 10. Phase 7 — Pilot Hardening (2 weeks)

### 10.1 Activities
| # | Activity | Est |
|---|---|---|
| P7-1 | Enable `DIET_GEN_V1_ENABLED` in clinic dogfood env only | 0.1 d |
| P7-2 | 2-week clinic dogfood — doctor uses on real patients (test data flagged in DB) | 10 d wallclock |
| P7-3 | Daily bug triage; hotfix lane | continuous |
| P7-4 | MD content review of 30 generated plans (sample) | 2 d wallclock |
| P7-5 | Perf tune: candidate-pool query (add indices if needed) | 1 d |
| P7-6 | Copy review (every UI string, every PDF string) | 0.5 d |
| P7-7 | Accessibility audit (axe + manual keyboard) | 0.5 d |
| P7-8 | Load test: 100 generates in 60 s | 0.5 d |

### 10.2 Checkpoints — Phase 7
- [ ] **CP7.1** ≥ 30 real charts generated and printed/sent in dogfood
- [ ] **CP7.2** ≥ 70% of charts saved without doctor swapping more than 3 items
- [ ] **CP7.3** Zero patient-facing errors (PDF, WA) over the 2-week window
- [ ] **CP7.4** MD signs off content review document (✅ list)
- [ ] **CP7.5** Generator P95 < 1.5 s holds at 100 concurrent generates
- [ ] **CP7.6** axe-core a11y violations resolved or ticketed
- [ ] **CP7.7** Flag flipped ON in prod for primary clinic
- [ ] **CP7.8** Rollback runbook tested (`DIET_GEN_V1_ENABLED=false` → legacy editor returns instantly)

---

## 11. Testing Matrix

| Layer | Tool | Coverage target | Lives at |
|---|---|---|---|
| Unit — generator pure fns | Vitest | ≥ 90% on `src/lib/diet/` | `tests/unit/diet/*` |
| Unit — rules | Vitest | 100% per rule file | `tests/unit/diet/rules/*` |
| Integration — API + DB | Vitest + Prisma test client | All `/api/diet/*` + patient-diet-charts | `tests/integration/diet/*` |
| Integration — seed | Vitest | Counts assertions | `tests/integration/diet/seed.test.ts` |
| E2E — golden scenarios | Playwright | 5 flows | `tests/e2e/diet/*.spec.ts` |
| E2E — permissions | Playwright | 3 roles | `tests/e2e/diet/permissions.spec.ts` |
| Visual regression — print | Playwright snapshot | 5 PDFs | `tests/e2e/diet/print-*.spec.ts` |

CI gate: every PR touching `src/lib/diet/`, `prisma/seed-diet-*`, or `src/app/(dashboard)/visits/*/diet-chart/*` must run all of `pnpm test:unit && pnpm test:e2e -- diet`.

---

## 12. Rollout, Feature Flags & Rollback

| Step | Action |
|---|---|
| Day 0 | Merge to main behind `DIET_GEN_V1_ENABLED=false` |
| Day 1–14 | Dogfood env: flag ON · primary clinic users only |
| Day 15 | Prod: flag ON for primary clinic |
| Day 30 | Prod: flag ON for all clinics (after metrics review) |
| Rollback | Set flag OFF → legacy `customContent` editor returns; no data loss (snapshot rows remain in DB) |

Kill switch: env var checked in `(dashboard)/visits/[visitId]/diet-chart/page.tsx` server component; no client-side flag exposure.

---

## 13. Observability & Analytics

| Signal | Source | Why |
|---|---|---|
| `diet.generate.duration_ms` | API middleware | P95 latency target |
| `diet.generate.violation_count` | Generator output | Quality of templates/data |
| `diet.swap.count_per_chart` | Save handler | Doctor trust signal |
| `diet.chart.saved_per_visit_pct` | Daily cron | Adoption KPI |
| `diet.whatsapp.send_success_rate` | WA module | Delivery health |
| `diet.template.use_count` | Save handler | Identifies dead templates |
| `diet.flag.fallback_to_legacy_count` | Render path | Detect bugs forcing fallback |

Surface in existing Admin reports section. No new infra — reuse existing analytics pipeline.

---

## 14. Dependencies & Owners

| Dep | Owner | Needed by |
|---|---|---|
| MD content review of seed data | Dr Rachana | End of P1 |
| Meta WhatsApp template approval | Reema | P5 start |
| Playwright already configured | DevOps | P2 start |
| Prisma migration playbook | Tech lead | P1 start |
| Lab document parser (for biomarkers auto-fill) | Future — manual entry in v1.0 | — |

---

## 15. Sprint Plan (suggested 2-week sprints)

| Sprint | Phase(s) | Outcome |
|---|---|---|
| S1 | P1 (start) | Schema + migration + 3 seeders + 200 foods curated |
| S2 | P1 (finish) + P2 (start) | All seed data done; targets+template-rank done |
| S3 | P2 (finish) | Generator passes all 5 golden scenarios; unit tests green |
| S4 | P3 + P4 (start) | Inputs form done; output grid scaffolded |
| S5 | P4 (finish) + P5 | Output UI complete; print + WA wired |
| S6 | P6 + P7 (start) | Reports + permissions; dogfood begins |
| S7 | P7 (finish) | Hardened; prod flag ON for primary clinic |

---

## 16. Definition of Done (per phase)

A phase ships when **every** of:
1. All tickets in the phase merged to main
2. Every `[ ]` checkpoint inside that phase ticked
3. PR includes updates to this implementation plan (mark checkpoints `[x]`)
4. Tests added (unit + integration + E2E where applicable) and passing in CI
5. No regression in existing diet-chart legacy flow (flag-off path)
6. MD has reviewed any new clinical content (rules, templates, copy on PDF)

---

## 17. Risks (delta from PRD §19 — focused on execution)

| Risk | Mitigation |
|---|---|
| Curating 500 foods + 200 recipes is slow & error-prone | Split between MD (clinical correctness) and engineer (CSV correctness); seed in tranches of 100; gate later tranches behind first tranche dogfood |
| Prisma migration on Supabase prod fails | Test on a Supabase snapshot first; `prisma migrate diff` reviewed in PR |
| Playwright PDF snapshot flakiness on CI | Pin Chromium version; isolate to single worker; allow 2-pixel diff tolerance |
| LLM creep in v1.0 | This plan has NO LLM tickets; reject any PR adding model calls in `src/lib/diet/` before v1.1 |
| Doctor finds generator outputs implausible | Dogfood phase is 2 weeks specifically to catch this; rollback flag exists |
| Schema churn during P3/P4 as UI surfaces gaps | Lock schema at end of P1; UI feature requests during P3/P4 go to v1.1 backlog |

---

## 18. Master Checkpoint Roll-up (single-screen view)

> Source of truth for "are we done?". Each line is a phase checkpoint count.

- [ ] **P1 — Schema & Seed** (12 checkpoints) — see §4.5
- [ ] **P2 — Generator Engine** (11 checkpoints) — see §5.7
- [ ] **P3 — Inputs UI** (10 checkpoints) — see §6.5
- [ ] **P4 — Output UI** (10 checkpoints) — see §7.5
- [ ] **P5 — Print + WhatsApp** (8 checkpoints) — see §8.3
- [ ] **P6 — Reports + Permissions** (6 checkpoints) — see §9.2
- [ ] **P7 — Pilot Hardening** (8 checkpoints) — see §10.2

**Total: 65 checkpoints** across 10 weeks.

When all 65 tick → DCG v1.0 is shippable to all clinics.

---

## 19. References

- PRD: `clinicman/doc/final_diet.md`
- Earlier briefs: `clinicman/doc/diet_req.md`, `clinicman/doc/ref_diet_prd.md`
- NIN PDF: `clinicman/doc/DietaryGuidelinesforNINwebsite.pdf`
- Seed pattern reference: `clinicman/web/prisma/seed-yoga.ts`
- Existing diet artefacts to preserve: `clinicman/web/src/app/(dashboard)/diet-templates/page.tsx`, `(dashboard)/visits/[visitId]/diet-chart/page.tsx`, `(print)/visits/[visitId]/diet-chart/print/page.tsx`, `api/diet-templates/route.ts`, `api/patient-diet-charts/route.ts`
- Memory: [[prd-diet-module]] · [[prd-yoga-library]] · [[project-requirements-checklist]]
