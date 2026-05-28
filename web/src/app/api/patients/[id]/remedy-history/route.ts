import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;

  // Verify patient belongs to clinic
  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: user.clinic_id },
    select: { id: true, fullName: true },
  });
  if (!patient) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: id, doctor: { clinicId: user.clinic_id } },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      visit: { select: { visitDate: true, diagnosis: true, chiefComplaint: true } },
    },
  });

  return NextResponse.json({ data: prescriptions });
}
