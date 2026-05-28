import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity:    z.number().int().positive(),
  unitPrice:   z.number().nonnegative(),
});

const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  visitId:   z.string().uuid().optional(),
  items:     z.array(lineItemSchema).min(1),
  discount:  z.number().nonnegative().default(0),
  notes:     z.string().optional().nullable(),
  date:      z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const patientId = searchParams.get("patientId");

  const invoices = await prisma.invoice.findMany({
    where: {
      clinicId:  user.clinic_id,
      ...(patientId && { patientId }),
    },
    orderBy: { createdAt: "desc" },
    include: { patient: { select: { fullName: true, patientCode: true } } },
  });

  return NextResponse.json({ data: invoices });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const patient = await prisma.patient.findFirst({ where: { id: parsed.data.patientId, clinicId: user.clinic_id } });
  if (!patient) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Patient not found", status: 404 } }, { status: 404 });

  const subtotal = parsed.data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total    = Math.max(0, subtotal - parsed.data.discount);

  // Generate invoice number — simple sequential, race condition noted in TECH_DEBT (TD-07)
  const count = await prisma.invoice.count({ where: { clinicId: user.clinic_id } });
  const year  = new Date().getFullYear();
  const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      clinicId:      user.clinic_id,
      patientId:     parsed.data.patientId,
      visitId:       parsed.data.visitId ?? null,
      createdAt:     parsed.data.date ? new Date(parsed.data.date) : undefined,
      invoiceNumber,
      subtotalAmount:subtotal,
      discountAmount:parsed.data.discount,
      totalAmount:   total,
      notes:         parsed.data.notes ?? null,
      createdBy:     user.id,
      items: {
        create: parsed.data.items.map((item) => ({
          description: item.description,
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
          totalPrice:  item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ data: invoice }, { status: 201 });
}
