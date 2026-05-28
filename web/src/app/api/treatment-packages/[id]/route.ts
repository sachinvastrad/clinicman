import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sessionCount: z.number().int().positive().optional(),
  validityDays: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

interface Props { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin only", status: 403 } }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const result = await prisma.treatmentPackage.updateMany({
    where: { id, clinicId: user.clinic_id },
    data: parsed.data,
  });

  if (result.count === 0) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", status: 404 } }, { status: 404 });
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin only", status: 403 } }, { status: 403 });

  const { id } = await params;
  await prisma.treatmentPackage.updateMany({ where: { id, clinicId: user.clinic_id }, data: { isActive: false } });
  return NextResponse.json({ data: { deleted: true } });
}
