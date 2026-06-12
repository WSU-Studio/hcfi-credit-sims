import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { toMediaProxyUrl } from '@/lib/s3-url';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('MEDIA', 'view');

    const rows = await prisma.media.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Normalize legacy records (direct S3 URLs uploaded before the proxy
    // existed) so MediaLibrary / MediaPicker can render them without 403s.
    // Idempotent — proxy URLs and external URLs pass through unchanged.
    const media = rows.map((m) => ({
      ...m,
      url: toMediaProxyUrl(m.url) ?? m.url,
    }));

    return NextResponse.json({ media });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
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

    await requirePermission('MEDIA', 'create');

    const body = await request.json();
    const { filename, url, cloudinaryId, mimeType, size, width, height } = body;

    const media = await prisma.media.create({
      data: {
        filename,
        url,
        cloudinaryId,
        mimeType,
        size,
        width,
        height,
      },
    });

    return NextResponse.json({ media });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


