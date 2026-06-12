import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ===== In-memory rate limiter (per-instance, resets on cold start) =====
// For multi-instance production, replace with Redis (@upstash/ratelimit)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Periodic cleanup to prevent memory leak
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitMap) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function getIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Sensitive endpoint rate limits — mirrors meal-app production config
const RATE_LIMITS: Record<string, [number, number]> = {
  "/api/auth/callback/credentials": [10, 15 * 60 * 1000], // 10 login attempts / 15min
  "/api/auth/register":             [5,  15 * 60 * 1000], // 5 registrations / 15min
  "/api/users":                     [30, 60 * 1000],       // 30 user list requests / min
  "/api/export":                    [10, 60 * 1000],       // 10 exports / min
  "/api/certificates":              [30, 60 * 1000],       // certificate issuance
};

const GENERAL_API_LIMIT  = 60;
const GENERAL_API_WINDOW = 60 * 1000;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIP(request);

  // --- Rate limiting for sensitive endpoints ---
  if (["POST", "PATCH", "DELETE"].includes(request.method)) {
    const config = RATE_LIMITS[pathname];
    if (config) {
      const [limit, window] = config;
      if (!rateLimit(`${ip}:${pathname}`, limit, window)) {
        console.warn(`[SECURITY] Rate limit hit: ${ip} → ${pathname}`);
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }
  }

  // --- General API rate limiting ---
  if (pathname.startsWith("/api/")) {
    if (!rateLimit(`${ip}:api`, GENERAL_API_LIMIT, GENERAL_API_WINDOW)) {
      console.warn(`[SECURITY] General rate limit hit: ${ip}`);
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down." },
        { status: 429 }
      );
    }
  }

  // --- CSRF protection on mutating requests ---
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    ["POST", "PATCH", "DELETE"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host   = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          console.warn(`[SECURITY] CSRF blocked: ${ip} origin=${origin} host=${host} path=${pathname}`);
          return NextResponse.json(
            { error: "Forbidden: cross-origin request" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Forbidden: invalid origin" },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
