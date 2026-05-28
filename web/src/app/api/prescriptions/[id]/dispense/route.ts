import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  createInvoice: z.boolean().optional().default(false),
});

interface Props { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const prescription = await prisma.prescription.findFirst({
    where: { id, doctor: { clinicId: user.clinic_id } },
    include: { items: true },
  });

  if (!prescription) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Prescription not found", status: 404 } }, { status: 404 });

  // Match items to inventory and decrement quantities
  const result = await prisma.$transaction(async (tx) => {
    const dispensedItems: { name: string; quantity: number; unitPrice: number }[] = [];

    for (const item of prescription.items) {
      // Try to find matching inventory item by remedy name
      const inv = await tx.inventory.findFirst({
        where: {
          clinicId: user.clinic_id,
          name: { contains: item.remedyName },
          currentStock: { gt: 0 },
        },
      });

      if (inv) {
        const qty = 1; // Dispense 1 unit per remedy item
        await tx.inventory.update({
          where: { id: inv.id },
          data: { currentStock: { decrement: qty } },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            movementType: "out",
            quantity: qty,
            referenceId: prescription.id,
            notes: `Dispensed for prescription ${prescription.id}`,
          },
        });

        dispensedItems.push({
          name: item.remedyName,
          quantity: qty,
          unitPrice: Number(inv.sellingPrice ?? 0),
        });
      }
    }

    // Optionally create invoice
    let invoice = null;
    if (parsed.data.createInvoice && dispensedItems.length > 0) {
      const totalAmount = dispensedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const invNum = `INV-${Date.now()}`;

      invoice = await tx.invoice.create({
        data: {
          clinicId: user.clinic_id,
          patientId: prescription.patientId,
          invoiceNumber: invNum,
          subtotalAmount: totalAmount,
          totalAmount,
          status: "draft",
          items: {
            create: dispensedItems.map((i) => ({
              description: i.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.quantity * i.unitPrice,
            })),
          },
        },
      });
    }

    return { dispensedItems, invoice };
  });

  return NextResponse.json({ data: result });
}
