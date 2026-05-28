import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  const template = await prisma.diseaseTemplate.findFirst({
    where: { id, clinicId: user.clinic_id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!template) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", status: 404 } }, { status: 404 });
  return NextResponse.json({ data: template });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });

  const { id } = await params;
  await prisma.diseaseTemplate.updateMany({ where: { id, clinicId: user.clinic_id }, data: { isActive: false } });
  return NextResponse.json({ data: { deleted: true } });
}
