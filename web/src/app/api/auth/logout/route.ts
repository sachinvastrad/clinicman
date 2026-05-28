import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? "drman-super-secret-session-key-min-32-chars!!",
  cookieName: "drman_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 0,
  },
};

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);
  session.destroy();
  return res;
}
