import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaymentSchema = z.object({
  invoiceId:   z.string().uuid(),
  amount:      z.number().positive("Amount must be positive"),
  method:      z.enum(["cash", "card", "upi", "bank_transfer", "cheque"]),
  referenceNo: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const invoiceId = searchParams.get("invoiceId");

  const payments = await prisma.payment.findMany({
    where: {
      clinicId: user.clinic_id,
      ...(invoiceId && { invoiceId }),
    },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json({ data: payments });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where:   { id: parsed.data.invoiceId, clinicId: user.clinic_id },
    include: { payments: true },
  });
  if (!invoice) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Invoice not found", status: 404 } }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      clinicId:    user.clinic_id,
      invoiceId:   parsed.data.invoiceId,
      amount:      parsed.data.amount,
      method:      parsed.data.method,
      referenceNo: parsed.data.referenceNo ?? null,
      receivedBy:  user.id,
    },
  });

  // Update invoice status based on total paid
  const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaid   = alreadyPaid + parsed.data.amount;
  const totalAmount = Number(invoice.totalAmount);
  const newStatus   = totalPaid >= totalAmount ? "paid" : "partially_paid";

  await prisma.invoice.update({
    where: { id: parsed.data.invoiceId },
    data:  { status: newStatus },
  });

  return NextResponse.json({ data: payment }, { status: 201 });
}
