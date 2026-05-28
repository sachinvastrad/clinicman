import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations/user";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden", status: 403 } }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { clinicId: user.clinic_id },
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden", status: 403 } }, { status: 403 });

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400, details: parsed.error.flatten() } }, { status: 400 });
  }

  const { fullName, phone, email, role } = parsed.data;

  // Check for duplicate phone within clinic
  const existing = await prisma.user.findFirst({ where: { clinicId: user.clinic_id, phone } });
  if (existing) {
    return NextResponse.json({ error: { code: "DUPLICATE_PHONE", message: "A user with this phone number already exists.", status: 409 } }, { status: 409 });
  }

  // Create auth user via Admin API (invites or phone-based)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    phone,
    phone_confirm: true,
    email: email ?? undefined,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: { code: "AUTH_ERROR", message: authError?.message ?? "Failed to create auth user", status: 500 } }, { status: 500 });
  }

  const newUser = await prisma.user.create({
    data: {
      id:       authData.user.id,
      clinicId: user.clinic_id,
      fullName,
      phone,
      email:    email ?? null,
      role:     role as never,
      isActive: true,
    },
    select: { id: true, fullName: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      clinicId:   user.clinic_id,
      userId:     user.id,
      action:     "user.create",
      entityType: "user",
      entityId:   newUser.id,
      newData:    JSON.stringify({ fullName, role }),
    },
  });

  return NextResponse.json({ data: newUser }, { status: 201 });
}
