-- Diet Chart Generator v1 — additive migration
-- Adds: Food / Recipe / RecipeIngredient / FoodSubstitution / PatientBiomarker
-- Extends: patients (~60 cols), diet_templates (~20 cols), patient_diet_charts (~10 cols)
-- Safe: every new column is nullable or has a default. No drops. No type changes on existing data.

-- ──────────────────────────────────────────────────────────────────────────────
-- Patient — diet profile extensions
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "patients" ADD COLUMN "height_cm"             REAL;
ALTER TABLE "patients" ADD COLUMN "current_weight_kg"     REAL;
ALTER TABLE "patients" ADD COLUMN "target_weight_kg"      REAL;
ALTER TABLE "patients" ADD COLUMN "waist_cm"              REAL;
ALTER TABLE "patients" ADD COLUMN "hip_cm"                REAL;
ALTER TABLE "patients" ADD COLUMN "body_fat_pct"          REAL;
ALTER TABLE "patients" ADD COLUMN "skeletal_muscle_kg"    REAL;
ALTER TABLE "patients" ADD COLUMN "pregnancy_status"      TEXT;
ALTER TABLE "patients" ADD COLUMN "menstrual_phase"       TEXT;
ALTER TABLE "patients" ADD COLUMN "menopause_status"      TEXT;
ALTER TABLE "patients" ADD COLUMN "activity_level"        TEXT;
ALTER TABLE "patients" ADD COLUMN "exercise_types"        TEXT;
ALTER TABLE "patients" ADD COLUMN "exercise_mins_week"    INTEGER;
ALTER TABLE "patients" ADD COLUMN "work_shift"            TEXT;
ALTER TABLE "patients" ADD COLUMN "avg_steps_per_day"     INTEGER;
ALTER TABLE "patients" ADD COLUMN "diet_type"             TEXT;
ALTER TABLE "patients" ADD COLUMN "therapeutic_patterns"  TEXT;
ALTER TABLE "patients" ADD COLUMN "religious_tags"        TEXT;
ALTER TABLE "patients" ADD COLUMN "fasting_days"          TEXT;
ALTER TABLE "patients" ADD COLUMN "fasting_window"        TEXT;
ALTER TABLE "patients" ADD COLUMN "ayurvedic_prakriti"    TEXT;
ALTER TABLE "patients" ADD COLUMN "ayurvedic_vikriti"     TEXT;
ALTER TABLE "patients" ADD COLUMN "homeo_constitution"    TEXT;
ALTER TABLE "patients" ADD COLUMN "somatotype"            TEXT;
ALTER TABLE "patients" ADD COLUMN "blood_group"           TEXT;
ALTER TABLE "patients" ADD COLUMN "allergens"             TEXT;
ALTER TABLE "patients" ADD COLUMN "food_intolerances"     TEXT;
ALTER TABLE "patients" ADD COLUMN "food_loves"            TEXT;
ALTER TABLE "patients" ADD COLUMN "food_dislikes"         TEXT;
ALTER TABLE "patients" ADD COLUMN "texture_aversions"     TEXT;
ALTER TABLE "patients" ADD COLUMN "spice_tolerance"       TEXT;
ALTER TABLE "patients" ADD COLUMN "sweet_tooth"           TEXT;
ALTER TABLE "patients" ADD COLUMN "macro_region"          TEXT;
ALTER TABLE "patients" ADD COLUMN "state"                 TEXT;
ALTER TABLE "patients" ADD COLUMN "sub_region"            TEXT;
ALTER TABLE "patients" ADD COLUMN "city"                  TEXT;
ALTER TABLE "patients" ADD COLUMN "climate"               TEXT;
ALTER TABLE "patients" ADD COLUMN "diaspora_variant"      TEXT;
ALTER TABLE "patients" ADD COLUMN "cuisine_region"        TEXT;
ALTER TABLE "patients" ADD COLUMN "sleep_hours_avg"       REAL;
ALTER TABLE "patients" ADD COLUMN "sleep_quality"         TEXT;
ALTER TABLE "patients" ADD COLUMN "bedtime_clock"         TEXT;
ALTER TABLE "patients" ADD COLUMN "waketime_clock"        TEXT;
ALTER TABLE "patients" ADD COLUMN "stress_level"          TEXT;
ALTER TABLE "patients" ADD COLUMN "water_intake_l"        REAL;
ALTER TABLE "patients" ADD COLUMN "caffeine_cups_day"     INTEGER;
ALTER TABLE "patients" ADD COLUMN "alcohol_freq"          TEXT;
ALTER TABLE "patients" ADD COLUMN "tobacco_use"           TEXT;
ALTER TABLE "patients" ADD COLUMN "bowel_freq_day"        REAL;
ALTER TABLE "patients" ADD COLUMN "bristol_stool"         INTEGER;
ALTER TABLE "patients" ADD COLUMN "eat_out_freq"          TEXT;
ALTER TABLE "patients" ADD COLUMN "cooked_by"             TEXT;
ALTER TABLE "patients" ADD COLUMN "equipment_available"   TEXT;
ALTER TABLE "patients" ADD COLUMN "cooking_time_tier"     TEXT;
ALTER TABLE "patients" ADD COLUMN "meal_prep_style"       TEXT;
ALTER TABLE "patients" ADD COLUMN "household_size"        INTEGER;
ALTER TABLE "patients" ADD COLUMN "travel_days_month"     INTEGER;
ALTER TABLE "patients" ADD COLUMN "budget_tier"           TEXT;
ALTER TABLE "patients" ADD COLUMN "locale_tier"           TEXT;
ALTER TABLE "patients" ADD COLUMN "seasonality_pref"      TEXT;

