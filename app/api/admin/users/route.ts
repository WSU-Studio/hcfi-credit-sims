import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('USERS', 'view');

    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usersWithoutPassword = users.map(({ password: _p, ...u }) => u);
    return NextResponse.json({ users: usersWithoutPassword });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('USERS', 'create');

    const body = await request.json();
    const { name, email, password, isActive, roleIds } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    if (!password || typeof password !== 'string' || password.trim().length < 6) {
      return NextResponse.json(
        { error: 'Password is required (min 6 characters)' },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailTaken = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    const ids = Array.isArray(roleIds)
      ? roleIds.filter((r: unknown) => typeof r === 'string')
      : [];

    const hashed = await hashPassword(password.trim());

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailTrimmed,
        password: hashed,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    if (ids.length > 0) {
      await prisma.userRole.createMany({
        data: ids.map((roleId: string) => ({ userId: user.id, roleId })),
        skipDuplicates: true,
      });
    }

    const created = await prisma.user.findUnique({
      where: { id: user.id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!created) return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
    const { password: _p, ...safe } = created;

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.USER_CREATE,
      resourceType: 'User',
      resourceId: created.id,
      metadata: {
        email: safe.email,
        name: safe.name,
        isActive: safe.isActive,
        roleIds: ids,
      },
      request,
    });

    return NextResponse.json({ user: safe });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

