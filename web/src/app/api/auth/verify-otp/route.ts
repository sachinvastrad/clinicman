import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "OTP auth is no longer supported. Use email/password login." }, { status: 410 });
}