-- ──────────────────────────────────────────────────────────────────────────────
-- DietTemplate — generator targets & scaffolds
-- ──────────────────────────────────────────────────────────────────────────────
-- Note: column 'content' was previously NOT NULL; SQLite cannot alter NOT NULL → NULLABLE
-- in place. We accept that legacy rows continue to have content; new rows can leave it ''.
-- The application code MUST default content='' when only structured fields are supplied.

ALTER TABLE "diet_templates" ADD COLUMN "diet_type"                  TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "age_group"                  TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "goal"                       TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "condition_tags"             TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "cuisine_regions"            TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "target_kcal"                INTEGER;
ALTER TABLE "diet_templates" ADD COLUMN "macro_split"                TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "protein_per_kg"             REAL;
ALTER TABLE "diet_templates" ADD COLUMN "gi_cap"                     INTEGER;
ALTER TABLE "diet_templates" ADD COLUMN "salt_cap_g"                 REAL;
ALTER TABLE "diet_templates" ADD COLUMN "added_sugar_cap_g"          REAL;
ALTER TABLE "diet_templates" ADD COLUMN "oil_cap_ml"                 REAL;
ALTER TABLE "diet_templates" ADD COLUMN "potassium_cap_mg"           REAL;
ALTER TABLE "diet_templates" ADD COLUMN "water_target_l"             REAL;
ALTER TABLE "diet_templates" ADD COLUMN "slot_distribution"          TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "slot_food_groups"           TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "allowed_foods"              TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "avoid_foods"                TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "lifestyle_notes"            TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "supplement_hints"           TEXT;
ALTER TABLE "diet_templates" ADD COLUMN "requires_dietitian_review"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "diet_templates" ADD COLUMN "source"                     TEXT;

CREATE INDEX "diet_templates_diet_type_goal_idx" ON "diet_templates"("diet_type", "goal");

-- ──────────────────────────────────────────────────────────────────────────────
-- PatientDietChart — generator output
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "patient_diet_charts" ADD COLUMN "inputs"             TEXT;
ALTER TABLE "patient_diet_charts" ADD COLUMN "snapshot"           TEXT;
ALTER TABLE "patient_diet_charts" ADD COLUMN "grocery_list"       TEXT;
ALTER TABLE "patient_diet_charts" ADD COLUMN "patient_overrides"  TEXT;
ALTER TABLE "patient_diet_charts" ADD COLUMN "avg_daily_kcal"     INTEGER;
ALTER TABLE "patient_diet_charts" ADD COLUMN "avg_daily_gi"       INTEGER;
ALTER TABLE "patient_diet_charts" ADD COLUMN "pdf_url"            TEXT;
ALTER TABLE "patient_diet_charts" ADD COLUMN "whatsapp_sent_at"   DATETIME;
ALTER TABLE "patient_diet_charts" ADD COLUMN "version"            INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "patient_diet_charts" ADD COLUMN "created_by"         TEXT;

