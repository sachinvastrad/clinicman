import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  remedyName:   z.string().min(1),
  potency:      z.string().min(1),
  form:         z.string().optional().nullable(),
  dose:         z.string().optional().nullable(),
  frequency:    z.string().optional().nullable(),
  duration:     z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  sortOrder:    z.number().int().default(0),
});

const createPrescriptionSchema = z.object({
  visitId:      z.string().uuid(),
  dietaryNotes: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  date:         z.string().optional().nullable(),
  items:        z.array(itemSchema).min(1, "At least one remedy is required"),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const visitId   = searchParams.get("visitId");
  const patientId = searchParams.get("patientId");

  const prescriptions = await prisma.prescription.findMany({
    where: {
      doctor: { clinicId: user.clinic_id },
      ...(visitId   && { visitId }),
      ...(patientId && { patientId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      visit: {
        include: {
          patient: { select: { fullName: true, patientCode: true, id: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: prescriptions });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createPrescriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const visit = await prisma.visit.findFirst({
    where: { id: parsed.data.visitId, clinicId: user.clinic_id },
  });
  if (!visit) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", status: 404 } }, { status: 404 });

  const existing = await prisma.prescription.findUnique({ where: { visitId: parsed.data.visitId } });
  if (existing) return NextResponse.json({ error: { code: "CONFLICT", message: "A prescription already exists for this visit", status: 409 } }, { status: 409 });

  const prescription = await prisma.prescription.create({
    data: {
      visitId:      parsed.data.visitId,
      patientId:    visit.patientId,
      doctorId:     user.id,
      createdAt:    parsed.data.date ? new Date(parsed.data.date) : undefined,
      dietaryNotes: parsed.data.dietaryNotes ?? null,
      followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : null,
      items: {
        create: parsed.data.items.map((item, idx) => ({
          remedyName:   item.remedyName,
          potency:      item.potency,
          form:         item.form ?? null,
          dose:         item.dose ?? null,
          frequency:    item.frequency ?? null,
          duration:     item.duration ?? null,
          instructions: item.instructions ?? null,
          sortOrder:    item.sortOrder ?? idx,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ data: prescription }, { status: 201 });
}
