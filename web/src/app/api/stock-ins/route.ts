import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  inventoryId: z.string().uuid(),
  quantity: z.number().int().positive(),
  costPrice: z.number().nonnegative(),
});

const schema = z.object({
  vendorId: z.string().uuid().optional(),
  invoiceNo: z.string().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");

  const stockIns = await prisma.stockIn.findMany({
    where: {
      clinicId: user.clinic_id,
      ...(vendorId && { vendorId }),
    },
    orderBy: { purchaseDate: "desc" },
    take: 50,
    include: {
      vendor: { select: { name: true } },
      items: {
        include: { inventory: { select: { name: true, unit: true } } },
      },
    },
  });

  return NextResponse.json({ data: stockIns });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 400 } }, { status: 400 });

  const totalAmount = parsed.data.items.reduce((s, i) => s + i.quantity * i.costPrice, 0);

  const result = await prisma.$transaction(async (tx) => {
    const stockIn = await tx.stockIn.create({
      data: {
        clinicId: user.clinic_id,
        vendorId: parsed.data.vendorId,
        invoiceNo: parsed.data.invoiceNo,
        purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : new Date(),
        totalAmount,
        notes: parsed.data.notes,
        recordedBy: user.id,
        items: {
          create: parsed.data.items.map((item) => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            costPrice: item.costPrice,
            totalPrice: item.quantity * item.costPrice,
          })),
        },
      },
    });

    // Update inventory currentStock
    for (const item of parsed.data.items) {
      await tx.inventory.updateMany({
        where: { id: item.inventoryId, clinicId: user.clinic_id },
        data: { currentStock: { increment: item.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryId: item.inventoryId,
          movementType: "in",
          quantity: item.quantity,
          notes: `Stock-in${parsed.data.invoiceNo ? ` (Invoice: ${parsed.data.invoiceNo})` : ""}`,
          performedBy: user.id,
        },
      });
    }

    return stockIn;
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
