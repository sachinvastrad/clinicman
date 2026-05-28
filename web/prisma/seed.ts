import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedYogaLibrary } from "./seed-yoga";
import { seedDietFoods } from "./seed-diet-foods";
import { seedDietRecipes } from "./seed-diet-recipes";
import { seedDietSubstitutions } from "./seed-diet-subs";
import { seedDietTemplates } from "./seed-diet-templates";

const prisma = new PrismaClient();

async function main() {
  // ── Clinic ───────────────────────────────────────────────────────────────────
  const clinic = await prisma.clinic.upsert({
    where:  { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      name:           "Sachi Homeopathic Clinic",
      address:        "A103, police station, near varthur, Bengaluru, Karnataka 560087",
      phone:          "081474 27195",
      email:          "info@sachihomeo.in",
      whatsappNumber: "+918147427195",
      timezone:       "Asia/Kolkata",
    },
    create: {
      id:             "00000000-0000-0000-0000-000000000001",
      name:           "Sachi Homeopathic Clinic",
      address:        "A103, police station, near varthur, Bengaluru, Karnataka 560087",
      phone:          "081474 27195",
      email:          "info@sachihomeo.in",
      whatsappNumber: "+918147427195",
      timezone:       "Asia/Kolkata",
    },
  });
  console.log(`✓ Clinic: ${clinic.name}`);

  // ── Users ────────────────────────────────────────────────────────────────────
  const users = [
    {
      id:       "00000000-0000-0000-0000-000000000002",
      fullName: "Admin User",
      email:    "admin@sachihomeo.in",
      password: "Admin@123",
      role:     "admin" as const,
      phone:    "+919999999901",
    },
    {
      id:       "00000000-0000-0000-0000-000000000003",
      fullName: "Dr Rachana Vastrad BHMS",
      email:    "doctor@sachihomeo.in",
      password: "Doctor@123",
      role:     "doctor" as const,
      phone:    "+918147427195",
    },
    {
      id:       "00000000-0000-0000-0000-000000000004",
      fullName: "Receptionist",
      email:    "reception@sachihomeo.in",
      password: "Recep@123",
      role:     "receptionist" as const,
      phone:    "+919999999903",
    },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where:  { id: u.id },
      update: { passwordHash: hash, email: u.email, fullName: u.fullName, phone: u.phone },
      create: {
        id:           u.id,
        clinicId:     clinic.id,
        fullName:     u.fullName,
        email:        u.email,
        phone:        u.phone,
        passwordHash: hash,
        role:         u.role,
        isActive:     true,
      },
    });
    console.log(`✓ ${u.role}: ${u.email} / ${u.password}`);
  }

  // ── Yoga Library ─────────────────────────────────────────────────────────────
  console.log("\nSeeding yoga library…");
  await seedYogaLibrary(prisma, clinic.id);

  // ── Diet Library (DCG v1) ────────────────────────────────────────────────────
  console.log("\nSeeding diet library…");
  await seedDietFoods(prisma);
  await seedDietRecipes(prisma);
  await seedDietSubstitutions(prisma);
  await seedDietTemplates(prisma, clinic.id);

  console.log("\n─────────────────────────────────────");
  console.log("Seed complete. Open http://localhost:3000");
  console.log("─────────────────────────────────────");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
