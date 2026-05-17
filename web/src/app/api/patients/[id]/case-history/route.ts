import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface Ctx { params: Promise<{ id: string }> }

const caseHistorySchema = z.object({
  hopi:                 z.string().optional().nullable(),
  pastHistory:          z.string().optional().nullable(),
  familyHistory:        z.string().optional().nullable(),
  personalHistory:      z.string().optional().nullable(),
  mentalGenerals:       z.string().optional().nullable(),
  physicalGenerals:     z.string().optional().nullable(),
  pqrsSymptoms:         z.string().optional().nullable(),
  constitutionType:     z.string().optional().nullable(),
  thermalState:         z.string().optional().nullable(),
  mentalDisposition:    z.string().optional().nullable(),
  miasmaticNotes:       z.string().optional().nullable(),
  dominantMiasm:        z.string().optional().nullable(),
  repertorizationNotes: z.string().optional().nullable(),
  selectedRemedy:       z.string().optional().nullable(),
  potency:              z.string().optional().nullable(),
  clinicalDiagnosis:    z.string().optional().nullable(),
  differentialDiagnosis:z.string().optional().nullable(),
  investigations:       z.string().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;

  const patient = await prisma.patient.findFirst({ where: { id, clinicId: user.clinic_id } });
  if (!patient) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  const body = await req.json();
  const parsed = caseHistorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400 } }, { status: 400 });
  }

  const caseHistory = await prisma.caseHistory.upsert({
    where:  { patientId: id },
    create: { patientId: id, ...parsed.data },
    update: { ...parsed.data },
  });

  return NextResponse.json({ data: caseHistory });
}
