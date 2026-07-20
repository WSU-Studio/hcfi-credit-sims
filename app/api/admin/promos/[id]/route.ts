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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PROMOS', 'view');

    const { id } = await params;
    const promo = await prisma.promo.findUnique({
      where: { id },
    });

    if (!promo) {
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    return NextResponse.json({ promo });
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

    await requirePermission('PROMOS', 'edit');

    const { id } = await params;

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

    const existing = await prisma.promo.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await prisma.promo.findUnique({
        where: { slug: input.slug } as unknown as Prisma.PromoWhereUniqueInput,
      });
      if (slugTaken) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
      }
    }

    const updateData = {
      title: input.title,
      titleEn: input.titleEn,
      slug: input.slug,
      description: input.description,
      descriptionEn: input.descriptionEn,
      imageUrl: input.imageUrl,
      content: input.content,
      contentEn: input.contentEn,
      layout: input.layout ?? null,
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : existing.isActive,
      isHighlight:
        input.isHighlight !== undefined ? Boolean(input.isHighlight) : existing.isHighlight,
      order: input.order ?? existing.order,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      bannerImageRatio: input.bannerImageRatio,
      bannerUseContainer: input.bannerUseContainer,
      showBannerImage: input.showBannerImage,
    } as unknown as Prisma.PromoUpdateInput;

    const promo = await prisma.promo.update({
      where: { id },
      data: updateData,
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PROMO_UPDATE,
      resourceType: 'Promo',
      resourceId: promo.id,
      metadata: { title: promo.title, slug: promo.slug },
      request,
    });

    return NextResponse.json({ promo });
  } catch (error: unknown) {
    console.error('Error updating promo:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
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

    await requirePermission('PROMOS', 'delete');

    const { id } = await params;
    const existing = await prisma.promo.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    await prisma.promo.delete({
      where: { id },
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PROMO_DELETE,
      resourceType: 'Promo',
      resourceId: id,
      metadata: { title: existing.title, slug: existing.slug },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting promo:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
