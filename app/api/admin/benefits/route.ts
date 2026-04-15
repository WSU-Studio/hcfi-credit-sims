import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { syncAdminMenus } from '@/lib/sync-admin-menus';

type IncomingBenefit = {
  id?: string;
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  order?: number;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncAdminMenus();
    await requirePermission('BENEFITS', 'view');

    const benefits = await prisma.benefit.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ benefits });
  } catch (error: unknown) {
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

    await syncAdminMenus();
    await requirePermission('BENEFITS', 'edit');

    const body = await request.json();
    if (!Array.isArray(body.benefits)) {
      return NextResponse.json({ error: 'Invalid payload. benefits must be an array.' }, { status: 400 });
    }

    const sanitized = (body.benefits as IncomingBenefit[]).map((item, index) => ({
      id: typeof item.id === 'string' && item.id.trim() !== '' ? item.id : undefined,
      title: typeof item.title === 'string' ? item.title.trim() : '',
      titleEn: typeof item.titleEn === 'string' && item.titleEn.trim() !== '' ? item.titleEn.trim() : null,
      description: typeof item.description === 'string' ? item.description.trim() : '',
      descriptionEn:
        typeof item.descriptionEn === 'string' && item.descriptionEn.trim() !== ''
          ? item.descriptionEn.trim()
          : null,
      order: Number.isFinite(item.order) ? Number(item.order) : index,
    }));

    if (sanitized.some((item) => item.title === '' || item.description === '')) {
      return NextResponse.json(
        { error: 'Each benefit must include title and description.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.benefit.findMany({ select: { id: true } });
      const keepIds = sanitized
        .map((item) => item.id)
        .filter((id): id is string => typeof id === 'string');

      const deleteIds = existing.map((item) => item.id).filter((id) => !keepIds.includes(id));
      if (deleteIds.length > 0) {
        await tx.benefit.deleteMany({ where: { id: { in: deleteIds } } });
      }

      for (const item of sanitized) {
        if (item.id) {
          await tx.benefit.update({
            where: { id: item.id },
            data: {
              title: item.title,
              titleEn: item.titleEn,
              description: item.description,
              descriptionEn: item.descriptionEn,
              order: item.order,
            },
          });
        } else {
          await tx.benefit.create({
            data: {
              title: item.title,
              titleEn: item.titleEn,
              description: item.description,
              descriptionEn: item.descriptionEn,
              order: item.order,
            },
          });
        }
      }
    });

    const benefits = await prisma.benefit.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ benefits });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

