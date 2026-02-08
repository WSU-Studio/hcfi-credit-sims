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
    const { title, slug, content, layout, showInMenu, menuOrder, showBasicContent } = body;

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

    const existingFields = existing as typeof existing & {
      slug?: string;
      content?: string | null;
      layout?: unknown;
      showInMenu?: boolean;
      menuOrder?: number;
      showBasicContent?: boolean;
    };
    if (slug !== existingFields.slug) {
      const slugTaken = await prisma.staticPage.findUnique({
        where: { slug: slug.trim() } as unknown as Prisma.StaticPageWhereUniqueInput,
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
      slug: slug.trim(),
      content: content ?? existingFields.content,
      layout: layout ?? existingFields.layout,
      showInMenu: showInMenu !== undefined ? Boolean(showInMenu) : existingFields.showInMenu,
      menuOrder: menuOrder !== undefined ? Number(menuOrder) : existingFields.menuOrder,
      showBasicContent: showBasicContent !== undefined ? Boolean(showBasicContent) : existingFields.showBasicContent ?? true,
    } as unknown as Prisma.StaticPageUpdateInput;
    const page = await prisma.staticPage.update({ where: { id }, data: updateData });

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
