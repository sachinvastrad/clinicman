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

  const visit = await prisma.visit.findFirst({
    where:   { id, clinicId: user.clinic_id },
    include: {
      patient:      { select: { fullName: true, patientCode: true, id: true, phone: true } },
      vitals:       true,
      prescription: { include: { items: { orderBy: { sortOrder: "asc" } } } },
      doctor:       { select: { fullName: true } },
    },
  });

  if (!visit) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", status: 404 } }, { status: 404 });

  return NextResponse.json({ data: visit });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const allowed = ["in_progress", "completed", "locked"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid status", status: 400 } }, { status: 400 });
  }

  const result = await prisma.visit.updateMany({
    where: { id, clinicId: user.clinic_id },
    data:  { status },
  });

  if (result.count === 0) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", status: 404 } }, { status: 404 });

  return NextResponse.json({ data: { updated: true } });
}
