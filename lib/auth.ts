import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:9',message:'verifyPassword called',data:{passwordLength:password?.length,hashedPasswordLength:hashedPassword?.length,hashedPasswordPrefix:hashedPassword?.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  const result = await bcrypt.compare(password, hashedPassword);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:14',message:'verifyPassword result',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  return result;
}

export async function getUserByEmail(email: string) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:15',message:'getUserByEmail called',data:{email,emailLength:email?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: {
                    include: {
                      menu: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/48407d34-d8ae-4a49-abc9-00f94f0936b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:40',message:'getUserByEmail result',data:{userFound:!!user,userId:user?.id,isActive:user?.isActive,email:user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  return user;
}


