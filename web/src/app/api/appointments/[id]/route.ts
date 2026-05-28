import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["scheduled", "confirmed", "arrived", "in_progress", "completed", "cancelled", "no_show"]).optional(),
  notes:  z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({
    where:   { id, clinicId: user.clinic_id },
    include: { patient: { select: { fullName: true, phone: true, patientCode: true } } },
  });

  if (!appointment) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Appointment not found", status: 404 } }, { status: 404 });

  return NextResponse.json({ data: appointment });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({ where: { id, clinicId: user.clinic_id } });
  if (!appointment) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Appointment not found", status: 404 } }, { status: 404 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined && { status: parsed.data.status as never }),
      ...(parsed.data.notes  !== undefined && { notes:  parsed.data.notes }),
    },
  });

  return NextResponse.json({ data: updated });
}
