import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('ROLES', 'view');

    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ roles });
  } catch (error: unknown) {
    console.error('Error fetching roles:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
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

    await requirePermission('ROLES', 'create');

    const body = await request.json();
    const { name, description, permissionIds, activities } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const nameTaken = await prisma.role.findUnique({
      where: { name: name.trim() },
    });
    if (nameTaken) {
      return NextResponse.json(
        { error: 'Role name already in use' },
        { status: 400 }
      );
    }

    const ids = Array.isArray(permissionIds)
      ? permissionIds.filter((p: unknown) => typeof p === 'string')
      : [];
    const activityIds = Array.isArray(activities)
      ? activities.filter((a: unknown) => typeof a === 'string')
      : [];

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description:
          description !== undefined && description !== null && description !== ''
            ? String(description)
            : null,
        activities: activityIds,
      },
    });

    if (ids.length > 0) {
      await prisma.rolePermission.createMany({
        data: ids.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    const created = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });

    return NextResponse.json({ role: created });
  } catch (error: unknown) {
    console.error('Error creating role:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


