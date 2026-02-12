import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PRODUCTS', 'view');

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: unknown) {
    console.error('Error fetching product:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
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

    await requirePermission('PRODUCTS', 'edit');

    const { id } = await params;
    const body = await request.json();
    const { title, titleEn, subtitle, subtitleEn, imageUrl, order, content, contentEn, layout, isFeatured } = body;

    if (title !== undefined && (!title || typeof title !== 'string')) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (layout !== undefined && layout !== null && !validateLayout(layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    const updateData = {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(titleEn !== undefined && { titleEn: titleEn === null || titleEn === '' ? null : String(titleEn).trim() }),
      ...(subtitle !== undefined && { subtitle: subtitle === null || subtitle === '' ? null : String(subtitle).trim() }),
      ...(subtitleEn !== undefined && { subtitleEn: subtitleEn === null || subtitleEn === '' ? null : String(subtitleEn).trim() }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl == null || imageUrl === '' ? '' : String(imageUrl) }),
      ...(order !== undefined && { order: Number(order) ?? 0 }),
      ...(content !== undefined && { content: content === null || content === '' ? null : String(content) }),
      ...(contentEn !== undefined && { contentEn: contentEn === null || contentEn === '' ? null : String(contentEn) }),
      ...(layout !== undefined && { layout: layout ?? null }),
      ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
    } as unknown as Prisma.ProductUpdateInput;
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ product });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
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

    await requirePermission('PRODUCTS', 'delete');

    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


