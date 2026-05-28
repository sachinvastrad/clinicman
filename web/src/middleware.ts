import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? "drman-super-secret-session-key-min-32-chars!!",
  cookieName: "drman_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes
  if (
    pathname.startsWith("/book") ||
    pathname.startsWith("/api/book") ||
    pathname.startsWith("/api/whatsapp/webhook") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/send-otp") ||
    pathname.startsWith("/api/auth/verify-otp") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpe?g|gif|svg|webp|ico|css|js|woff2?|ttf|map)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(request, res, SESSION_OPTIONS);
  const isLoggedIn = session.isLoggedIn === true;

  // Auth routes — redirect logged-in users to dashboard
  if (pathname.startsWith("/login")) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", request.url));
    return res;
  }

  // API routes — return 401, not redirect
  if (pathname.startsWith("/api/")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  // Protected dashboard routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
