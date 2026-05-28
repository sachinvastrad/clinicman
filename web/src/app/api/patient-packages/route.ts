import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  patientId: z.string().uuid(),
  treatmentPackageId: z.string().uuid(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  const enrollments = await prisma.patientPackageEnrollment.findMany({
    where: {
      clinicId: user.clinic_id,
      ...(patientId && { patientId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      treatmentPackage: { select: { name: true, sessionCount: true, validityDays: true } },
      patient: { select: { fullName: true, patientCode: true } },
    },
  });

  return NextResponse.json({ data: enrollments });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const pkg = await prisma.treatmentPackage.findFirst({
    where: { id: parsed.data.treatmentPackageId, clinicId: user.clinic_id, isActive: true },
  });
  if (!pkg) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Package not found", status: 404 } }, { status: 404 });

  const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : new Date();
  const expiryDate = pkg.validityDays ? new Date(startDate.getTime() + pkg.validityDays * 86400000) : null;

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.patientPackageEnrollment.create({
      data: {
        clinicId: user.clinic_id,
        patientId: parsed.data.patientId,
        treatmentPackageId: parsed.data.treatmentPackageId,
        sessionsTotal: pkg.sessionCount,
        sessionsUsed: 0,
        startDate,
        expiryDate: expiryDate ?? undefined,
        status: "active",
      },
    });

    const invNum = `PKG-${Date.now()}`;
    const invoice = await tx.invoice.create({
      data: {
        clinicId: user.clinic_id,
        patientId: parsed.data.patientId,
        invoiceNumber: invNum,
        subtotalAmount: Number(pkg.price),
        totalAmount: Number(pkg.price),
        status: "draft",
        items: {
          create: [{
            description: `${pkg.name} — ${pkg.sessionCount} sessions${pkg.validityDays ? ` (valid ${pkg.validityDays} days)` : ""}`,
            quantity: 1,
            unitPrice: Number(pkg.price),
            totalPrice: Number(pkg.price),
          }],
        },
      },
    });

    // Link invoice to enrollment
    await tx.patientPackageEnrollment.update({
      where: { id: enrollment.id },
      data: { invoiceId: invoice.id },
    });

    return { enrollment, invoice };
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
