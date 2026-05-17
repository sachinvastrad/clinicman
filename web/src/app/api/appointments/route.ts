import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createApptSchema = z.object({
  patientId:       z.string().uuid(),
  scheduledAt:     z.string().datetime({ local: true }),
  duration:        z.number().int().min(5).max(240).default(30),
  appointmentType: z.enum(["consultation", "follow_up", "emergency", "teleconsultation"]).default("consultation"),
  notes:           z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const date      = searchParams.get("date");
  const patientId = searchParams.get("patientId");

  const where: Record<string, unknown> = { clinicId: user.clinic_id };
  if (patientId) where.patientId = patientId;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.scheduledAt = { gte: d, lt: next };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: { patient: { select: { fullName: true, phone: true, patientCode: true } } },
  });

  return NextResponse.json({ data: appointments });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createApptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  // Verify patient belongs to clinic
  const patient = await prisma.patient.findFirst({ where: { id: parsed.data.patientId, clinicId: user.clinic_id } });
  if (!patient) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  const appointment = await prisma.appointment.create({
    data: {
      clinicId:        user.clinic_id,
      patientId:       parsed.data.patientId,
      scheduledAt:     new Date(parsed.data.scheduledAt),
      duration:        parsed.data.duration,
      appointmentType: parsed.data.appointmentType as never,
      notes:           parsed.data.notes ?? null,
      createdBy:       user.id,
    },
  });

  return NextResponse.json({ data: appointment }, { status: 201 });
}
