import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';
import {
  articleUpdateSchema,
  invalidAdminInputResponse,
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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = articleUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return invalidAdminInputResponse(parsed.error);
    }

    const input = parsed.data;
    if (input.layout !== undefined && input.layout !== null && !validateLayout(input.layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.slug !== undefined && input.slug !== '') data.slug = input.slug;
    if (input.subtitle !== undefined) data.subtitle = input.subtitle;
    if (input.excerpt !== undefined) data.excerpt = input.excerpt;
    if (input.content !== undefined) data.content = input.content;
    if (input.contentEn !== undefined) data.contentEn = input.contentEn;
    if (input.titleEn !== undefined) data.titleEn = input.titleEn;
    if (input.subtitleEn !== undefined) data.subtitleEn = input.subtitleEn;
    if (input.excerptEn !== undefined) data.excerptEn = input.excerptEn;
    if (input.metaDescription !== undefined) data.metaDescription = input.metaDescription;
    if (input.metaDescriptionEn !== undefined) data.metaDescriptionEn = input.metaDescriptionEn;
    if (input.category !== undefined) data.category = input.category;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.readingTime !== undefined) data.readingTime = input.readingTime;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.isPublished !== undefined) data.isPublished = input.isPublished;
    if (input.publishedAt !== undefined) {
      data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    }
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
    if (input.layout !== undefined) data.layout = input.layout;
    if (input.bannerImageRatio !== undefined) data.bannerImageRatio = input.bannerImageRatio;
    if (input.bannerUseContainer !== undefined) data.bannerUseContainer = input.bannerUseContainer;
    if (input.showBannerImage !== undefined) data.showBannerImage = input.showBannerImage;

    const article = await prisma.article.update({
      where: { id },
      data: data as unknown as Prisma.ArticleUpdateInput,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.ARTICLE_UPDATE,
      resourceType: 'Article',
      resourceId: article.id,
      metadata: {
        title: article.title,
        slug: article.slug,
        isPublished: article.isPublished,
      },
      request,
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
    const existing = await prisma.article.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    await prisma.article.delete({
      where: { id },
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.ARTICLE_DELETE,
      resourceType: 'Article',
      resourceId: id,
      metadata: { title: existing.title, slug: existing.slug },
      request,
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


