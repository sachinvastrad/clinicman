import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  gstin: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  const vendor = await prisma.vendor.findFirst({
    where: { id, clinicId: user.clinic_id },
    include: {
      stockIns: { orderBy: { purchaseDate: "desc" }, take: 20 },
    },
  });

  if (!vendor) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", status: 404 } }, { status: 404 });
  return NextResponse.json({ data: vendor });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const result = await prisma.vendor.updateMany({
    where: { id, clinicId: user.clinic_id },
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  if (result.count === 0) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", status: 404 } }, { status: 404 });
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  await prisma.vendor.updateMany({ where: { id, clinicId: user.clinic_id }, data: { isActive: false } });
  return NextResponse.json({ data: { deleted: true } });
}
