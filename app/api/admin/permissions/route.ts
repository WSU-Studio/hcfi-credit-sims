import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { syncAdminMenus } from '@/lib/sync-admin-menus';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('ROLES', 'view');
    await syncAdminMenus();

    const permissions = await prisma.permission.findMany({
      include: {
        menu: { select: { name: true, code: true, order: true } },
      },
      orderBy: {
        menu: { order: 'asc' },
      },
    });

    return NextResponse.json({ permissions });
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
