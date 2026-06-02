import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { unlockUserAccount } from '@/lib/security/auth-lockout';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

/**
 * Admin-only: clear an account's lockout state immediately.
 * Resets `failedLoginAttempts` to 0 and `lockedUntil` to null.
 */
export async function POST(
  request: NextRequest,
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
      select: { id: true, email: true, failedLoginAttempts: true, lockedUntil: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await unlockUserAccount(id);

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.USER_UNLOCK,
      resourceType: 'User',
      resourceId: id,
      metadata: {
        unlockedEmail: user.email,
        failedAttemptsBefore: user.failedLoginAttempts,
        lockedUntilBefore: user.lockedUntil,
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[admin/users/unlock] error:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
