// Seeds the `food_substitutions` table from prisma/seed-data/diet/substitutions.csv.
// Idempotent upsert by (from_food_id, to_food_id, context_slot).

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

function parseCSVRows(content: string): string[][] {
  const raw = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let current = ""; let inQuote = false; const row: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (inQuote && raw[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (c === "," && !inQuote) { row.push(current); current = ""; }
    else if (c === "\n" && !inQuote) { row.push(current); rows.push([...row]); row.length = 0; current = ""; }
    else { current += c; }
  }
  if (current.length > 0 || row.length > 0) { row.push(current); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim().length > 0));
}

export async function seedDietSubstitutions(prisma: PrismaClient): Promise<number> {
  const csvPath = path.join(__dirname, "seed-data", "diet", "substitutions.csv");
  let content: string;
  try {
    content = readFileSync(csvPath, "utf8");
  } catch {
    console.log(`  ⚠ substitutions.csv not found at ${csvPath} — skipping`);
    return 0;
  }

  const rows = parseCSVRows(content);
  if (rows.length < 2) return 0;
  const header = rows[0].map(h => h.trim());
  const records = rows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });

  let count = 0; let skipped = 0;
  for (const r of records) {
    if (!r.from_food || !r.to_food) continue;
    const [from, to] = await Promise.all([
      prisma.food.findUnique({ where: { name: r.from_food } }),
      prisma.food.findUnique({ where: { name: r.to_food } }),
    ]);
    if (!from || !to) { skipped++; continue; }
    const contextSlot = r.context_slot && r.context_slot.length > 0 ? r.context_slot : null;
    const sim = Number(r.similarity_score);
    const data = {
      fromFoodId:      from.id,
      toFoodId:        to.id,
      contextSlot:     contextSlot,
      reason:          r.reason || undefined,
      similarityScore: Number.isFinite(sim) ? sim : 0.7,
    } as const;

    await prisma.foodSubstitution.upsert({
      where:  { fromFoodId_toFoodId_contextSlot: { fromFoodId: from.id, toFoodId: to.id, contextSlot: contextSlot as any } },
      update: data,
      create: data,
    });
    count++;
  }
  console.log(`  ✓ Substitutions upserted: ${count}${skipped ? ` (skipped ${skipped} unknown food refs)` : ""}`);
  return count;
}
