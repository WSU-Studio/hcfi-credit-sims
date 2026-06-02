import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('USERS', 'view');

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { select: { roleId: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password: _p, ...userWithoutPassword } = user;
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        roleIds: user.userRoles.map((ur) => ur.roleId),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('USERS', 'edit');

    const { id } = await params;
    const body = await request.json();
    const { name, email, password, isActive, roleIds } = body;

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    const emailTrimmed = email.trim().toLowerCase();
    if (emailTrimmed !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: emailTrimmed },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    const ids = Array.isArray(roleIds)
      ? roleIds.filter((r: unknown) => typeof r === 'string')
      : [];

    const updateData: {
      name: string;
      email: string;
      isActive?: boolean;
      password?: string;
    } = {
      name: name.trim(),
      email: emailTrimmed,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
    };

    if (typeof password === 'string' && password.trim().length > 0) {
      updateData.password = await hashPassword(password.trim());
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.user.update({
        where: { id },
        data: updateData,
      }),
    ]);

    if (ids.length > 0) {
      await prisma.userRole.createMany({
        data: ids.map((roleId: string) => ({ userId: id, roleId })),
        skipDuplicates: true,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const { password: _p, ...safe } = user;

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.USER_UPDATE,
      resourceType: 'User',
      resourceId: id,
      metadata: {
        before: {
          email: existing.email,
          name: existing.name,
          isActive: existing.isActive,
          roleIds: existing.userRoles.map((r) => r.roleId),
        },
        after: {
          email: safe.email,
          name: safe.name,
          isActive: safe.isActive,
          roleIds: ids,
        },
        passwordChanged: typeof password === 'string' && password.trim().length > 0,
      },
      request,
    });

    return NextResponse.json({ user: safe });
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('USERS', 'delete');

    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });

    await prisma.user.delete({
      where: { id },
    });

    if (target) {
      await recordAudit({
        actor: actorFromSession(session),
        action: AUDIT_ACTIONS.USER_DELETE,
        resourceType: 'User',
        resourceId: id,
        metadata: { deletedEmail: target.email, deletedName: target.name },
        request,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
