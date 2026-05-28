import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface SessionData {
  userId:   string;
  clinicId: string;
  role:     string;
  fullName: string;
  email:    string | null;
  isLoggedIn: boolean;
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? "drman-super-secret-session-key-min-32-chars!!",
  cookieName: "drman_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, SESSION_OPTIONS);
}
