import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { passwordChangeLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = passwordChangeLimiter.limit(session.user.id);
    if (!rl.success) {
      return tooManyRequestsResponse(
        'Terlalu banyak percobaan ubah password. Coba lagi nanti.',
        rl.retryAfterSec
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword.trim());
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.USER_PASSWORD_CHANGE,
      resourceType: 'User',
      resourceId: session.user.id,
      metadata: { selfService: true },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
