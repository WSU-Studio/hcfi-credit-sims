/**
 * In-memory rate limiter (no external service).
 * Note: In serverless / multi-instance EB, each instance has its own store;
 * limits are per-instance. For correctness across instances move to Redis
 * (Upstash / ElastiCache) — but in-memory is fine while we run a single
 * EB instance + AWS WAF rate-based rule on the ALB.
 */
import { NextResponse } from 'next/server';

type Entry = { count: number; resetAt: number };

export type Limiter = {
  limit(identifier: string): { success: boolean; remaining: number; retryAfterSec: number };
  /** Reset counter for a specific identifier (e.g. after successful login). */
  reset(identifier: string): void;
};

function createLimiter(max: number, windowMs: number): Limiter {
  const store = new Map<string, Entry>();

  // Cleanup expired entries periodically to avoid memory leak.
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  };
  setInterval(cleanup, 60_000); // every minute

  return {
    limit(identifier) {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || entry.resetAt <= now) {
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: max - 1, retryAfterSec: 0 };
      }

      entry.count++;
      const remaining = Math.max(0, max - entry.count);
      if (entry.count > max) {
        return {
          success: false,
          remaining: 0,
          retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
        };
      }
      return { success: true, remaining, retryAfterSec: 0 };
    },
    reset(identifier) {
      store.delete(identifier);
    },
  };
}

// ---------- Public-facing limiters (key = client IP) ----------

/** Login attempts per IP — 5 per 15 minutes. */
export const loginLimiter = createLimiter(5, 15 * 60 * 1000);

/** Login attempts per email — 10 per 15 minutes (botnet-spread defence). */
export const loginEmailLimiter = createLimiter(10, 15 * 60 * 1000);

/** Public lead submissions — 10 per minute per IP. */
export const leadsLimiter = createLimiter(10, 60 * 1000);

/** Public Hyundai AddLeadAsset draft — 5 per minute per IP (creates a Hyundai LOS lead per call). */
export const leadAssetDraftLimiter = createLimiter(5, 60 * 1000);

/** Public lead status inquiry — POST /api/public/lead-tracking. */
export const leadTrackingLimiter = createLimiter(20, 60 * 1000);

// ---------- Authenticated-user limiters (key = user id) ----------

/** Admin media upload — 30 per minute. Admins legitimately upload many files. */
export const adminMediaUploadLimiter = createLimiter(30, 60 * 1000);

/**
 * Admin actions that invoke Hyundai LOS/SLIK downstream APIs — 20 per minute.
 * Each call costs a paid downstream request.
 */
export const adminHyundaiCallLimiter = createLimiter(20, 60 * 1000);

/**
 * Heavy admin sync jobs (e.g. vehicle model master sync) — 10 per hour.
 * Balance between safety and operator UX: 5/hour was too tight during
 * routine debug/re-runs in the same session, 15 felt loose. 10 leaves
 * ~6 minute average spacing, still cheap for downstream Confins calls.
 */
export const adminSyncLimiter = createLimiter(10, 60 * 60 * 1000);

/** Password change — 5 attempts per 15 minutes per user (protects the *current* password). */
export const passwordChangeLimiter = createLimiter(5, 15 * 60 * 1000);

// ---------- Helpers ----------

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const nextIp = (request as { ip?: string }).ip;
  return (
    forwarded?.split(',')[0]?.trim() ||
    realIp ||
    cfConnectingIp ||
    nextIp ||
    'unknown'
  );
}

/**
 * Build a uniform 429 JSON response with `Retry-After` header so clients
 * (and load balancers/WAF) can throttle correctly.
 */
export function tooManyRequestsResponse(
  message: string,
  retryAfterSec: number
): NextResponse {
  const res = NextResponse.json({ error: message }, { status: 429 });
  res.headers.set('Retry-After', String(Math.max(1, retryAfterSec)));
  return res;
}
