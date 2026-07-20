import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';
import {
  invalidAdminInputResponse,
  productUpdateSchema,
  productWriteSchema,
} from '@/lib/security/admin-schemas';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Product form always sends a full payload; prefer full schema, fall back to partial.
    const full = productWriteSchema.safeParse(rawBody);
    const parsed = full.success ? full : productUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return invalidAdminInputResponse(parsed.error);
    }

    const input = parsed.data;
    if (input.layout !== undefined && input.layout !== null && !validateLayout(input.layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    const updateData = {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.titleEn !== undefined && { titleEn: input.titleEn }),
      ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
      ...(input.subtitleEn !== undefined && { subtitleEn: input.subtitleEn }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.contentEn !== undefined && { contentEn: input.contentEn }),
      ...(input.layout !== undefined && { layout: input.layout ?? null }),
      ...(input.isFeatured !== undefined && { isFeatured: Boolean(input.isFeatured) }),
    } as unknown as Prisma.ProductUpdateInput;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PRODUCT_UPDATE,
      resourceType: 'Product',
      resourceId: product.id,
      metadata: { title: product.title },
      request,
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
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PRODUCT_DELETE,
      resourceType: 'Product',
      resourceId: id,
      metadata: { title: existing.title },
      request,
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
