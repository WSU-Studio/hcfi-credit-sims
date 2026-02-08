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

    const body = await request.json();
    const { title, subtitle, imageUrl, order, content, layout } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (layout !== undefined && layout !== null && !validateLayout(layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    const createData = {
      title: String(title).trim(),
      subtitle: subtitle === null || subtitle === '' ? null : String(subtitle).trim(),
      imageUrl: imageUrl == null || imageUrl === '' ? '' : String(imageUrl),
      order: Number(order) ?? 0,
      content: content === null || content === '' ? null : String(content),
      layout: layout ?? undefined,
    } as unknown as Prisma.ProductCreateInput;
    const product = await prisma.product.create({ data: createData });

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


