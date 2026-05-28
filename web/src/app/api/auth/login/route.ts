import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? "drman-super-secret-session-key-min-32-chars!!",
  cookieName: "drman_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), isActive: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const res = NextResponse.json({
      data: { id: user.id, fullName: user.fullName, role: user.role, email: user.email },
    });

    const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);
    session.userId   = user.id;
    session.clinicId = user.clinicId;
    session.role     = user.role;
    session.fullName = user.fullName;
    session.email    = user.email ?? null;
    session.isLoggedIn = true;
    await session.save();

    return res;
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
