// Seeds the `recipes` table from prisma/seed-data/diet/recipes.json.
// Idempotent upsert by `name`. Ingredients are resolved by food name → foodId.

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

interface SeedIngredient { food_name: string; qty_g: number; note?: string; }
interface SeedRecipe {
  name: string;
  cuisine?: string;
  meal_slots?: string[];
  veg_type?: string;            // "VEG"|"EGG"|"NON_VEG"|"VEGAN"|"JAIN"
  prep_time_min?: number;
  difficulty?: string;
  servings_base?: number;
  kcal_per_serving?: number;
  protein_g_per_serving?: number;
  carb_g_per_serving?: number;
  fat_g_per_serving?: number;
  gi_estimate?: number;
  instructions?: string;
  must_pair_with?: string[];
  tags?: string[];
  source?: string;
  ingredients?: SeedIngredient[];
}

function jsonArr(arr?: string[]): string | undefined {
  if (!arr || arr.length === 0) return undefined;
  return JSON.stringify(arr);
}

export async function seedDietRecipes(prisma: PrismaClient): Promise<number> {
  const jsonPath = path.join(__dirname, "seed-data", "diet", "recipes.json");
  let raw: string;
  try {
    raw = readFileSync(jsonPath, "utf8");
  } catch {
    console.log(`  ⚠ recipes.json not found at ${jsonPath} — skipping`);
    return 0;
  }
  const recipes: SeedRecipe[] = JSON.parse(raw);
  let count = 0;
  let skipped = 0;

  for (const r of recipes) {
    if (!r.name) continue;
    const data = {
      name:               r.name,
      cuisine:            r.cuisine ?? undefined,
      mealSlots:          jsonArr(r.meal_slots),
      vegType:            r.veg_type ?? "VEG",
      prepTimeMin:        r.prep_time_min ?? 20,
      difficulty:         r.difficulty ?? "easy",
      servingsBase:       r.servings_base ?? 1,
      kcalPerServing:     r.kcal_per_serving ?? 0,
      proteinGPerServing: r.protein_g_per_serving ?? 0,
      carbGPerServing:    r.carb_g_per_serving ?? 0,
      fatGPerServing:     r.fat_g_per_serving ?? 0,
      giEstimate:         r.gi_estimate,
      instructions:       r.instructions ?? undefined,
      mustPairWith:       jsonArr(r.must_pair_with),
      tags:               jsonArr(r.tags),
      source:             r.source ?? "Clinic-Curated",
    } as const;

    const upserted = await prisma.recipe.upsert({
      where:  { name: r.name },
      update: data,
      create: data,
    });

    // Replace ingredient list (idempotent)
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: upserted.id } });
    for (const ing of r.ingredients ?? []) {
      const food = await prisma.food.findUnique({ where: { name: ing.food_name } });
      if (!food) { skipped++; continue; }
      await prisma.recipeIngredient.create({
        data: {
          recipeId: upserted.id,
          foodId:   food.id,
          qtyG:     ing.qty_g,
          note:     ing.note,
        },
      });
    }
    count++;
  }
  console.log(`  ✓ Recipes upserted: ${count}${skipped ? ` (skipped ${skipped} unknown ingredients)` : ""}`);
  return count;
}
