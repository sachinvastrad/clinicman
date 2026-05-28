import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  tags: z.string().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const templates = await prisma.dietTemplate.findMany({
    where: { clinicId: user.clinic_id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: templates });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const template = await prisma.dietTemplate.create({
    data: {
      clinicId: user.clinic_id,
      name: parsed.data.name,
      description: parsed.data.description,
      content: parsed.data.content,
      tags: parsed.data.tags,
      createdBy: user.id,
    },
  });

  return NextResponse.json({ data: template }, { status: 201 });
}
