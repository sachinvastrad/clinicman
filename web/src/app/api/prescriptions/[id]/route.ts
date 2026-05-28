import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;

  const prescription = await prisma.prescription.findFirst({
    where: { id, doctor: { clinicId: user.clinic_id } },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      visit: {
        include: {
          patient: { select: { fullName: true, patientCode: true, id: true, phone: true } },
          vitals: true,
        },
      },
      doctor: { select: { fullName: true } },
    },
  });

  if (!prescription) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Prescription not found", status: 404 } }, { status: 404 });

  return NextResponse.json({ data: prescription });
}
