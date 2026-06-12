import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { validateImageFile } from '@/lib/image-utils';
import { getS3Bucket, getS3Client } from '@/lib/s3-client';
import { mediaProxyUrlFromKey } from '@/lib/s3-url';
import { adminMediaUploadLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';

const FOLDER = 'hcfi_media';
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB — slightly higher than KTP because admin may upload promo banners

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = adminMediaUploadLimiter.limit(session.user.id);
    if (!rl.success) {
      return tooManyRequestsResponse(
        'Terlalu banyak upload. Tunggu beberapa saat.',
        rl.retryAfterSec
      );
    }

    await requirePermission('MEDIA', 'create');

    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES + 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 25MB' }, { status: 413 });
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type harus multipart/form-data' }, { status: 415 });
    }

    const bucket = getS3Bucket();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Ukuran file maksimal 25MB' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const validation = validateImageFile(inputBuffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(webpBuffer).metadata();
    const key = `${FOLDER}/${randomUUID()}-${Date.now()}.webp`;

    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: webpBuffer,
        ContentType: 'image/webp',
      })
    );

    // Bucket is private (VPC endpoint only). Browsers must hit our proxy
    // (`/api/media/file/{key}`), not the direct S3 URL.
    const url = mediaProxyUrlFromKey(key);

    const media = await prisma.media.create({
      data: {
        filename: file.name,
        url,
        cloudinaryId: key,
        mimeType: 'image/webp',
        size: webpBuffer.length,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      },
    });

    return NextResponse.json({ media });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload gagal';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
