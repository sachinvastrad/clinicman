// Seeds the `foods` table from prisma/seed-data/diet/foods.csv.
// CSV parsing handles quoted fields with embedded commas. Idempotent upsert by `name`.

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

function parseCSVRows(content: string): string[][] {
  const raw = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let current = "";
  let inQuote = false;
  const row: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (inQuote && raw[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (c === "," && !inQuote) {
      row.push(current);
      current = "";
    } else if (c === "\n" && !inQuote) {
      row.push(current);
      rows.push([...row]);
      row.length = 0;
      current = "";
    } else {
      current += c;
    }
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows.filter(r => r.some(c => c.trim().length > 0));
}

function toRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const header = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
}

function num(v: string): number | undefined {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function jsonArray(v: string): string | undefined {
  if (!v) return undefined;
  // Accept either semicolon-separated ("rice;wheat") or pipe-separated
  const parts = v.split(/[;|]/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  return JSON.stringify(parts);
}

function jsonNameLocal(hi?: string, kn?: string, ta?: string, bn?: string): string | undefined {
  const obj: Record<string, string> = {};
  if (hi) obj.hi = hi;
  if (kn) obj.kn = kn;
  if (ta) obj.ta = ta;
  if (bn) obj.bn = bn;
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : undefined;
}

export async function seedDietFoods(prisma: PrismaClient): Promise<number> {
  const csvPath = path.join(__dirname, "seed-data", "diet", "foods.csv");
  let content: string;
  try {
    content = readFileSync(csvPath, "utf8");
  } catch {
    console.log(`  ⚠ foods.csv not found at ${csvPath} — skipping`);
    return 0;
  }
  const records = toRecords(parseCSVRows(content));
  let count = 0;

  for (const r of records) {
    if (!r.name) continue;
    const data = {
      name:             r.name,
      nameLocal:        jsonNameLocal(r.name_local_hi, r.name_local_kn, r.name_local_ta, r.name_local_bn),
      category:         r.category || "OTHER",
      subCategory:      r.sub_category || undefined,
      vegType:          r.veg_type || "VEG",
      cuisineRegions:   jsonArray(r.cuisine_regions),
      kcal:             num(r.kcal) ?? 0,
      proteinG:         num(r.protein_g) ?? 0,
      carbG:            num(r.carb_g) ?? 0,
      fatG:             num(r.fat_g) ?? 0,
      fiberG:           num(r.fiber_g),
      sugarG:           num(r.sugar_g),
      sodiumMg:         num(r.sodium_mg),
      potassiumMg:      num(r.potassium_mg),
      calciumMg:        num(r.calcium_mg),
      ironMg:           num(r.iron_mg),
      vitaminAUg:       num(r.vitamin_a_ug),
      vitaminCMg:       num(r.vitamin_c_mg),
      vitaminDUg:       num(r.vitamin_d_ug),
      vitaminB12Ug:     num(r.vitamin_b12_ug),
      folateUg:         num(r.folate_ug),
      omega3G:          num(r.omega3_g),
      gi:               num(r.gi) !== undefined ? Math.round(num(r.gi)!) : null,
      glycemicLoadPer100g: num(r.glycemic_load_per_100g),
      allergens:        jsonArray(r.allergens),
      fodmapLevel:      r.fodmap_level || undefined,
      diseaseAllowed:   jsonArray(r.disease_allowed),
      diseaseRestricted: jsonArray(r.disease_restricted),
      seasonality:      jsonArray(r.seasonality),
      costTier:         r.cost_tier || undefined,
      unitCostInr:      num(r.unit_cost_inr),
      defaultPortionG:  num(r.default_portion_g) ?? 100,
      defaultPortionDesc: r.default_portion_desc || undefined,
      source:           r.source || undefined,
    } as const;

    await prisma.food.upsert({
      where:  { name: data.name },
      update: data,
      create: data,
    });
    count++;
  }
  console.log(`  ✓ Foods upserted: ${count}`);
  return count;
}
