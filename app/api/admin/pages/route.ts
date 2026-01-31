import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PAGES', 'view');

    const pages = await prisma.staticPage.findMany({
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json({ pages });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
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

    await requirePermission('PAGES', 'create');

    const body = await request.json();
    const { title, slug, content, layout, showInMenu, menuOrder } = body;
    if (!title || typeof title !== 'string' || !slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }
    const slugTaken = await prisma.staticPage.findUnique({
      where: { slug: String(slug).trim() },
    });
    if (slugTaken) {
      return NextResponse.json(
        { error: 'Slug already in use' },
        { status: 400 }
      );
    }
    if (layout !== undefined && layout !== null) {
      const valid =
        typeof layout === 'object' &&
        layout !== null &&
        'rows' in layout &&
        Array.isArray((layout as { rows: unknown[] }).rows);
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid layout structure' },
          { status: 400 }
        );
      }
    }
    const page = await prisma.staticPage.create({
      data: {
        title: String(title).trim(),
        slug: String(slug).trim(),
        content: content ?? null,
        layout: layout ?? undefined,
        showInMenu: Boolean(showInMenu ?? false),
        menuOrder: Number(menuOrder ?? 0),
      },
    });

    return NextResponse.json({ page });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


