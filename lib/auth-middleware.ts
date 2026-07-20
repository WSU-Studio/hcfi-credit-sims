/**
 * Edge-compatible session gate for middleware.
 * Decodes/verifies the Auth.js JWT (not just cookie presence).
 */
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export type MiddlewareSession = {
  authenticated: true;
  userId: string | null;
};

export async function getSessionFromRequest(
  request: NextRequest
): Promise<MiddlewareSession | null> {
  try {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[auth-middleware] AUTH_SECRET / NEXTAUTH_SECRET is not set');
      return null;
    }

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttps =
      forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

    const token = await getToken({
      req: request,
      secret,
      secureCookie: isHttps,
    });

    if (!token) return null;

    const userId =
      (typeof token.id === 'string' && token.id) ||
      (typeof token.sub === 'string' && token.sub) ||
      null;

    // Reject expired tokens even if cookie still present.
    if (typeof token.exp === 'number' && token.exp * 1000 <= Date.now()) {
      return null;
    }

    return { authenticated: true, userId };
  } catch (error) {
    console.error('[auth-middleware] token validation failed', error);
    return null;
  }
}
