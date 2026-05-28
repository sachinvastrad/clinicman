import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sessionCount: z.number().int().positive(),
  validityDays: z.number().int().positive().optional(),
  price: z.number().nonnegative(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const packages = await prisma.treatmentPackage.findMany({
    where: { clinicId: user.clinic_id, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: packages });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin only", status: 403 } }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const pkg = await prisma.treatmentPackage.create({
    data: {
      clinicId: user.clinic_id,
      name: parsed.data.name,
      description: parsed.data.description,
      sessionCount: parsed.data.sessionCount,
      validityDays: parsed.data.validityDays,
      price: parsed.data.price,
      isActive: parsed.data.isActive ?? true,
      createdBy: user.id,
    },
  });

  return NextResponse.json({ data: pkg }, { status: 201 });
}
