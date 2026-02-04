import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PROMOS', 'view');

    const promos = await prisma.promo.findMany({
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ promos });
  } catch (error: unknown) {
    console.error('Error fetching promos:', error);
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

    await requirePermission('PROMOS', 'create');

    const body = await request.json();
    const { title, slug, description, imageUrl, content, layout, isActive, isHighlight, order, startDate, endDate, bannerImageRatio, bannerUseContainer, showBannerImage } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (layout !== undefined && layout !== null && !validateLayout(layout)) {
      return NextResponse.json(
        { error: 'Invalid layout structure' },
        { status: 400 }
      );
    }

    const slugTrimmed = typeof slug === 'string' ? slug.trim() || null : null;
    if (slugTrimmed) {
      const slugTaken = await prisma.promo.findUnique({
        where: { slug: slugTrimmed } as unknown as Prisma.PromoWhereUniqueInput,
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        );
      }
    }

    const createData = {
      title: title.trim(),
      slug: slugTrimmed ?? undefined,
      description: description === null || description === '' ? null : (description ?? undefined),
      imageUrl: imageUrl === null || imageUrl === '' ? null : (imageUrl ?? undefined),
      content: content === null || content === '' ? null : (content ?? undefined),
      layout: layout ?? undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isHighlight: isHighlight !== undefined ? Boolean(isHighlight) : false,
      order: order !== undefined ? Number(order) : 0,
      startDate: startDate === null || startDate === '' ? null : (startDate ? new Date(startDate) : undefined),
      endDate: endDate === null || endDate === '' ? null : (endDate ? new Date(endDate) : undefined),
      bannerImageRatio: bannerImageRatio ?? undefined,
      bannerUseContainer: bannerUseContainer !== undefined ? Boolean(bannerUseContainer) : undefined,
      showBannerImage: showBannerImage !== undefined ? Boolean(showBannerImage) : undefined,
    } as unknown as Prisma.PromoCreateInput;
    const promo = await prisma.promo.create({ data: createData });

    return NextResponse.json({ promo });
  } catch (error: unknown) {
    console.error('Error creating promo:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


