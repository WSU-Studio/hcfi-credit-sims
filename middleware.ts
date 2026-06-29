import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";
import { getClientIp, loginLimiter, tooManyRequestsResponse } from "@/lib/ratelimit";
import { checkWriteOrigin } from "@/lib/security/origin-check";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/** Collapse `//dealer/login` → `/dealer/login` so portal route guards match. */
function normalizePathname(pathname: string): string {
  const collapsed = pathname.replace(/\/{2,}/g, "/");
  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }
  return collapsed || "/";
}

/** Dealer portal lives outside `[locale]`; undo mistaken `/id/dealer/*` prefixes. */
function stripLocaleFromDealerPath(pathname: string): string {
  const match = pathname.match(/^\/(id|en)\/dealer(\/.*)?$/);
  if (!match) return pathname;
  return `/dealer${match[2] ?? ""}`;
}

/**
 * Endpoints that intentionally accept third-party-initiated requests
 * (e.g. NextAuth has its own CSRF token + state handling, and ELB health
 * checks hit `/` without an Origin). Keep this list small.
 */
const ORIGIN_CHECK_BYPASS_PREFIXES = [
  "/api/auth/", // NextAuth: protected by built-in CSRF token + state nonces
];

function shouldEnforceOrigin(pathname: string): boolean {
  if (!pathname.startsWith("/api/")) return false;
  return !ORIGIN_CHECK_BYPASS_PREFIXES.some((p) => pathname.startsWith(p));
}

function getCorsHeaders(request: NextRequest): Record<string, string> | null {
  const allowed =
    process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) ?? [];
  if (allowed.length === 0) return null;

  const origin = request.headers.get("origin");
  if (!origin || !allowed.includes(origin)) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(response: NextResponse, request: NextRequest): NextResponse {
  if (!request.nextUrl.pathname.startsWith("/api")) return response;
  const cors = getCorsHeaders(request);
  if (cors) {
    Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const rawPathname = request.nextUrl.pathname;
  const pathname = stripLocaleFromDealerPath(normalizePathname(rawPathname));

  if (pathname !== rawPathname) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url);
  }

  // ELB/ALB health check often hits GET / and expects 200.
  // Root redirects to locale (307), which ELB treats as unhealthy.
  // Return 200 for health checker to avoid 504s.
  const ua = request.headers.get("user-agent") ?? "";
  if (
    pathname === "/" &&
    request.method === "GET" &&
    ua.includes("ELB-HealthChecker")
  ) {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  // CORS for API routes (only when ALLOWED_ORIGINS is set)
  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      const cors = getCorsHeaders(request);
      return new NextResponse(null, {
        status: 204,
        headers: cors ?? {},
      });
    }
  }

  // Cross-origin write guard (anti-CSRF). Runs *before* per-route limiters
  // so we don't burn limit budget on rejected cross-origin probes.
  if (shouldEnforceOrigin(pathname)) {
    const verdict = checkWriteOrigin({
      method: request.method,
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      host: request.headers.get("host"),
    });
    if (!verdict.ok) {
      return withCors(
        NextResponse.json(
          { error: "Forbidden: cross-origin request rejected" },
          { status: 403 }
        ),
        request
      );
    }
  }

  // Rate limit login attempts (brute-force protection) — per-IP layer only.
  // A second layer (per-email + persistent DB lockout) lives in `lib/nextauth.ts`.
  if (
    pathname === "/api/auth/callback/credentials" &&
    request.method === "POST"
  ) {
    const ip = getClientIp(request);
    const rl = loginLimiter.limit(ip);
    if (!rl.success) {
      return withCors(
        tooManyRequestsResponse(
          "Too many login attempts. Please try again later.",
          rl.retryAfterSec
        ),
        request
      );
    }
  }

  if (pathname.startsWith("/dealer")) {
    const isLoginPage = pathname === "/dealer/login";
    if (!isLoginPage) {
      const session = await getSessionFromRequest(request);
      if (!session?.authenticated) {
        const loginUrl = new URL("/dealer/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    return NextResponse.next();
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

  // API admin routes require authentication (defense-in-depth)
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/dealer")) {
    const session = await getSessionFromRequest(request);
    if (!session?.authenticated) {
      return withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        request
      );
    }
    return withCors(NextResponse.next(), request);
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    return withCors(NextResponse.next(), request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
