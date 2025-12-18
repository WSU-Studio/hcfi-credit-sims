import { NextRequest } from 'next/server';

export async function getSessionFromRequest(request: NextRequest) {
  try {
    // Check for NextAuth session token in cookies
    const sessionToken = request.cookies.get('authjs.session-token')?.value || 
                         request.cookies.get('__Secure-authjs.session-token')?.value;

    // If token exists, assume user is authenticated
    // Full validation happens in API routes (Node.js runtime)
    if (sessionToken) {
      return { authenticated: true };
    }

    return null;
  } catch (error) {
    return null;
  }
}

