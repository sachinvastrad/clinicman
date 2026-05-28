import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  gstin: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const vendors = await prisma.vendor.findMany({
    where: { clinicId: user.clinic_id, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: vendors });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const vendor = await prisma.vendor.create({
    data: {
      clinicId: user.clinic_id,
      name: parsed.data.name,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: parsed.data.address,
      gstin: parsed.data.gstin,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json({ data: vendor }, { status: 201 });
}
