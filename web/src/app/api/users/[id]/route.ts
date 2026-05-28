import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface Ctx { params: Promise<{ id: string }> }

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email:    z.string().email().optional().nullable(),
  role:     z.enum(["admin", "doctor", "receptionist"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden", status: 403 } }, { status: 403 });

  const { id } = await params;

  const target = await prisma.user.findFirst({ where: { id, clinicId: user.clinic_id } });
  if (!target) return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found", status: 404 } }, { status: 404 });

  // Prevent admin from deactivating themselves
  if (id === user.id && req.body) {
    const body = await req.json();
    if (body.isActive === false) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "You cannot deactivate your own account.", status: 403 } }, { status: 403 });
    }
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400 } }, { status: 400 });
    const updated = await prisma.user.update({ where: { id }, data: { ...parsed.data, role: parsed.data.role as never } });
    return NextResponse.json({ data: updated });
  }

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400 } }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id },
    data: { ...parsed.data, ...(parsed.data.role && { role: parsed.data.role as never }) },
    select: { id: true, fullName: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      clinicId:   user.clinic_id,
      userId:     user.id,
      action:     "user.update",
      entityType: "user",
      entityId:   id,
      oldData:    JSON.stringify({ role: target.role, isActive: target.isActive }),
      newData:    JSON.stringify({ role: updated.role, isActive: updated.isActive }),
    },
  });

  return NextResponse.json({ data: updated });
}
