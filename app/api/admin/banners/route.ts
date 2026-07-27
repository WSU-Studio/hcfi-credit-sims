import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import {
  bannerWriteSchema,
  invalidAdminInputResponse,
} from '@/lib/security/admin-schemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('BANNERS', 'view');

    const banners = await prisma.banner.findMany({
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ banners });
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('BANNERS', 'create');

    const body = await request.json();
    const parsed = bannerWriteSchema.safeParse(body);
    if (!parsed.success) {
      return invalidAdminInputResponse(parsed.error);
    }

    const banner = await prisma.banner.create({
      data: parsed.data,
    });

    return NextResponse.json({ banner });
  } catch (error: unknown) {
    console.error('Error in POST /api/admin/banners:', error);
    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
