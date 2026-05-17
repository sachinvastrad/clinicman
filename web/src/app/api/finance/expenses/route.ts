import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createExpenseSchema = z.object({
  description:  z.string().min(1),
  amount:       z.number().positive(),
  category:     z.string().default("misc"),
  expenseDate:  z.string(),
  notes:        z.string().optional().nullable(),
  receiptUrl:   z.string().url().optional().nullable(),
});

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const expenses = await prisma.expense.findMany({
    where:   { clinicId: user.clinic_id },
    orderBy: { expenseDate: "desc" },
    take:    100,
  });

  return NextResponse.json({ data: expenses });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const body = await req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      clinicId:    user.clinic_id,
      recordedBy:  user.id,
      description: parsed.data.description,
      amount:      parsed.data.amount,
      category:    parsed.data.category,
      expenseDate: new Date(parsed.data.expenseDate),
      notes:       parsed.data.notes ?? null,
      receiptUrl:  parsed.data.receiptUrl?.toString() ?? null,
    },
  });

  return NextResponse.json({ data: expense }, { status: 201 });
}
