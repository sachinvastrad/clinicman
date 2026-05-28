import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF allowed" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `yoga_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "yoga");
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/yoga/${filename}` });
}
