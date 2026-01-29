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

    await requirePermission('ARTICLES', 'view');

    const articles = await prisma.article.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ articles });
  } catch (error: unknown) {
    console.error('Error fetching articles:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
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

    await requirePermission('ARTICLES', 'create');

    const body = await request.json();
    const slug =
      body.slug?.trim() ||
      (body.title || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    const tags = Array.isArray(body.tags)
      ? body.tags.filter(Boolean).map((t: string) => String(t).trim())
      : typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
    const data = {
      ...body,
      slug: slug || `article-${Date.now()}`,
      authorId: session.user.id,
      metaDescription: body.metaDescription || null,
      category: body.category || null,
      tags,
      readingTime: body.readingTime != null ? Number(body.readingTime) : null,
      featured: Boolean(body.featured),
    };
    const article = await prisma.article.create({
      data,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ article });
  } catch (error: unknown) {
    console.error('Error creating article:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


