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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('PAGES', 'create');

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
    if (input.layout !== undefined && input.layout !== null && !validateLayout(input.layout)) {
      return NextResponse.json({ error: 'Invalid layout structure' }, { status: 400 });
    }

    const slugTaken = await prisma.staticPage.findUnique({
      where: { slug: input.slug } as unknown as Prisma.StaticPageWhereUniqueInput,
    });
    if (slugTaken) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
    }

    const createData = {
      title: input.title,
      titleEn: input.titleEn,
      slug: input.slug,
      content: input.content,
      contentEn: input.contentEn,
      layout: input.layout ?? undefined,
      showInMenu: Boolean(input.showInMenu ?? false),
      menuOrder: input.menuOrder ?? 0,
      showBasicContent: input.showBasicContent !== undefined ? Boolean(input.showBasicContent) : true,
    } as unknown as Prisma.StaticPageCreateInput;

    const page = await prisma.staticPage.create({ data: createData });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.PAGE_CREATE,
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
