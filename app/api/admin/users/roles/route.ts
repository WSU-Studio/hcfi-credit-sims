import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { checkPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

/**
 * Minimal role list for user create/edit forms.
 * Uses USERS permission (not ROLES) so admins who manage users
 * can assign roles without needing full Role & Permission access.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const canManageUsers =
      (await checkPermission(userId, 'USERS', 'view')) ||
      (await checkPermission(userId, 'USERS', 'create')) ||
      (await checkPermission(userId, 'USERS', 'edit'));

    if (!canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ roles });
  } catch (error: unknown) {
    console.error('Error fetching assignable roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
