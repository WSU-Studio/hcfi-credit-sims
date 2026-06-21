import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail, verifyPassword } from '@/lib/auth';
import { loginEmailLimiter } from '@/lib/ratelimit';
import {
  readLockState,
  recordFailedLogin,
  recordSuccessfulLogin,
} from '@/lib/security/auth-lockout';

/**
 * `authorize()` error messages are surfaced to the UI verbatim by next-auth.
 * Use generic "Invalid credentials" for missing/wrong password to avoid
 * leaking whether the email exists. Lockout messages are intentionally
 * specific so legit users know to wait / contact admin.
 */
const GENERIC_INVALID = 'Invalid credentials';

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
          throw new Error('Email and password are required');
        }

        const email = String(credentials.email).toLowerCase().trim();

        // Layer 1: per-email in-memory limiter. Stops botnet brute-force
        // even when each request comes from a different IP.
        const rl = loginEmailLimiter.limit(`email:${email}`);
        if (!rl.success) {
          throw new Error(
            `Akun di-lock sementara karena terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfterSec} detik.`
          );
        }

        const user = await getUserByEmail(email);

        // Don't leak whether the email exists.
        if (!user || !user.isActive) {
          throw new Error(GENERIC_INVALID);
        }

        // Layer 2: persistent DB lockout — survives restarts.
        const lockState = readLockState(user);
        if (lockState.locked) {
          throw new Error(
            `Akun terkunci. Coba lagi dalam ${Math.ceil(lockState.retryAfterSec / 60)} menit atau hubungi admin.`
          );
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          const next = await recordFailedLogin(user.id);
          if (next.locked) {
            throw new Error(
              'Akun terkunci karena terlalu banyak percobaan login. Hubungi admin untuk membuka kembali.'
            );
          }
          throw new Error(GENERIC_INVALID);
        }

        await recordSuccessfulLogin(user.id);

        const rememberMe =
          credentials.rememberMe === true || credentials.rememberMe === 'true';

        const roleNames = user.userRoles.map((ur) => ur.role.name);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          rememberMe,
          userType: user.userType,
          roleNames,
          vendorCode: user.vendorCode,
          vendorName: user.vendorName,
          vendorCity: user.vendorCity,
          oriOfficeCode: user.oriOfficeCode,
          oriOfficeName: user.oriOfficeName,
          cmoEmpNo: user.cmoEmpNo,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.userType = user.userType ?? null;
        token.roleNames = user.roleNames ?? [];
        token.vendorCode = user.vendorCode ?? null;
        token.vendorName = user.vendorName ?? null;
        token.vendorCity = user.vendorCity ?? null;
        token.oriOfficeCode = user.oriOfficeCode ?? null;
        token.oriOfficeName = user.oriOfficeName ?? null;
        token.cmoEmpNo = user.cmoEmpNo ?? null;
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
        session.user.userType = (token.userType as string | null) ?? null;
        session.user.roleNames = (token.roleNames as string[]) ?? [];
        session.user.vendorCode = (token.vendorCode as string | null) ?? null;
        session.user.vendorName = (token.vendorName as string | null) ?? null;
        session.user.vendorCity = (token.vendorCity as string | null) ?? null;
        session.user.oriOfficeCode = (token.oriOfficeCode as string | null) ?? null;
        session.user.oriOfficeName = (token.oriOfficeName as string | null) ?? null;
        session.user.cmoEmpNo = (token.cmoEmpNo as string | null) ?? null;
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
