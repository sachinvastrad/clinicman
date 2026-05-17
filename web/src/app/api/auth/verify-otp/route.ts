import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOtpSchema } from "@/lib/validations/user";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", status: 400 } }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.otp,
    type:  "sms",
  });

  if (error || !data.session) {
    return NextResponse.json({ error: { code: "INVALID_OTP", message: "Invalid or expired OTP.", status: 401 } }, { status: 401 });
  }

  return NextResponse.json({ data: { user: data.user } });
}
