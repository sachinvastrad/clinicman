import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface Props { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, clinicId: user.clinic_id },
  });

  if (!lead) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Lead not found", status: 404 } }, { status: 404 });
  if (lead.status === "converted") return NextResponse.json({ error: { code: "ALREADY_CONVERTED", message: "Lead already converted", status: 409 } }, { status: 409 });

  // Generate patient code
  const count = await prisma.patient.count({ where: { clinicId: user.clinic_id } });
  const patientCode = `P${String(count + 1).padStart(4, "0")}`;

  const result = await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.create({
      data: {
        clinicId: user.clinic_id,
        fullName: lead.fullName,
        phone: lead.phone ?? "",
        email: lead.email,
        patientCode,
        referredBy: lead.source ?? undefined,
      },
    });

    await tx.lead.update({
      where: { id },
      data: {
        status: "converted",
        patientId: patient.id,
      },
    });

    return patient;
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
