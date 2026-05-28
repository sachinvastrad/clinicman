import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  sanskritName: z.string().optional(),
  category: z.string().optional(),
  duration: z.string().optional(),
  description: z.string().optional(),
  benefits: z.string().optional(),
  contraindications: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const asanas = await prisma.yogaAsana.findMany({
    where: {
      clinicId: user.clinic_id,
      isActive: true,
      ...(category && { category }),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: asanas });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const asana = await prisma.yogaAsana.create({
    data: {
      clinicId: user.clinic_id,
      name: parsed.data.name,
      sanskritName: parsed.data.sanskritName,
      category: parsed.data.category,
      duration: parsed.data.duration,
      description: parsed.data.description,
      benefits: parsed.data.benefits,
      contraindications: parsed.data.contraindications,
      imageUrl: parsed.data.imageUrl,
      createdBy: user.id,
    },
  });

  return NextResponse.json({ data: asana }, { status: 201 });
}
