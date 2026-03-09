/**
 * In-memory rate limiter (no external service).
 * Note: In serverless, each instance has its own store; limits are per-instance.
 */

type Entry = { count: number; resetAt: number };

function createLimiter(max: number, windowMs: number) {
  const store = new Map<string, Entry>();

  // Cleanup expired entries periodically to avoid memory leak
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  };
  setInterval(cleanup, 60_000); // every minute

  return {
    limit(identifier: string): { success: boolean } {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry) {
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { success: true };
      }

      if (entry.resetAt <= now) {
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { success: true };
      }

      entry.count++;
      if (entry.count > max) {
        return { success: false };
      }
      return { success: true };
    },
  };
}

/** Login: 5 attempts per 15 minutes per IP */
export const loginLimiter = createLimiter(5, 15 * 60 * 1000);

/** Leads: 10 submissions per minute per IP */
export const leadsLimiter = createLimiter(10, 60 * 1000);

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  return (
    forwarded?.split(',')[0]?.trim() ||
    realIp ||
    cfConnectingIp ||
    'unknown'
  );
}
