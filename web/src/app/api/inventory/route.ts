import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createItemSchema = z.object({
  name:         z.string().min(1),
  category:     z.string().optional(),
  potency:      z.string().optional().nullable(),
  unit:         z.string().default("unit"),
  currentStock: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative().default(5),
  costPrice:    z.number().nonnegative().optional().nullable(),
  sellingPrice: z.number().nonnegative().optional().nullable(),
});

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const items = await prisma.inventory.findMany({
    where:   { clinicId: user.clinic_id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const item = await prisma.inventory.create({
    data: {
      clinicId:     user.clinic_id,
      name:         parsed.data.name,
      category:     parsed.data.category ?? null,
      potency:      parsed.data.potency ?? null,
      unit:         parsed.data.unit,
      currentStock: parsed.data.currentStock,
      reorderLevel: parsed.data.reorderLevel,
      costPrice:    parsed.data.costPrice ?? null,
      sellingPrice: parsed.data.sellingPrice ?? null,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
