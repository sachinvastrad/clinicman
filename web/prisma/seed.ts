import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a demo clinic
  const clinic = await prisma.clinic.upsert({
    where:  { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id:            "00000000-0000-0000-0000-000000000001",
      name:          "DrMan Demo Clinic",
      address:       "123 Health Street, Mumbai, Maharashtra 400001",
      phone:         "+912212345678",
      email:         "demo@drman.ai",
      whatsappNumber:"+919876543210",
      timezone:      "Asia/Kolkata",
    },
  });

  console.log(`Seeded clinic: ${clinic.name} (${clinic.id})`);
  console.log("\nNext steps:");
  console.log("1. Create a Supabase auth user with phone +919999999999");
  console.log("2. Insert a row in public.users with the auth user's UUID, clinic_id, role=admin");
  console.log("3. Log in with OTP to test the app");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
