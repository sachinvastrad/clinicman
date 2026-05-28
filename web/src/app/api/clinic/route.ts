import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateClinicSchema = z.object({
  name:           z.string().min(1).optional(),
  address:        z.string().optional().nullable(),
  phone:          z.string().optional().nullable(),
  email:          z.string().email("Invalid email").optional().nullable(),
  gstin:          z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  timezone:       z.string().optional(),
});

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const clinic = await prisma.clinic.findUnique({ where: { id: user.clinic_id } });
  if (!clinic) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Clinic not found", status: 404 } }, { status: 404 });

  return NextResponse.json({ data: clinic });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required", status: 403 } }, { status: 403 });

  const body = await req.json();
  const parsed = updateClinicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const clinic = await prisma.clinic.update({
    where: { id: user.clinic_id },
    data:  parsed.data,
  });

  return NextResponse.json({ data: clinic });
}
