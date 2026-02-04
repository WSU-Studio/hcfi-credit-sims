import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cloudinary = require('cloudinary').v2;

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('MEDIA', 'create');

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            'Untuk import dari Cloudinary, set di .env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
        },
        { status: 400 }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const existing = await prisma.media.findMany({
      select: { cloudinaryId: true, url: true },
    });
    const existingIds = new Set(
      existing.map((m) => m.cloudinaryId).filter(Boolean)
    );
    const existingUrls = new Set(existing.map((m) => m.url));

    let total = 0;
    let nextCursor: string | undefined;

    do {
      const result: { resources: any[]; next_cursor?: string } =
        await cloudinary.api.resources({
          type: 'upload',
          max_results: 500,
          next_cursor: nextCursor,
        });

      const resources = result.resources || [];
      nextCursor = result.next_cursor;

      for (const r of resources) {
        const publicId = r.public_id;
        const secureUrl = r.secure_url;
        if (existingIds.has(publicId) || existingUrls.has(secureUrl)) continue;

        await prisma.media.create({
          data: {
            filename: r.original_filename || publicId.split('/').pop() || 'image',
            url: secureUrl,
            cloudinaryId: publicId,
            mimeType: r.format || null,
            size: r.bytes ?? null,
            width: r.width ?? null,
            height: r.height ?? null,
          },
        });
        existingIds.add(publicId);
        existingUrls.add(secureUrl);
        total++;
      }
    } while (nextCursor);

    return NextResponse.json({
      success: true,
      imported: total,
      message: total > 0 ? `Berhasil mengimpor ${total} media.` : 'Tidak ada media baru yang diimpor.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: message || 'Gagal import dari Cloudinary' },
      { status: 500 }
    );
  }
}
