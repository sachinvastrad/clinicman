import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createPatientSchema } from "@/lib/validations/patient";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q        = searchParams.get("q") ?? "";
  const limit    = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset   = Number(searchParams.get("offset") ?? 0);
  const caseType = searchParams.get("caseType");

  const where = {
    clinicId: user.clinic_id,
    ...(q && {
      OR: [
        { fullName:   { contains: q, mode: "insensitive" as const } },
        { phone:      { contains: q } },
        { patientCode:{ contains: q } },
        { email:      { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(caseType && { caseType: caseType as never }),
  };

  const [data, total] = await Promise.all([
    prisma.patient.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({ data, total });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  // Duplicate phone check within clinic
  const existing = await prisma.patient.findFirst({
    where: { clinicId: user.clinic_id, phone: parsed.data.phone },
  });
  if (existing) {
    return NextResponse.json({ error: { code: "DUPLICATE_PHONE", message: "A patient with this phone number already exists.", status: 409 } }, { status: 409 });
  }

  // Generate patient code
  const count = await prisma.patient.count({ where: { clinicId: user.clinic_id } });
  const year  = new Date().getFullYear();
  const patientCode = `DRM-${year}-${String(count + 1).padStart(5, "0")}`;

  const patient = await prisma.patient.create({
    data: {
      clinicId:      user.clinic_id,
      patientCode,
      fullName:      parsed.data.fullName,
      phone:         parsed.data.phone,
      email:         parsed.data.email || null,
      dateOfBirth:   parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      gender:        parsed.data.gender as never ?? null,
      address:       parsed.data.address || null,
      occupation:    parsed.data.occupation || null,
      referredBy:    parsed.data.referredBy || null,
      allergies:     parsed.data.allergies || null,
      caseType:      parsed.data.caseType as never,
      whatsappOptin: parsed.data.whatsappOptin,
      registeredBy:  user.id,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      clinicId:   user.clinic_id,
      userId:     user.id,
      action:     "patient.create",
      entityType: "patient",
      entityId:   patient.id,
      newData:    { patientCode, fullName: patient.fullName },
    },
  });

  return NextResponse.json({ data: patient }, { status: 201 });
}
