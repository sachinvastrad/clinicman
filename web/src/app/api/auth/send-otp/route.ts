import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOtpSchema } from "@/lib/validations/user";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid phone number", status: 400 } }, { status: 400 });
  }

  let phone = parsed.data.phone.trim();
  if (!phone.startsWith("+")) phone = `+91${phone.replace(/^0/, "")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    return NextResponse.json({ error: { code: "OTP_ERROR", message: error.message, status: 500 } }, { status: 500 });
  }

  return NextResponse.json({ data: { message: "OTP sent successfully" } });
}