-- ──────────────────────────────────────────────────────────────────────────────
-- Food
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "foods" (
    "id"                TEXT NOT NULL PRIMARY KEY,
    "name"              TEXT NOT NULL,
    "name_local"        TEXT,
    "category"          TEXT NOT NULL,
    "sub_category"      TEXT,
    "veg_type"          TEXT NOT NULL,
    "cuisine_regions"   TEXT,
    "kcal"              REAL NOT NULL,
    "protein_g"         REAL NOT NULL,
    "carb_g"            REAL NOT NULL,
    "fat_g"             REAL NOT NULL,
    "fiber_g"           REAL,
    "sugar_g"           REAL,
    "sodium_mg"         REAL,
    "potassium_mg"      REAL,
    "calcium_mg"        REAL,
    "iron_mg"           REAL,
    "vitamin_a_ug"      REAL,
    "vitamin_c_mg"      REAL,
    "vitamin_d_ug"      REAL,
    "vitamin_b12_ug"    REAL,
    "folate_ug"         REAL,
    "omega3_g"          REAL,
    "gi"                INTEGER,
    "glycemic_load_per_100g" REAL,
    "allergens"         TEXT,
    "fodmap_level"      TEXT,
    "disease_allowed"   TEXT,
    "disease_restricted" TEXT,
    "seasonality"       TEXT,
    "cost_tier"         TEXT,
    "unit_cost_inr"     REAL,
    "default_portion_g" REAL NOT NULL,
    "default_portion_desc" TEXT,
    "source"            TEXT,
    "created_at"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        DATETIME NOT NULL
);
CREATE UNIQUE INDEX "foods_name_key"            ON "foods"("name");
CREATE INDEX        "foods_category_veg_idx"    ON "foods"("category", "veg_type");
CREATE INDEX        "foods_gi_idx"              ON "foods"("gi");

-- ──────────────────────────────────────────────────────────────────────────────
-- Recipe
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "recipes" (
    "id"                  TEXT NOT NULL PRIMARY KEY,
    "name"                TEXT NOT NULL,
    "cuisine"             TEXT,
    "meal_slots"          TEXT,
    "veg_type"            TEXT NOT NULL,
    "prep_time_min"       INTEGER NOT NULL,
    "difficulty"          TEXT,
    "servings_base"       INTEGER NOT NULL DEFAULT 1,
    "kcal_per_serving"    REAL NOT NULL,
    "protein_g_per_serving" REAL NOT NULL,
    "carb_g_per_serving"  REAL NOT NULL,
    "fat_g_per_serving"   REAL NOT NULL,
    "gi_estimate"         INTEGER,
    "instructions"        TEXT,
    "must_pair_with"      TEXT,
    "tags"                TEXT,
    "source"              TEXT,
    "created_at"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          DATETIME NOT NULL
);
CREATE UNIQUE INDEX "recipes_name_key" ON "recipes"("name");

-- ──────────────────────────────────────────────────────────────────────────────
-- RecipeIngredient
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "recipe_ingredients" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "recipe_id" TEXT NOT NULL,
    "food_id"   TEXT NOT NULL,
    "qty_g"     REAL NOT NULL,
    "note"      TEXT,
    CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recipe_ingredients_food_id_fkey"   FOREIGN KEY ("food_id")   REFERENCES "foods"   ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");
CREATE INDEX "recipe_ingredients_food_id_idx"   ON "recipe_ingredients"("food_id");

-- ──────────────────────────────────────────────────────────────────────────────
-- FoodSubstitution
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "food_substitutions" (
    "id"               TEXT NOT NULL PRIMARY KEY,
    "from_food_id"     TEXT NOT NULL,
    "to_food_id"       TEXT NOT NULL,
    "context_slot"     TEXT,
    "reason"           TEXT,
    "similarity_score" REAL NOT NULL DEFAULT 0.7,
    CONSTRAINT "food_substitutions_from_food_id_fkey" FOREIGN KEY ("from_food_id") REFERENCES "foods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "food_substitutions_to_food_id_fkey"   FOREIGN KEY ("to_food_id")   REFERENCES "foods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "food_substitutions_from_to_context_key" ON "food_substitutions"("from_food_id", "to_food_id", "context_slot");
CREATE INDEX        "food_substitutions_from_food_id_idx"    ON "food_substitutions"("from_food_id");

-- ──────────────────────────────────────────────────────────────────────────────
-- PatientBiomarker
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE "patient_biomarkers" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "patient_id"  TEXT NOT NULL,
    "visit_id"    TEXT,
    "marker"      TEXT NOT NULL,
    "value"       REAL NOT NULL,
    "unit"        TEXT NOT NULL,
    "measured_at" DATETIME NOT NULL,
    "source"      TEXT,
    "created_at"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patient_biomarkers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "patient_biomarkers_patient_marker_measured_idx" ON "patient_biomarkers"("patient_id", "marker", "measured_at");
