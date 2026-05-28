// Seeds `diet_templates` from every *.json file in prisma/seed-data/diet/templates/.
// Idempotent upsert by (clinicId, name). Stores arrays/JSON as encoded strings.

import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

interface SeedTemplate {
  name: string;
  description?: string;
  diet_type?: string;
  age_group?: string;
  goal?: string;
  condition_tags?: string[];
  cuisine_regions?: string[];
  target_kcal?: number;
  macro_split?: { carbs_pct: number; protein_pct: number; fat_pct: number };
  protein_per_kg?: number;
  gi_cap?: number;
  salt_cap_g?: number;
  added_sugar_cap_g?: number;
  oil_cap_ml?: number;
  potassium_cap_mg?: number;
  water_target_l?: number;
  slot_distribution?: Record<string, number>;
  slot_food_groups?: Record<string, string[]>;
  allowed_foods?: string[];
  avoid_foods?: string[];
  lifestyle_notes?: string;
  supplement_hints?: string;
  requires_dietitian_review?: boolean;
  source?: string;
}

function js(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v) && v.length === 0) return undefined;
  if (typeof v === "object" && Object.keys(v as object).length === 0) return undefined;
  return JSON.stringify(v);
}

export async function seedDietTemplates(prisma: PrismaClient, clinicId: string): Promise<number> {
  const dir = path.join(__dirname, "seed-data", "diet", "templates");
  if (!existsSync(dir)) {
    console.log(`  ⚠ templates dir not found at ${dir} — skipping`);
    return 0;
  }
  const files = readdirSync(dir).filter(f => f.endsWith(".json"));
  let count = 0;

  for (const f of files) {
    const raw = readFileSync(path.join(dir, f), "utf8");
    let tpl: SeedTemplate;
    try { tpl = JSON.parse(raw); } catch (e) {
      console.warn(`  ⚠ ${f}: invalid JSON — skipped`);
      continue;
    }
    if (!tpl.name) continue;
    const data = {
      clinicId:               clinicId,
      name:                   tpl.name,
      description:            tpl.description ?? null,
      content:                "",                                  // legacy NOT NULL — empty for structured rows
      dietType:               tpl.diet_type ?? null,
      ageGroup:               tpl.age_group ?? null,
      goal:                   tpl.goal ?? null,
      conditionTags:          js(tpl.condition_tags),
      cuisineRegions:         js(tpl.cuisine_regions),
      targetKcal:             tpl.target_kcal ?? null,
      macroSplit:             js(tpl.macro_split),
      proteinPerKg:           tpl.protein_per_kg ?? null,
      giCap:                  tpl.gi_cap ?? null,
      saltCapG:               tpl.salt_cap_g ?? null,
      addedSugarCapG:         tpl.added_sugar_cap_g ?? null,
      oilCapMl:               tpl.oil_cap_ml ?? null,
      potassiumCapMg:         tpl.potassium_cap_mg ?? null,
      waterTargetL:           tpl.water_target_l ?? null,
      slotDistribution:       js(tpl.slot_distribution),
      slotFoodGroups:         js(tpl.slot_food_groups),
      allowedFoods:           js(tpl.allowed_foods),
      avoidFoods:             js(tpl.avoid_foods),
      lifestyleNotes:         tpl.lifestyle_notes ?? null,
      supplementHints:        tpl.supplement_hints ?? null,
      requiresDietitianReview: tpl.requires_dietitian_review ?? false,
      source:                 tpl.source ?? "NIN-2024-DGI",
      isActive:               true,
    } as const;

    // Upsert by (clinicId, name) — emulated since Prisma has no native composite-natural-key here
    const existing = await prisma.dietTemplate.findFirst({ where: { clinicId, name: tpl.name } });
    if (existing) {
      await prisma.dietTemplate.update({ where: { id: existing.id }, data });
    } else {
      await prisma.dietTemplate.create({ data });
    }
    count++;
  }
  console.log(`  ✓ Templates upserted: ${count}`);
  return count;
}
