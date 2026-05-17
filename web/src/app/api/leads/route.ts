import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createLeadSchema = z.object({
  fullName:     z.string().min(2),
  phone:        z.string().min(10),
  email:        z.string().email().optional(),
  interestedIn: z.string().optional(),
  source:       z.string().optional(),
  notes:        z.string().optional(),
});

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const leads = await prisma.lead.findMany({
    where:   { clinicId: user.clinic_id },
    orderBy: { createdAt: "desc" },
    take:    100,
  });

  return NextResponse.json({ data: leads });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: {
      clinicId:     user.clinic_id,
      fullName:     parsed.data.fullName,
      phone:        parsed.data.phone,
      email:        parsed.data.email ?? null,
      interestedIn: parsed.data.interestedIn ?? null,
      source:       parsed.data.source ?? null,
      notes:        parsed.data.notes ?? null,
    },
  });

  return NextResponse.json({ data: lead }, { status: 201 });
}
