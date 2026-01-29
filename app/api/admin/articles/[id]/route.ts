import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('ARTICLES', 'view');

    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error: unknown) {
    console.error('Error fetching article:', error);
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

    await requirePermission('ARTICLES', 'edit');

    const { id } = await params;
    const body = await request.json();
    const { authorId: _omit, ...rest } = body;
    const tags =
      rest.tags !== undefined
        ? Array.isArray(rest.tags)
          ? rest.tags.filter(Boolean).map((t: string) => String(t).trim())
          : String(rest.tags)
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean)
        : undefined;
    const data = {
      ...rest,
      ...(tags !== undefined && { tags }),
      ...(rest.readingTime != null && { readingTime: Number(rest.readingTime) }),
      ...(rest.featured !== undefined && { featured: Boolean(rest.featured) }),
    };
    const article = await prisma.article.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ article });
  } catch (error: unknown) {
    console.error('Error updating article:', error);
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

    await requirePermission('ARTICLES', 'delete');

    const { id } = await params;
    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting article:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


