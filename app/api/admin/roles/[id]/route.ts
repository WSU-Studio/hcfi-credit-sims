import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('ROLES', 'view');

    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          select: { permissionId: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({
      role: {
        ...role,
        permissionIds: role.rolePermissions.map((rp) => rp.permissionId),
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

    await requirePermission('ROLES', 'edit');

    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const nameTaken = await prisma.role.findUnique({
        where: { name: name.trim() },
      });
      if (nameTaken) {
        return NextResponse.json(
          { error: 'Role name already in use' },
          { status: 400 }
        );
      }
    }

    const ids = Array.isArray(permissionIds)
      ? permissionIds.filter((p: unknown) => typeof p === 'string')
      : [];

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.role.update({
        where: { id },
        data: {
          name: name.trim(),
          description:
            description !== undefined && description !== null
              ? (description === '' ? null : String(description))
              : existing.description,
        },
      }),
    ]);

    if (ids.length > 0) {
      await prisma.rolePermission.createMany({
        data: ids.map((permissionId: string) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: { select: { permissionId: true } },
      },
    });

    return NextResponse.json({ role });
  } catch (error: unknown) {
    console.error('Error updating role:', error);
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('ROLES', 'delete');

    const { id } = await params;

    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting role:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
