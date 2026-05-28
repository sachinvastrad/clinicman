import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid(),
  dietTemplateId: z.string().uuid().optional(),
  customContent: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const visitId = searchParams.get("visitId");

  const charts = await prisma.patientDietChart.findMany({
    where: {
      clinicId: user.clinic_id,
      ...(patientId && { patientId }),
      ...(visitId && { visitId }),
    },
    orderBy: { createdAt: "desc" },
    include: { dietTemplate: { select: { name: true } } },
  });

  return NextResponse.json({ data: charts });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  // Check visit belongs to clinic
  const visit = await prisma.visit.findFirst({ where: { id: parsed.data.visitId, clinicId: user.clinic_id } });
  if (!visit) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", status: 404 } }, { status: 404 });

  const chart = await prisma.patientDietChart.create({
    data: {
      clinicId: user.clinic_id,
      patientId: parsed.data.patientId,
      visitId: parsed.data.visitId,
      createdAt: parsed.data.date ? new Date(parsed.data.date) : undefined,
      dietTemplateId: parsed.data.dietTemplateId,
      customContent: parsed.data.customContent,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json({ data: chart }, { status: 201 });
}
