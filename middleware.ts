import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";
import { getClientIp, loginLimiter } from "@/lib/ratelimit";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit login attempts (brute-force protection)
  if (
    pathname === "/api/auth/callback/credentials" &&
    request.method === "POST"
  ) {
    const ip = getClientIp(request);
    const { success } = loginLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  if (pathname.startsWith("/admin")) {
    const session = await getSessionFromRequest(request);
    if (!session?.authenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
