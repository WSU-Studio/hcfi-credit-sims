import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';
import {
  invalidAdminInputResponse,
  promoWriteSchema,
} from '@/lib/security/admin-schemas';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = promoWriteSchema.safeParse(rawBody);
    if (!parsed.success) {
      return invalidAdminInputResponse(parsed.error);
    }

    const input = parsed.data;
    if (input.layout !== undefined && input.layout !== null && !validateLayout(input.layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    if (input.slug) {
      const slugTaken = await prisma.promo.findUnique({
        where: { slug: input.slug } as unknown as Prisma.PromoWhereUniqueInput,
      });
      if (slugTaken) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
      }
    }

    const createData = {
      title: input.title,
      titleEn: input.titleEn,
      slug: input.slug ?? undefined,
      description: input.description,
      descriptionEn: input.descriptionEn,
      imageUrl: input.imageUrl,
      content: input.content,
      contentEn: input.contentEn,
      layout: input.layout ?? undefined,
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
      isHighlight: input.isHighlight !== undefined ? Boolean(input.isHighlight) : false,
      order: input.order ?? 0,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      bannerImageRatio: input.bannerImageRatio ?? undefined,
      bannerUseContainer: input.bannerUseContainer,
      showBannerImage: input.showBannerImage,
    } as unknown as Prisma.PromoCreateInput;

    const promo = await prisma.promo.create({ data: createData });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PROMO_CREATE,
      resourceType: 'Promo',
      resourceId: promo.id,
      metadata: { title: promo.title, slug: promo.slug },
      request,
    });

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
