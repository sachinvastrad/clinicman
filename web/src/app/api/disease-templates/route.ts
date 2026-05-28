import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  remedyName: z.string().min(1),
  potency: z.string().optional().default(""),
  form: z.string().optional(),
  dose: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const schema = z.object({
  name: z.string().min(1),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const diagnosis = searchParams.get("diagnosis");

  const templates = await prisma.diseaseTemplate.findMany({
    where: {
      clinicId: user.clinic_id,
      isActive: true,
      ...(diagnosis && { diagnosis: { contains: diagnosis } }),
    },
    orderBy: { name: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ data: templates });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const template = await prisma.diseaseTemplate.create({
    data: {
      clinicId: user.clinic_id,
      name: parsed.data.name,
      diagnosis: parsed.data.diagnosis,
      notes: parsed.data.notes,
      createdBy: user.id,
      items: parsed.data.items
        ? { create: parsed.data.items.map((item, idx) => ({ ...item, sortOrder: item.sortOrder ?? idx })) }
        : undefined,
    },
    include: { items: true },
  });

  return NextResponse.json({ data: template }, { status: 201 });
}
