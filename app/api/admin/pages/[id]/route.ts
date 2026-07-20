import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { validateLayout } from '@/lib/validate-layout';
import {
  invalidAdminInputResponse,
  pageWriteSchema,
} from '@/lib/security/admin-schemas';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = pageWriteSchema.safeParse(rawBody);
    if (!parsed.success) {
      return invalidAdminInputResponse(parsed.error);
    }

    const input = parsed.data;
    if (!validateLayout(input.layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    const existing = await prisma.staticPage.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (input.slug !== existing.slug) {
      const slugTaken = await prisma.staticPage.findUnique({
        where: { slug: input.slug } as unknown as Prisma.StaticPageWhereUniqueInput,
      });
      if (slugTaken) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
      }
    }

    const updateData = {
      title: input.title,
      titleEn: input.titleEn,
      slug: input.slug,
      content: input.content,
      contentEn: input.contentEn,
      layout: input.layout ?? null,
      showInMenu: Boolean(input.showInMenu ?? false),
      menuOrder: input.menuOrder ?? 0,
      showBasicContent:
        input.showBasicContent !== undefined ? Boolean(input.showBasicContent) : true,
    } as unknown as Prisma.StaticPageUpdateInput;

    const page = await prisma.staticPage.update({ where: { id }, data: updateData });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PAGE_UPDATE,
      resourceType: 'StaticPage',
      resourceId: page.id,
      metadata: { title: page.title, slug: page.slug },
      request,
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PAGES', 'delete');

    const { id } = await params;
    const existing = await prisma.staticPage.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    await prisma.staticPage.delete({
      where: { id },
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PAGE_DELETE,
      resourceType: 'StaticPage',
      resourceId: id,
      metadata: { title: existing.title, slug: existing.slug },
      request,
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
