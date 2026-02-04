import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';

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

    const existing = await prisma.promo.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    const slugTrimmed = typeof slug === 'string' ? slug.trim() || null : existing.slug;
    if (slugTrimmed && slugTrimmed !== existing.slug) {
      const slugTaken = await prisma.promo.findUnique({
        where: { slug: slugTrimmed },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      title: title.trim(),
      slug: slugTrimmed ?? undefined,
      description: description !== undefined ? (description === null || description === '' ? null : String(description)) : existing.description,
      imageUrl: imageUrl !== undefined ? (imageUrl === null || imageUrl === '' ? null : String(imageUrl)) : existing.imageUrl,
      content: content !== undefined ? (content === null || content === '' ? null : String(content)) : existing.content,
      layout: layout !== undefined ? layout : existing.layout,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      isHighlight: isHighlight !== undefined ? Boolean(isHighlight) : existing.isHighlight,
      order: order !== undefined ? Number(order) : existing.order,
      startDate: startDate !== undefined ? (startDate === null || startDate === '' ? null : new Date(startDate)) : existing.startDate,
      endDate: endDate !== undefined ? (endDate === null || endDate === '' ? null : new Date(endDate)) : existing.endDate,
      bannerImageRatio: bannerImageRatio !== undefined ? bannerImageRatio : existing.bannerImageRatio,
      bannerUseContainer: bannerUseContainer !== undefined ? Boolean(bannerUseContainer) : existing.bannerUseContainer,
      showBannerImage: showBannerImage !== undefined ? Boolean(showBannerImage) : existing.showBannerImage,
    } as Prisma.PromoUpdateInput;

    const promo = await prisma.promo.update({
      where: { id },
      data: updateData,
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
    await prisma.promo.delete({
      where: { id },
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


