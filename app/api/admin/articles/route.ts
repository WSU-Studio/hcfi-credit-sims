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
    if (body.layout !== undefined && body.layout !== null && !validateLayout(body.layout)) {
      return NextResponse.json(
        { error: 'Invalid layout structure' },
        { status: 400 }
      );
    }
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
      content: typeof body.content === 'string' ? body.content : '',
      metaDescription: body.metaDescription || null,
      category: body.category || null,
      tags,
      readingTime: body.readingTime != null ? Number(body.readingTime) : null,
      featured: Boolean(body.featured),
      layout: body.layout ?? undefined,
      bannerImageRatio: body.bannerImageRatio ?? undefined,
      bannerUseContainer: body.bannerUseContainer !== undefined ? Boolean(body.bannerUseContainer) : undefined,
      showBannerImage: body.showBannerImage !== undefined ? Boolean(body.showBannerImage) : undefined,
    };
    const article = await prisma.article.create({
      data: data as unknown as Prisma.ArticleCreateInput,
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


