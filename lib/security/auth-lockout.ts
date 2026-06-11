/**
 * Persistent account lockout — survives restarts and is shared across
 * EB instances (lives in Postgres).
 *
 * Strategy:
 *  - Each failed login increments `failedLoginAttempts`.
 *  - When the counter reaches MAX_FAILED_ATTEMPTS, set `lockedUntil =
 *    now + LOCKOUT_DURATION_MS`. Subsequent login attempts on this account
 *    are rejected (regardless of password) until the timestamp expires.
 *  - A successful login resets `failedLoginAttempts = 0` and clears
 *    `lockedUntil`.
 *  - Admins can force-unlock via {@link unlockUserAccount}.
 *
 * This pairs with the in-memory IP/email rate limiters in `lib/ratelimit.ts`:
 * those provide instant, edge-fast protection per request; this provides
 * durable protection per account.
 */
import { prisma } from '@/lib/prisma';

export const MAX_FAILED_ATTEMPTS = 10;
export const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export type AccountLockState = {
  /** True when the account is locked right now. */
  locked: boolean;
  /** Seconds until the lock expires (0 when not locked). */
  retryAfterSec: number;
  /** Failed attempts on record. */
  failedAttempts: number;
};

export function readLockState(user: {
  failedLoginAttempts?: number | null;
  lockedUntil?: Date | null;
}): AccountLockState {
  const lockedUntil = user.lockedUntil ?? null;
  const now = Date.now();
  if (lockedUntil && lockedUntil.getTime() > now) {
    return {
      locked: true,
      retryAfterSec: Math.ceil((lockedUntil.getTime() - now) / 1000),
      failedAttempts: user.failedLoginAttempts ?? 0,
    };
  }
  return {
    locked: false,
    retryAfterSec: 0,
    failedAttempts: user.failedLoginAttempts ?? 0,
  };
}

/**
 * Record a failed login attempt. Returns the resulting lock state so the
 * caller can decide what message to surface to the user.
 *
 * Best-effort: errors are swallowed (we don't want a DB hiccup to mask the
 * "invalid credentials" error path).
 */
export async function recordFailedLogin(userId: string): Promise<AccountLockState> {
  try {
    const nextCount = await prisma.user
      .findUnique({ where: { id: userId }, select: { failedLoginAttempts: true } })
      .then((u) => (u?.failedLoginAttempts ?? 0) + 1);

    const lockedUntil =
      nextCount >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : null;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: nextCount,
        lastFailedLoginAt: new Date(),
        ...(lockedUntil ? { lockedUntil } : {}),
      },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });

    return readLockState(updated);
  } catch (err) {
    console.warn('[auth-lockout] recordFailedLogin error:', err);
    return { locked: false, retryAfterSec: 0, failedAttempts: 0 };
  }
}

/** Clear the failure counter & unlock after a successful login. */
export async function recordSuccessfulLogin(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  } catch (err) {
    console.warn('[auth-lockout] recordSuccessfulLogin error:', err);
  }
}

/** Admin action: clear counter + unlock immediately. */
export async function unlockUserAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}
