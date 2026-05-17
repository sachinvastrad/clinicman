import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const vitalsSchema = z.object({
  bp:          z.string().optional().nullable(),
  pulse:       z.number().optional().nullable(),
  temperature: z.number().optional().nullable(),
  weight:      z.number().optional().nullable(),
  height:      z.number().optional().nullable(),
  spo2:        z.number().optional().nullable(),
}).optional().nullable();

const createVisitSchema = z.object({
  patientId:        z.string().uuid(),
  visitType:        z.enum(["consultation", "follow_up", "emergency", "teleconsultation", "case_taking"]).default("consultation"),
  chiefComplaint:   z.string().optional().nullable(),
  clinicalFindings: z.string().optional().nullable(),
  diagnosis:        z.string().optional().nullable(),
  planOfAction:     z.string().optional().nullable(),
  followUpDate:     z.string().optional().nullable(),
  improvementScore: z.number().int().min(0).max(10).optional().nullable(),
  vitals:           vitalsSchema,
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createVisitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const patient = await prisma.patient.findFirst({ where: { id: parsed.data.patientId, clinicId: user.clinic_id } });
  if (!patient) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  const { vitals, followUpDate, ...visitData } = parsed.data;

  const visit = await prisma.visit.create({
    data: {
      clinicId:        user.clinic_id,
      doctorId:        user.id,
      visitDate:       new Date(),
      visitType:       visitData.visitType as never,
      chiefComplaint:  visitData.chiefComplaint ?? null,
      clinicalFindings:visitData.clinicalFindings ?? null,
      diagnosis:       visitData.diagnosis ?? null,
      planOfAction:    visitData.planOfAction ?? null,
      followUpDate:    followUpDate ? new Date(followUpDate) : null,
      improvementScore:visitData.improvementScore ?? null,
      patientId:       visitData.patientId,
      ...(vitals && {
        vitals: {
          create: {
            patientId:   visitData.patientId,
            bp:          vitals.bp ?? null,
            pulse:       vitals.pulse ?? null,
            temperature: vitals.temperature ?? null,
            weight:      vitals.weight ?? null,
            height:      vitals.height ?? null,
            spo2:        vitals.spo2 ?? null,
          },
        },
      }),
    },
    include: { vitals: true },
  });

  return NextResponse.json({ data: visit }, { status: 201 });
}
