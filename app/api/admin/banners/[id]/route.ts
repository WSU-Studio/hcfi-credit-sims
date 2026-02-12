import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('BANNERS', 'view');

    const { id } = await Promise.resolve(params);
    const banner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ banner });
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/banners/[id]:', error);
    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('BANNERS', 'edit');

    const { id } = await Promise.resolve(params);
    const body = await request.json();

    // Clean up empty strings and invalid URLs
    const cleanedData: any = { ...body };
    if (cleanedData.ctaUrl === '' || cleanedData.ctaUrl === '-') {
      cleanedData.ctaUrl = null;
    }
    if (cleanedData.ctaLabel === '') {
      cleanedData.ctaLabel = null;
    }
    if (cleanedData.highlight === '') {
      cleanedData.highlight = null;
    }
    if (cleanedData.description === '') {
      cleanedData.description = null;
    }
    if (cleanedData.titleEn === '') cleanedData.titleEn = null;
    if (cleanedData.highlightEn === '') cleanedData.highlightEn = null;
    if (cleanedData.descriptionEn === '') cleanedData.descriptionEn = null;
    if (cleanedData.ctaLabelEn === '') cleanedData.ctaLabelEn = null;

    const banner = await prisma.banner.update({
      where: { id },
      data: cleanedData,
    });

    return NextResponse.json({ banner });
  } catch (error: unknown) {
    console.error('Error in PUT /api/admin/banners/[id]:', error);
    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('BANNERS', 'delete');

    const { id } = await Promise.resolve(params);
    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/admin/banners/[id]:', error);
    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


