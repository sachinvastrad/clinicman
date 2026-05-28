import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { updatePatientSchema } from "@/lib/validations/patient";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: user.clinic_id },
    include: {
      caseHistory: true,
      visits: {
        orderBy: { visitDate: "desc" },
        take: 10,
        include: { prescription: { include: { items: true } }, vitals: true },
      },
    },
  });

  if (!patient) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  return NextResponse.json({ data: patient });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.patient.findFirst({ where: { id, clinicId: user.clinic_id } });
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  const body = await req.json();
  const parsed = updatePatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  // Phone uniqueness check if phone is being changed
  if (parsed.data.phone && parsed.data.phone !== existing.phone) {
    const dup = await prisma.patient.findFirst({ where: { clinicId: user.clinic_id, phone: parsed.data.phone } });
    if (dup) return NextResponse.json({ error: { code: "DUPLICATE_PHONE", message: "A patient with this phone number already exists.", status: 409 } }, { status: 409 });
  }

  const { dateOfBirth, gender, ...rest } = parsed.data;

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      ...rest,
      ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
      ...(gender !== undefined && { gender: gender as never }),
    },
  });

  await prisma.auditLog.create({
    data: {
      clinicId:   user.clinic_id,
      userId:     user.id,
      action:     "patient.update",
      entityType: "patient",
      entityId:   patient.id,
      oldData:    JSON.stringify({ fullName: existing.fullName, phone: existing.phone }),
      newData:    JSON.stringify({ fullName: patient.fullName, phone: patient.phone }),
    },
  });

  return NextResponse.json({ data: patient });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  if (user.role !== "admin") {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only admins can delete patients.", status: 403 } }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.patient.findFirst({ where: { id, clinicId: user.clinic_id } });
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  await prisma.patient.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      clinicId:   user.clinic_id,
      userId:     user.id,
      action:     "patient.delete",
      entityType: "patient",
      entityId:   id,
      oldData:    JSON.stringify({ fullName: existing.fullName, patientCode: existing.patientCode }),
    },
  });

  return NextResponse.json({ data: { id } });
}
