import { NextRequest, NextResponse } from "next/server";

// ===== In-memory rate limiter (per-instance, standalone resilience) =====
// Optimized for Vercel/Node runtime without external dependencies like Cloudflare/Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isValidIpFormat(ip: string): boolean {
  return /^[0-9a-fA-F:.]+$/.test(ip) && ip.length <= 45;
}

function getIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp && isValidIpFormat(firstIp)) {
      return firstIp;
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && isValidIpFormat(realIp)) {
    return realIp;
  }
  return "127.0.0.1";
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Periodic cleanup to prevent memory bloat under attack
  if (Math.random() < 0.02) {
    for (const [k, v] of rateLimitMap) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
    // Hard ceiling safeguard to protect Node process RAM
    if (rateLimitMap.size > 10000) {
      rateLimitMap.clear();
    }
  }

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// Specific endpoint rate limit rules
interface RateLimitRule {
  pattern: RegExp;
  methods?: string[]; // If omitted, applies to mutating methods: POST, PATCH, DELETE
  limit: number;
  windowMs: number;
  label: string;
}

const RATE_LIMIT_RULES: RateLimitRule[] = [
  { pattern: /^\/api\/auth\//,                     methods: ["POST", "GET"], limit: 25, windowMs: 5 * 60 * 1000, label: "auth" },
  { pattern: /^\/api\/events\/[^/]+\/register/,    limit: 10, windowMs: 60 * 1000, label: "event_reg" },
  { pattern: /^\/api\/events\/[^/]+\/attendance/,  limit: 30, windowMs: 60 * 1000, label: "event_att" },
  { pattern: /^\/api\/payments/,                   limit: 20, windowMs: 60 * 1000, label: "payments" },
  { pattern: /^\/api\/treasury/,                   limit: 30, windowMs: 60 * 1000, label: "treasury" },
  { pattern: /^\/api\/expenses/,                   limit: 30, windowMs: 60 * 1000, label: "expenses" },
  { pattern: /^\/api\/export/,                     methods: ["GET", "POST"], limit: 10, windowMs: 60 * 1000, label: "export" },
  { pattern: /^\/api\/certificates/,               limit: 30, windowMs: 60 * 1000, label: "certificates" },
  { pattern: /^\/api\/users\/approval/,            limit: 20, windowMs: 60 * 1000, label: "user_approval" },
  { pattern: /^\/api\/users$/,                     methods: ["GET"], limit: 40, windowMs: 60 * 1000, label: "user_list" },
  { pattern: /^\/api\/gallery/,                    limit: 25, windowMs: 60 * 1000, label: "gallery" },
  { pattern: /^\/api\/sponsors/,                   limit: 25, windowMs: 60 * 1000, label: "sponsors" },
];

const GENERAL_API_LIMIT  = 120; // 120 requests per minute per IP for general browsing
const GENERAL_API_WINDOW = 60 * 1000;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIP(request);
  const method = request.method;

  // --- 1. Targeted Rate Limiting for Sensitive Endpoints ---
  for (const rule of RATE_LIMIT_RULES) {
    const appliesToMethod = rule.methods
      ? rule.methods.includes(method)
      : ["POST", "PATCH", "DELETE"].includes(method);

    if (appliesToMethod && rule.pattern.test(pathname)) {
      const result = checkRateLimit(`${ip}:${rule.label}`, rule.limit, rule.windowMs);
      if (!result.allowed) {
        const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
        console.warn(`[SECURITY] Sensitive rate limit exceeded (${rule.label}): ${ip} → ${pathname}`);
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(rule.limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
            },
          }
        );
      }
      break; // Only apply the first matching sensitive rule
    }
  }

  // --- 2. General API Rate Limiting ---
  if (pathname.startsWith("/api/")) {
    const generalResult = checkRateLimit(`${ip}:api_general`, GENERAL_API_LIMIT, GENERAL_API_WINDOW);
    if (!generalResult.allowed) {
      const retryAfter = Math.max(1, Math.ceil((generalResult.resetAt - Date.now()) / 1000));
      console.warn(`[SECURITY] General rate limit exceeded: ${ip} → ${pathname}`);
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(GENERAL_API_LIMIT),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(generalResult.resetAt / 1000)),
          },
        }
      );
    }
  }

  // --- 3. Cross-Origin CSRF Protection for Mutating Requests ---
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    ["POST", "PATCH", "DELETE"].includes(method)
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
