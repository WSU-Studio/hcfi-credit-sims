import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { validateImageFile } from '@/lib/image-utils';
import { getClientIp, leadsLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';
import { toUserFacingS3Error } from '@/lib/s3-error-message';
import { getPublicS3Url, getS3Bucket, getS3Client, getS3Region } from '@/lib/s3-client';

const FOLDER = 'hcfi_leads_ktp';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — keep in sync with image-utils

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = leadsLimiter.limit(`ktp:${ip}`);
  if (!rl.success) {
    return tooManyRequestsResponse(
      'Terlalu banyak upload. Silakan coba lagi beberapa saat.',
      rl.retryAfterSec
    );
  }

  // Reject oversized payloads before buffering them into memory.
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES + 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 413 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Content-Type harus multipart/form-data' }, { status: 415 });
  }

  try {
    const bucket = getS3Bucket();
    const region = getS3Region();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File KTP wajib diisi' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const validation = validateImageFile(inputBuffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality: 80 })
      .toBuffer();

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

    const url = getPublicS3Url(key, bucket, region);

    return NextResponse.json({ url });
  } catch (error: unknown) {
    const raw = error instanceof Error ? error.message : 'Upload gagal';
    console.error('[upload-ktp] S3 error:', raw);
    return NextResponse.json({ error: toUserFacingS3Error(raw) }, { status: 500 });
  }
}

