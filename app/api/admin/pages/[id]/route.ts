import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

const ALLOWED_WIDGET_TYPES = ['text', 'text_image'];

function validateLayout(layout: unknown): boolean {
  if (layout === null || layout === undefined) return true;
  if (typeof layout !== 'object' || !('rows' in layout)) return false;
  const root = layout as { rows: unknown[] };
  if (!Array.isArray(root.rows)) return false;
  for (const row of root.rows) {
    if (typeof row !== 'object' || row === null) return false;
    const r = row as { id?: unknown; gridCols?: unknown; cells?: unknown[] };
    if (typeof r.id !== 'string') return false;
    if (r.gridCols !== 1 && r.gridCols !== 2 && r.gridCols !== 3) return false;
    if (!Array.isArray(r.cells)) return false;
    if (r.cells.length !== r.gridCols) return false;
    for (const cell of r.cells) {
      if (typeof cell !== 'object' || cell === null) return false;
      const c = cell as { id?: unknown; widgetType?: unknown; payload?: unknown };
      if (typeof c.id !== 'string') return false;
      if (typeof c.widgetType !== 'string' || !ALLOWED_WIDGET_TYPES.includes(c.widgetType)) return false;
      if (typeof c.payload !== 'object' || c.payload === null) return false;
    }
  }
  return true;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PAGES', 'view');

    const { id } = await params;
    const page = await prisma.staticPage.findUnique({
      where: { id },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
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

    await requirePermission('PAGES', 'edit');

    const { id } = await params;
    const body = await request.json();
    const { title, slug, content, layout, showInMenu, menuOrder } = body;

    if (!title || typeof title !== 'string' || !slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    if (!validateLayout(layout)) {
      return NextResponse.json(
        { error: 'Invalid layout structure' },
        { status: 400 }
      );
    }

    const existing = await prisma.staticPage.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (slug !== existing.slug) {
      const slugTaken = await prisma.staticPage.findUnique({
        where: { slug: slug.trim() },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        );
      }
    }

    const page = await prisma.staticPage.update({
      where: { id },
      data: {
        title: title.trim(),
        slug: slug.trim(),
        content: content ?? existing.content,
        layout: layout ?? existing.layout,
        showInMenu: showInMenu !== undefined ? Boolean(showInMenu) : existing.showInMenu,
        menuOrder: menuOrder !== undefined ? Number(menuOrder) : existing.menuOrder,
      },
    });

    return NextResponse.json({ page });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PAGES', 'delete');

    const { id } = await params;
    await prisma.staticPage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
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
