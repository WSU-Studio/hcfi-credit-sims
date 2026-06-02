import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { unlockUserAccount } from '@/lib/security/auth-lockout';

/**
 * Admin-only: clear an account's lockout state immediately.
 * Resets `failedLoginAttempts` to 0 and `lockedUntil` to null.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('USERS', 'edit');

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await unlockUserAccount(id);

    console.info(
      '[admin/users/unlock] user=%s unlocked by admin=%s',
      user.email,
      session.user.email ?? session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[admin/users/unlock] error:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
