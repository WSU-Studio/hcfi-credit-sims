import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';
import {
  invalidAdminInputResponse,
  productWriteSchema,
} from '@/lib/security/admin-schemas';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PRODUCTS', 'view');

    const products = await prisma.product.findMany({
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ products });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      console.error('Error fetching products:', error);
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

    await requirePermission('PRODUCTS', 'create');

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = productWriteSchema.safeParse(rawBody);
    if (!parsed.success) {
      return invalidAdminInputResponse(parsed.error);
    }

    const input = parsed.data;
    if (input.layout !== undefined && input.layout !== null && !validateLayout(input.layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    const createData = {
      title: input.title,
      titleEn: input.titleEn,
      subtitle: input.subtitle,
      subtitleEn: input.subtitleEn,
      imageUrl: input.imageUrl,
      order: input.order ?? 0,
      content: input.content,
      contentEn: input.contentEn,
      layout: input.layout ?? undefined,
      isFeatured: Boolean(input.isFeatured ?? false),
    } as unknown as Prisma.ProductCreateInput;

    const product = await prisma.product.create({ data: createData });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PRODUCT_CREATE,
      resourceType: 'Product',
      resourceId: product.id,
      metadata: { title: product.title },
      request,
    });

    return NextResponse.json({ product });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
