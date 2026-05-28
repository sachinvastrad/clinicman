import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

// ── CSV parser (handles quoted fields with embedded commas/newlines) ───────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (c === "," && !inQuote) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): Record<string, string>[] {
  // Handle \r\n and \n
  const raw = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (inQuote && raw[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; current += c; }
    } else if (c === "\n" && !inQuote) {
      rows.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current.trim()) rows.push(current);

  const headers = parseCSVLine(rows[0]);
  return rows
    .slice(1)
    .filter((r) => r.trim())
    .map((r) => {
      const vals = parseCSVLine(r);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
    });
}

// ── Category normalizer ───────────────────────────────────────────────────────
function normalizeCategory(raw: string): string {
  const primary = raw.split("/")[0].trim().toLowerCase();
  if (primary.startsWith("seated"))                        return "Sitting";
  if (primary.startsWith("standing"))                      return "Standing";
  if (primary.startsWith("supine"))                        return "Supine";
  if (primary.startsWith("prone"))                         return "Prone";
  if (primary.startsWith("arm balance") ||
      primary.startsWith("arm leg"))                       return "Balancing";
  if (primary.startsWith("twist"))                         return "Twisting";
  if (primary.startsWith("breath") ||
      primary.startsWith("pranayama"))                     return "Breathing";
  if (primary.startsWith("meditat"))                       return "Meditation";
  return "Other";
}

// ── Main seeder ───────────────────────────────────────────────────────────────
export async function seedYogaLibrary(prisma: PrismaClient, clinicId: string) {
  const csvPath = path.resolve(
    "C:/Users/AILap/Documents/yogapose/pocketyoga_poses/all_poses.csv"
  );

  let content: string;
  try {
    content = readFileSync(csvPath, "utf8");
  } catch {
    console.warn("⚠  Yoga CSV not found at", csvPath, "— skipping yoga seed");
    return;
  }

  const rows = parseCSV(content);
  console.log(`  Parsing ${rows.length} poses…`);

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const slug        = row["slug"]?.trim();
    const poseName    = row["pose_name"]?.trim();
    const sanskrit    = row["sanskrit"]?.trim();
    const category    = normalizeCategory(row["category"] ?? "");
    const difficulty  = row["difficulty"]?.trim();
    const description = row["description"]?.trim();
    const benefits    = row["benefits"]?.trim();

    if (!poseName || !slug) continue;

    const fullDesc = [
      difficulty ? `Difficulty: ${difficulty}` : "",
      description,
    ].filter(Boolean).join("\n\n");

    // Primary image: {slug}_1.png served from public/uploads/yoga/
    const imageUrl = `/uploads/yoga/${slug}_1.png`;

    const existing = await prisma.yogaAsana.findFirst({
      where: { clinicId, name: poseName },
      select: { id: true },
    });

    if (existing) {
      await prisma.yogaAsana.update({
        where: { id: existing.id },
        data: {
          sanskritName: sanskrit || null,
          category,
          description:  fullDesc || null,
          benefits:     benefits || null,
          imageUrl,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.yogaAsana.create({
        data: {
          clinicId,
          name:        poseName,
          sanskritName: sanskrit || null,
          category,
          description:  fullDesc || null,
          benefits:     benefits || null,
          imageUrl,
          isActive: true,
        },
      });
      created++;
    }
  }

  console.log(`✓ Yoga library: ${created} created, ${updated} updated (${rows.length} total poses)`);
}
