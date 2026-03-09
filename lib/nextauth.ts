import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail, verifyPassword } from '@/lib/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:13',message:'authorize called',data:{hasEmail:!!credentials?.email,hasPassword:!!credentials?.password,email:credentials?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (!credentials?.email || !credentials?.password) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:16',message:'missing credentials',data:{hasEmail:!!credentials?.email,hasPassword:!!credentials?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          throw new Error('Email and password are required');
        }

        const user = await getUserByEmail(credentials.email as string);

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:22',message:'user lookup result',data:{userFound:!!user,userId:user?.id,isActive:user?.isActive,email:credentials.email as string},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        if (!user || !user.isActive) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:25',message:'user not found or inactive',data:{userFound:!!user,isActive:user?.isActive},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          throw new Error('Invalid credentials');
        }

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:27',message:'before password verify',data:{hasPassword:!!credentials.password,hasHashedPassword:!!user.password,hashedPasswordLength:user.password?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:35',message:'password verify result',data:{isValid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        if (!isValid) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:38',message:'password invalid',data:{isValid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          throw new Error('Invalid credentials');
        }

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:41',message:'authorize success',data:{userId:user.id,email:user.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        return {
          id: user.id,
          email: user.email,
          name: user.name,
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
