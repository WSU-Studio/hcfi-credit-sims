import { CredentialsSignin } from '@auth/core/errors';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail, verifyPassword } from '@/lib/auth';
import { LOGIN_ERROR_CODES } from '@/lib/auth-login-errors';
import { loginEmailLimiter } from '@/lib/ratelimit';
import {
  readLockState,
  recordFailedLogin,
  recordSuccessfulLogin,
} from '@/lib/security/auth-lockout';

function rejectLogin(code: string): never {
  const error = new CredentialsSignin();
  error.code = code;
  throw error;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          rejectLogin(LOGIN_ERROR_CODES.MISSING_FIELDS);
        }

        const email = String(credentials.email).toLowerCase().trim();

        // Layer 1: per-email in-memory limiter. Stops botnet brute-force
        // even when each request comes from a different IP.
        const rl = loginEmailLimiter.limit(`email:${email}`);
        if (!rl.success) {
          rejectLogin(LOGIN_ERROR_CODES.RATE_LIMITED);
        }

        const user = await getUserByEmail(email);

        // Don't leak whether the email exists.
        if (!user || !user.isActive) {
          return null;
        }

        // Layer 2: persistent DB lockout — survives restarts.
        const lockState = readLockState(user);
        if (lockState.locked) {
          rejectLogin(LOGIN_ERROR_CODES.ACCOUNT_LOCKED);
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          const next = await recordFailedLogin(user.id);
          if (next.locked) {
            rejectLogin(LOGIN_ERROR_CODES.ACCOUNT_LOCKED_ADMIN);
          }
          return null;
        }

        await recordSuccessfulLogin(user.id);

        const rememberMe =
          credentials.rememberMe === true || credentials.rememberMe === 'true';

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          rememberMe,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        const rememberMe = (user as { rememberMe?: boolean }).rememberMe ?? false;
        const maxAgeSec = rememberMe ? 30 * 24 * 60 * 60 : 6 * 60 * 60; // 30 days or 6 hours
        token.exp = Math.floor(Date.now() / 1000) + maxAgeSec;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
