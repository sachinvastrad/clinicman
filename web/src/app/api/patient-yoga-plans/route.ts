import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  yogaAsanaId: z.string().uuid(),
  duration: z.string().optional(),
  repetitions: z.string().optional(),
  instructions: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const schema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid(),
  notes: z.string().optional(),
  date: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const visitId = searchParams.get("visitId");

  const plans = await prisma.patientYogaPlan.findMany({
    where: {
      clinicId: user.clinic_id,
      ...(patientId && { patientId }),
      ...(visitId && { visitId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { yogaAsana: { select: { name: true, sanskritName: true, category: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ data: plans });
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

  const plan = await prisma.patientYogaPlan.create({
    data: {
      clinicId: user.clinic_id,
      patientId: parsed.data.patientId,
      visitId: parsed.data.visitId,
      createdAt: parsed.data.date ? new Date(parsed.data.date) : undefined,
      notes: parsed.data.notes,
      items: {
        create: parsed.data.items.map((item, idx) => ({
          yogaAsanaId: item.yogaAsanaId,
          duration: item.duration,
          repetitions: item.repetitions,
          instructions: item.instructions,
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
    include: {
      items: { include: { yogaAsana: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ data: plan }, { status: 201 });
}
