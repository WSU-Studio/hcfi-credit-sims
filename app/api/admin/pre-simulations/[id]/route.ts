import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { preSimulationUpdateSchema } from '@/lib/security/pre-simulation-schemas';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('PRE_SIMULATIONS', 'view');

    const { id } = await params;
    const item = await prisma.preSimulation.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error: unknown) {
    console.error('[admin/pre-simulations/[id] GET]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('PRE_SIMULATIONS', 'edit');

    const { id } = await params;
    const existing = await prisma.preSimulation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = preSimulationUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: 'Invalid input',
          field: first?.path?.join('.') ?? 'input',
          message: first?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.slug && data.slug !== existing.slug) {
      const clash = await prisma.preSimulation.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { error: 'Slug sudah digunakan', field: 'slug', message: 'Slug sudah digunakan.' },
          { status: 409 }
        );
      }
    }

    const item = await prisma.preSimulation.update({
      where: { id },
      data: {
        ...(data.title != null ? { title: data.title } : {}),
        ...(data.slug != null ? { slug: data.slug } : {}),
        ...(data.isPublished != null ? { isPublished: data.isPublished } : {}),
        ...(data.summarySnapshot != null
          ? { summarySnapshot: data.summarySnapshot as object }
          : {}),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    console.error('[admin/pre-simulations/[id] PATCH]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('PRE_SIMULATIONS', 'delete');

    const { id } = await params;
    await prisma.preSimulation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[admin/pre-simulations/[id] DELETE]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
