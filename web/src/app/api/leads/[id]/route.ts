import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "interested", "not_interested", "converted", "lost"]).optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  interestedIn: z.string().optional(),
});

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, clinicId: user.clinic_id },
  });

  if (!lead) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", status: 404 } }, { status: 404 });
  return NextResponse.json({ data: lead });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const result = await prisma.lead.updateMany({
    where: { id, clinicId: user.clinic_id },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : undefined,
    },
  });

  if (result.count === 0) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", status: 404 } }, { status: 404 });
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  await prisma.lead.deleteMany({ where: { id, clinicId: user.clinic_id } });
  return NextResponse.json({ data: { deleted: true } });
}
