import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';
import {
  articleCreateSchema,
  invalidAdminInputResponse,
} from '@/lib/security/admin-schemas';

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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = articleCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return invalidAdminInputResponse(parsed.error);
    }

    const input = parsed.data;
    if (input.layout !== undefined && !validateLayout(input.layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    const slug =
      input.slug ||
      input.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const data = {
      title: input.title,
      slug: slug || `article-${Date.now()}`,
      authorId: session.user.id,
      content: input.content,
      subtitle: input.subtitle,
      excerpt: input.excerpt,
      metaDescription: input.metaDescription,
      titleEn: input.titleEn,
      subtitleEn: input.subtitleEn,
      excerptEn: input.excerptEn,
      contentEn: input.contentEn,
      metaDescriptionEn: input.metaDescriptionEn,
      category: input.category,
      tags: input.tags ?? [],
      readingTime: input.readingTime,
      featured: Boolean(input.featured),
      isPublished: Boolean(input.isPublished),
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      imageUrl: input.imageUrl,
      layout: input.layout ?? undefined,
      bannerImageRatio: input.bannerImageRatio ?? undefined,
      bannerUseContainer: input.bannerUseContainer,
      showBannerImage: input.showBannerImage,
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
